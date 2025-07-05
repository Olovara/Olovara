"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { SellerApplicationSchema } from "@/schemas/SellerApplicationSchema";
import { auth } from "@/auth";
import { ROLES, INITIAL_SELLER_PERMISSIONS } from "@/data/roles-and-permissions";
import { getAdminsForSellerApplicationNotification } from "./adminActions";
import { sendSellerApplicationNotificationEmail } from "@/lib/mail";
import { updateUserSession } from "@/lib/session-update";
import { generateReferralCode } from "@/lib/utils";

export const sellerApplication = async (values: z.infer<typeof SellerApplicationSchema>) => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  const userId = session.user.id;

  try {
    // Create seller application and seller document in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create the seller application with all new fields
      const application = await tx.sellerApplication.create({
        data: {
          userId,
          craftingProcess: values.craftingProcess,
          portfolio: values.portfolio,
          interestInJoining: values.interestInJoining,
          websiteOrShopLinks: values.websiteOrShopLinks,
          socialMediaProfiles: values.socialMediaProfiles,
          location: values.location,
          yearsOfExperience: values.yearsOfExperience,
          productTypes: values.productTypes,
          birthdate: values.birthdate,
          agreeToHandmadePolicy: values.agreeToHandmadePolicy,
          certifyOver18: values.certifyOver18,
          agreeToTerms: values.agreeToTerms,
        } as any,
      });

      // Create the seller document with temporary values
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const tempShopName = `Temporary Shop ${timestamp}-${randomString}`;
      const tempShopSlug = `temporary-shop-${timestamp}-${randomString}`;
      
      // Generate a unique temporary connectedAccountId to avoid constraint issues
      const uniqueConnectedAccountId = `temp_${timestamp}_${randomString}`;

      // Generate a unique referral code with retry logic
      let referralCode: string = '';
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 20; // Increased attempts for better reliability

      while (!isUnique && attempts < maxAttempts) {
        referralCode = generateReferralCode();
        
        try {
          // Check if the referral code already exists
          const existingSeller = await tx.seller.findUnique({
            where: { referralCode },
            select: { id: true }
          });
          
          if (!existingSeller) {
            isUnique = true;
          } else {
            attempts++;
            console.log(`Referral code ${referralCode} already exists, trying again...`);
          }
        } catch (error) {
          // If there's an error checking, assume it's not unique and try again
          attempts++;
          console.log(`Error checking referral code ${referralCode}, trying again...`);
        }
      }

      if (!isUnique) {
        throw new Error(`Unable to generate unique referral code after ${maxAttempts} attempts`);
      }

      console.log(`Generated unique referral code: ${referralCode}`);

      await tx.seller.create({
        data: {
          shopName: tempShopName,
          shopNameSlug: tempShopSlug,
          applicationAccepted: false, // Will be set to true when approved
          shopProfileComplete: false, // Will be set to true when profile is completed
          shippingProfileCreated: false, // Will be set to true when shipping profile is created
          isFullyActivated: false, // Will be set to true when all steps are completed
          // Required encrypted fields with temporary values
          encryptedBusinessName: "Temporary Business Name",
          businessNameIV: "temp-iv",
          businessNameSalt: "temp-salt",
          encryptedTaxId: "Temporary Tax ID",
          taxIdIV: "temp-iv",
          taxIdSalt: "temp-salt",
          taxCountry: "US", // Default to US, can be updated later
          // Use unique temporary connectedAccountId to avoid constraint issues
          connectedAccountId: uniqueConnectedAccountId,
          // Assign the unique referral code
          referralCode: referralCode!,
          user: {
            connect: {
              id: userId
            }
          }
        },
      });

      // Update user role to SELLER
      await tx.user.update({
        where: { id: userId },
        data: { 
          role: ROLES.SELLER,
        },
      });

      // Grant initial seller permissions (without product permissions)
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { permissions: true },
      });

      if (user) {
        const existingPermissions = user.permissions as any[] || [];
        
        // Create permission objects for initial seller permissions
        const newPermissions = INITIAL_SELLER_PERMISSIONS.map(permission => ({
          permission,
          grantedAt: new Date(),
          grantedBy: 'system',
          reason: 'Initial seller permissions granted upon application submission',
          expiresAt: null,
        }));

        // Combine existing and new permissions, avoiding duplicates
        const updatedPermissions = [...existingPermissions];
        newPermissions.forEach(newPerm => {
          const exists = updatedPermissions.some(existing => existing.permission === newPerm.permission);
          if (!exists) {
            updatedPermissions.push(newPerm);
          }
        });

        // Update user with new permissions
        await tx.user.update({
          where: { id: userId },
          data: { permissions: updatedPermissions },
        });
      }

      return application;
    });

    // Update session to include seller onboarding data
    await updateUserSession(userId);

    // Send notifications to admins (outside of transaction to avoid blocking)
    try {
      const admins = await getAdminsForSellerApplicationNotification();
      const applicant = await db.user.findUnique({
        where: { id: userId },
        select: { username: true, email: true }
      });

      if (applicant && applicant.email && admins.length > 0) {
        // Send emails to all relevant admins
        const emailPromises = admins
          .filter(admin => admin.user.email) // Only send to admins with valid emails
          .map(admin => 
            sendSellerApplicationNotificationEmail(
              admin.user.email!,
              admin.user.username || 'Admin',
              applicant.username || 'Unknown',
              applicant.email!,
              result.id
            ).catch(error => {
              console.error(`Failed to send notification to admin ${admin.user.email}:`, error);
              return null; // Don't fail the whole process if one email fails
            })
          );

        // Wait for all emails to be sent (but don't block the response)
        Promise.all(emailPromises).then(() => {
          console.log(`Sent seller application notifications to ${emailPromises.length} admins`);
        });
      }
    } catch (notificationError) {
      console.error("Error sending admin notifications:", notificationError);
      // Don't fail the application submission if notifications fail
    }

    return { success: "Application submitted successfully!" };
  } catch (error) {
    console.error("Error submitting seller application:", error);
    return { error: "Something went wrong!" };
  }
};