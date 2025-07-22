"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { SellerApplicationSchema } from "@/schemas/SellerApplicationSchema";
import { auth } from "@/auth";
import { ROLES, INITIAL_SELLER_PERMISSIONS } from "@/data/roles-and-permissions";
import { getAdminsForSellerApplicationNotification } from "./adminActions";
import { sendSellerApplicationNotificationEmail } from "@/lib/mail";
import { encryptData } from "@/lib/encryption";

import { FOUNDING_SELLER_BENEFITS } from "@/lib/founding-seller";

export const sellerApplication = async (values: z.infer<typeof SellerApplicationSchema>) => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  const userId = session.user.id;

  try {
    // Validate referral code if provided
    if (values.referralCode) {
      // First check the format
      const pattern = /^YARNNU-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
      if (!pattern.test(values.referralCode)) {
        return { error: "Invalid referral code format. Please use the format YARNNU-XXXX-XXXX." };
      }

      // Check if the referral code exists and belongs to a real user
      const referrer = await db.user.findUnique({
        where: { referralCode: values.referralCode },
        select: { id: true, username: true }
      });

      if (!referrer) {
        return { error: "Referral code not found. Please check the code and try again, or leave it blank if you don't have one." };
      }

      // Check if the user is trying to use their own referral code
      const currentUser = await db.user.findUnique({
        where: { id: userId },
        select: { referralCode: true }
      });

      if (currentUser?.referralCode === values.referralCode) {
        return { error: "You cannot use your own referral code." };
      }

      // Check if the user has already been referred by someone
      const existingReferral = await db.user.findUnique({
        where: { id: userId },
        select: { referredBy: true }
      });

      if (existingReferral?.referredBy) {
        return { error: "You have already been referred by someone else." };
      }

      console.log(`Valid referral code provided: ${values.referralCode} by user ${referrer.username || referrer.id}`);
    }

    // Create seller application and seller document in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create the seller application with all new fields
      const application = await tx.sellerApplication.create({
        data: {
          userId,
          craftingProcess: values.craftingProcess,
          productTypes: values.productTypes,
          interestInJoining: values.interestInJoining,
          onlinePresence: values.onlinePresence,
          yearsOfExperience: values.yearsOfExperience,
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

      // Note: Referral code is now generated during user signup, not during seller application

      // Properly encrypt temporary tax information
      const tempBusinessName = "Temporary Business Name";
      const tempTaxId = "Temporary Tax ID";
      
      const encryptedBusinessName = encryptData(tempBusinessName);
      const encryptedTaxId = encryptData(tempTaxId);

      await tx.seller.create({
        data: {
          shopName: tempShopName,
          shopNameSlug: tempShopSlug,
          applicationAccepted: false, // Will be set to true when approved
          shopProfileComplete: false, // Will be set to true when profile is completed
          shippingProfileCreated: false, // Will be set to true when shipping profile is created
          isFullyActivated: false, // Will be set to true when all steps are completed
          // Required encrypted fields with properly encrypted temporary values
          encryptedBusinessName: encryptedBusinessName.encrypted,
          businessNameIV: encryptedBusinessName.iv,
          businessNameSalt: encryptedBusinessName.salt,
          encryptedTaxId: encryptedTaxId.encrypted,
          taxIdIV: encryptedTaxId.iv,
          taxIdSalt: encryptedTaxId.salt,
          taxCountry: "US", // Default to US, can be updated later
          // Use unique temporary connectedAccountId to avoid constraint issues
          connectedAccountId: uniqueConnectedAccountId,
          // Founding Seller Program - TEMPORARY: Mark all new sellers as legacy
          // TODO: Remove this after campaign launch and implement proper founding seller logic
          // When ready to track signups: remove these lines and implement checkFoundingSellerEligibility
          isFoundingSeller: true,
          foundingSellerType: "LEGACY",
          foundingSellerNumber: null, // Legacy sellers don't get numbers
          foundingSellerBenefits: FOUNDING_SELLER_BENEFITS,
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

      // Handle referral tracking if a referral code was provided
      if (values.referralCode) {
        // Find the referrer
        const referrer = await tx.user.findUnique({
          where: { referralCode: values.referralCode },
          select: { id: true }
        });

        if (referrer) {
          // Update the applicant's referredBy field
          await tx.user.update({
            where: { id: userId },
            data: { referredBy: values.referralCode }
          });

          // Increment the referrer's referral count
          await tx.user.update({
            where: { id: referrer.id },
            data: { 
              referralCount: {
                increment: 1
              }
            }
          });

          console.log(`Referral tracked: User ${userId} was referred by ${referrer.id} using code ${values.referralCode}`);
        }
      }

      // Grant initial seller permissions (without product permissions)
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { permissions: true },
      });

      if (user) {
        const existingPermissions = user.permissions as any[] || [];
        
        console.log("SellerApplication - Current user permissions:", {
          userId,
          existingPermissionsCount: existingPermissions.length,
          existingPermissions: existingPermissions.map(p => p.permission)
        });
        
        // Create permission objects for initial seller permissions
        const newPermissions = INITIAL_SELLER_PERMISSIONS.map(permission => ({
          permission,
          grantedAt: new Date(),
          grantedBy: 'system',
          reason: 'Initial seller permissions granted upon application submission',
          expiresAt: null,
        }));

        console.log("SellerApplication - Granting new permissions:", {
          userId,
          newPermissionsCount: newPermissions.length,
          newPermissions: newPermissions.map(p => p.permission)
        });

        // Combine existing and new permissions, avoiding duplicates
        const updatedPermissions = [...existingPermissions];
        newPermissions.forEach(newPerm => {
          const exists = updatedPermissions.some(existing => existing.permission === newPerm.permission);
          if (!exists) {
            updatedPermissions.push(newPerm);
          }
        });

        console.log("SellerApplication - Final permissions after update:", {
          userId,
          finalPermissionsCount: updatedPermissions.length,
          finalPermissions: updatedPermissions.map(p => p.permission)
        });

        // Update user with new permissions
        await tx.user.update({
          where: { id: userId },
          data: { permissions: updatedPermissions },
        });
      }

      return application;
    });

    // Note: Session refresh is now handled by the client-side page reload
    // The user's role and permissions have been updated in the database
    console.log("Seller application submitted successfully. User role and permissions updated.");

    // Send notifications to admins (outside of transaction to avoid blocking)
    try {
      console.log("Starting admin notification process...");
      const admins = await getAdminsForSellerApplicationNotification();
      console.log(`Found ${admins.length} admins to notify`);
      
      const applicant = await db.user.findUnique({
        where: { id: userId },
        select: { username: true, email: true }
      });

      console.log("Applicant details:", {
        username: applicant?.username,
        email: applicant?.email,
        hasEmail: !!applicant?.email
      });

      if (applicant && applicant.email && admins.length > 0) {
        console.log(`Sending notifications to ${admins.length} admins...`);
        
        // Send emails to all relevant admins
        const emailPromises = admins
          .filter(admin => admin.user.email) // Only send to admins with valid emails
          .map(admin => {
            console.log(`Sending email to admin: ${admin.user.email} (${admin.user.username})`);
            return sendSellerApplicationNotificationEmail(
              admin.user.email!,
              admin.user.username || 'Admin',
              applicant.username || 'Unknown',
              applicant.email!,
              result.id
            ).catch(error => {
              console.error(`Failed to send notification to admin ${admin.user.email}:`, error);
              return null; // Don't fail the whole process if one email fails
            });
          });

        // Wait for all emails to be sent (but don't block the response)
        Promise.all(emailPromises).then((results) => {
          const successfulEmails = results.filter(result => result !== null).length;
          console.log(`Successfully sent seller application notifications to ${successfulEmails} out of ${emailPromises.length} admins`);
        });
      } else {
        console.log("No admins to notify or missing applicant email:", {
          hasApplicant: !!applicant,
          hasApplicantEmail: !!applicant?.email,
          adminsCount: admins.length
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