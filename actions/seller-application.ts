"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { SellerApplicationSchema } from "@/schemas/SellerApplicationSchema";
import { auth } from "@/auth";
import { ROLES } from "@/data/roles-and-permissions";
import { getAdminsForSellerApplicationNotification } from "./adminActions";
import { sendSellerApplicationNotificationEmail } from "@/lib/mail";
import { updateUserSession } from "@/lib/session-update";

export const sellerApplication = async (values: z.infer<typeof SellerApplicationSchema>) => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  const userId = session.user.id;

  try {
    // Create seller application and seller document in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create the seller application
      const application = await tx.sellerApplication.create({
        data: {
          userId,
          craftingProcess: values.craftingProcess,
          portfolio: values.portfolio,
          interestInJoining: values.interestInJoining,
        } as any,
      });

      // Create the seller document with temporary values
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const tempShopName = `Temporary Shop ${timestamp}-${randomString}`;
      const tempShopSlug = `temporary-shop-${timestamp}-${randomString}`;

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