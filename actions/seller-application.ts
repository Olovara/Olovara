"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { SellerApplicationSchema } from "@/schemas/SellerApplicationSchema";
import { auth } from "@/auth";
import { updateOnboardingStep } from "@/lib/onboarding";
import {
  ROLES,
  INITIAL_SELLER_PERMISSIONS,
} from "@/data/roles-and-permissions";
import { getAdminsForSellerApplicationNotification } from "./adminActions";
import { sendSellerApplicationNotificationEmail } from "@/lib/mail";
import { encryptData, encryptBirthdate } from "@/lib/encryption";
import { logError } from "@/lib/error-logger";

export const sellerApplication = async (
  values: z.infer<typeof SellerApplicationSchema>
) => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  const userId = session.user.id;

  try {
    // Check if user already has a seller profile (prevent duplicate applications)
    const existingSeller = await db.seller.findUnique({
      where: { userId },
      select: { id: true, applicationAccepted: true },
    });

    if (existingSeller) {
      // If seller already exists and application was accepted, they're already a seller
      if (existingSeller.applicationAccepted) {
        return { error: "You are already a registered seller." };
      }
      // If seller exists but application not accepted, allow them to submit again (maybe they want to update)
      // We'll handle this in the transaction by finding the existing seller
    }

    // Validate referral code if provided
    if (values.referralCode) {
      // First check the format
      const pattern = /^YARNNU-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
      if (!pattern.test(values.referralCode)) {
        return {
          error:
            "Invalid referral code format. Please use the format YARNNU-XXXX-XXXX.",
        };
      }

      // Check if the referral code exists and belongs to a real user
      const referrer = await db.user.findUnique({
        where: { referralCode: values.referralCode },
        select: { id: true, username: true },
      });

      if (!referrer) {
        return {
          error:
            "Referral code not found. Please check the code and try again, or leave it blank if you don't have one.",
        };
      }

      // Check if the user is trying to use their own referral code
      const currentUser = await db.user.findUnique({
        where: { id: userId },
        select: { referralCode: true },
      });

      if (currentUser?.referralCode === values.referralCode) {
        return { error: "You cannot use your own referral code." };
      }

      // Check if the user has already been referred by someone
      const existingReferral = await db.user.findUnique({
        where: { id: userId },
        select: { referredBy: true },
      });

      if (existingReferral?.referredBy) {
        return { error: "You have already been referred by someone else." };
      }

      console.log(
        `Valid referral code provided: ${values.referralCode} by user ${referrer.username || referrer.id}`
      );
    }

    // Create seller application and seller document in a transaction
    const result = await db.$transaction(async (tx) => {
      // Encrypt birthdate data
      const birthdateEncryption = encryptBirthdate(values.birthdate);

      // Create the seller application with all new fields
      const application = await tx.sellerApplication.create({
        data: {
          userId,
          craftingProcess: values.craftingProcess,
          productTypes: values.productTypes,
          interestInJoining: values.interestInJoining,
          onlinePresence: values.onlinePresence,
          yearsOfExperience: values.yearsOfExperience,
          referralCode: values.referralCode, // Store the referral code used
          encryptedBirthdate: birthdateEncryption.encryptedBirthdate,
          birthdateIV: birthdateEncryption.birthdateIV,
          birthdateSalt: birthdateEncryption.birthdateSalt,
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

      // No longer need to encrypt temporary tax information since we removed tax fields

      // Check if seller already exists (in case of retry or partial failure)
      let seller = await tx.seller.findUnique({
        where: { userId },
      });

      // Only create seller if it doesn't exist
      if (!seller) {
        // Note: Founding seller status is NOT assigned here anymore
        // It will be assigned when the seller creates their first product
        // This ensures only serious sellers who actually create products become founding sellers
        seller = await tx.seller.create({
          data: {
            shopName: tempShopName,
            shopNameSlug: tempShopSlug,
            applicationAccepted: false, // Will be set to true when approved
            isFullyActivated: false, // Will be set to true when all steps are completed
            // Default shop country
            shopCountry: "US", // Default to US, can be updated later
            // Use unique temporary connectedAccountId to avoid constraint issues
            connectedAccountId: uniqueConnectedAccountId,
            // Founding seller status will be assigned when they create their first product
            isFoundingSeller: false,
            foundingSellerType: null,
            foundingSellerNumber: null,
            foundingSellerBenefits: null,
            user: {
              connect: {
                id: userId,
              },
            },
          },
        });
      }

      // Get the STARTER plan (free plan)
      const starterPlan = await tx.subscriptionPlan.findUnique({
        where: { name: "STARTER" },
      });

      if (!starterPlan) {
        throw new Error(
          "STARTER subscription plan not found. Please seed subscription plans first."
        );
      }

      // Check if subscription already exists for this seller
      const existingSubscription = await tx.sellerSubscription.findUnique({
        where: { sellerId: seller.id },
      });

      if (existingSubscription) {
        // Update existing subscription to ensure it's on STARTER plan and active
        // Also migrate null stripeSubscriptionId to the placeholder pattern if needed
        const updateData: any = {
          planId: starterPlan.id,
          status: "ACTIVE",
        };

        // If stripeSubscriptionId is null, migrate it to the placeholder pattern
        if (
          !existingSubscription.stripeSubscriptionId ||
          existingSubscription.stripeSubscriptionId === null
        ) {
          updateData.stripeSubscriptionId = `free_${seller.id}`;
        }

        // If websiteSlug is null, migrate it to the placeholder pattern (only STUDIO plans have websites)
        if (
          !existingSubscription.websiteSlug ||
          existingSubscription.websiteSlug === null
        ) {
          updateData.websiteSlug = `no_website_${seller.id}`;
        }

        await tx.sellerSubscription.update({
          where: { sellerId: seller.id },
          data: updateData,
        });
      } else {
        // Create new subscription for free STARTER plan
        // Use unique placeholder values to avoid unique constraint issues with MongoDB
        // MongoDB unique indexes only allow ONE null value, so we use patterns:
        // - stripeSubscriptionId: free_{sellerId} (indicates free plan, not Stripe subscription)
        // - websiteSlug: no_website_{sellerId} (indicates no website, only STUDIO plans have websites)
        await tx.sellerSubscription.create({
          data: {
            sellerId: seller.id,
            planId: starterPlan.id,
            status: "ACTIVE",
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now (free plan)
            stripeSubscriptionId: `free_${seller.id}`, // Unique placeholder for free plans
            websiteSlug: `no_website_${seller.id}`, // Unique placeholder for non-STUDIO plans (no website access)
            // No trialEndsAt for free plan
          },
        });
      }

      // Update user role to SELLER
      await tx.user.update({
        where: { id: userId },
        data: {
          role: ROLES.SELLER,
        },
      });

      // Handle referral tracking if a referral code was provided
      if (values.referralCode) {
        // Find the referrer and their seller info
        const referrer = await tx.user.findUnique({
          where: { referralCode: values.referralCode },
          select: {
            id: true,
            seller: {
              select: {
                id: true,
                hasCommissionDiscount: true,
                commissionDiscountExpiresAt: true,
                commissionDiscountMonths: true,
                isFoundingSeller: true,
              },
            },
          },
        });

        if (referrer && referrer.seller) {
          // Update the applicant's referredBy field
          await tx.user.update({
            where: { id: userId },
            data: { referredBy: values.referralCode },
          });

          // Increment the referrer's referral count
          await tx.user.update({
            where: { id: referrer.id },
            data: {
              referralCount: {
                increment: 1,
              },
            },
          });

          // Calculate commission discount for referrer
          const newReferralCount =
            (referrer.seller.commissionDiscountMonths || 0) + 1;
          const milestone = Math.floor(newReferralCount / 3);

          if (milestone > 0) {
            // Calculate new expiration date
            const now = new Date();
            let newExpirationDate: Date;

            if (
              referrer.seller.hasCommissionDiscount &&
              referrer.seller.commissionDiscountExpiresAt
            ) {
              // Extend existing discount by 1 month
              newExpirationDate = new Date(
                referrer.seller.commissionDiscountExpiresAt
              );
              newExpirationDate.setMonth(newExpirationDate.getMonth() + 1);
            } else {
              // Start new discount for 1 month
              newExpirationDate = new Date(now);
              newExpirationDate.setMonth(newExpirationDate.getMonth() + 1);
            }

            // Update seller's commission discount
            await tx.seller.update({
              where: { id: referrer.seller.id },
              data: {
                hasCommissionDiscount: true,
                commissionDiscountExpiresAt: newExpirationDate,
                commissionDiscountMonths: newReferralCount,
              },
            });

            console.log(
              `Commission discount updated for seller ${referrer.id}: ${milestone} month(s) discount until ${newExpirationDate.toISOString()}`
            );
          }
        }
      }

      // Handle commission discount for the applicant if they used a referral code
      if (values.referralCode) {
        // The applicant gets a 1-month commission discount for using a referral code
        const now = new Date();
        const applicantDiscountExpiration = new Date(now);
        applicantDiscountExpiration.setMonth(
          applicantDiscountExpiration.getMonth() + 1
        );

        // Update the newly created seller record with commission discount
        await tx.seller.update({
          where: { userId: userId },
          data: {
            hasCommissionDiscount: true,
            commissionDiscountExpiresAt: applicantDiscountExpiration,
            commissionDiscountMonths: 1, // They get 1 month for using a referral code
          },
        });

        console.log(
          `Commission discount granted to applicant ${userId} for using referral code: 1 month discount until ${applicantDiscountExpiration.toISOString()}`
        );
      }

      // Grant initial seller permissions (without product permissions)
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { permissions: true },
      });

      if (user) {
        const existingPermissions = (user.permissions as any[]) || [];

        console.log("SellerApplication - Current user permissions:", {
          userId,
          existingPermissionsCount: existingPermissions.length,
          existingPermissions: existingPermissions.map((p) => p.permission),
        });

        // Create permission objects for initial seller permissions
        const newPermissions = INITIAL_SELLER_PERMISSIONS.map((permission) => ({
          permission,
          grantedAt: new Date(),
          grantedBy: "system",
          reason:
            "Initial seller permissions granted upon application submission",
          expiresAt: null,
        }));

        console.log("SellerApplication - Granting new permissions:", {
          userId,
          newPermissionsCount: newPermissions.length,
          newPermissions: newPermissions.map((p) => p.permission),
        });

        // Combine existing and new permissions, avoiding duplicates
        const updatedPermissions = [...existingPermissions];
        newPermissions.forEach((newPerm) => {
          const exists = updatedPermissions.some(
            (existing) => existing.permission === newPerm.permission
          );
          if (!exists) {
            updatedPermissions.push(newPerm);
          }
        });

        console.log("SellerApplication - Final permissions after update:", {
          userId,
          finalPermissionsCount: updatedPermissions.length,
          finalPermissions: updatedPermissions.map((p) => p.permission),
        });

        // Update user with new permissions
        await tx.user.update({
          where: { id: userId },
          data: { permissions: updatedPermissions },
        });
      }

      return { application, sellerId: seller.id };
    });

    // Note: Session refresh is now handled by the client-side page reload
    // The user's role and permissions have been updated in the database
    // Mark application_submitted step as completed
    await updateOnboardingStep(result.sellerId, "application_submitted", true);

    console.log(
      "Seller application submitted successfully. User role and permissions updated."
    );

    // Send notifications to admins (outside of transaction to avoid blocking)
    try {
      console.log("Starting admin notification process...");
      const admins = await getAdminsForSellerApplicationNotification();
      console.log(`Found ${admins.length} admins to notify`);

      const applicant = await db.user.findUnique({
        where: { id: userId },
        select: { username: true, email: true },
      });

      console.log("Applicant details:", {
        username: applicant?.username,
        email: applicant?.email,
        hasEmail: !!applicant?.email,
      });

      if (applicant && applicant.email && admins.length > 0) {
        console.log(`Sending notifications to ${admins.length} admins...`);

        // Send emails to all relevant admins
        const emailPromises = admins
          .filter((admin) => admin.user.email) // Only send to admins with valid emails
          .map((admin) => {
            console.log(
              `Sending email to admin: ${admin.user.email} (${admin.user.username})`
            );
            return sendSellerApplicationNotificationEmail(
              admin.user.email!,
              admin.user.username || "Admin",
              applicant.username || "Unknown",
              applicant.email!,
              result.application.id
            ).catch((error) => {
              console.error(
                `Failed to send notification to admin ${admin.user.email}:`,
                error
              );
              return null; // Don't fail the whole process if one email fails
            });
          });

        // Wait for all emails to be sent (but don't block the response)
        Promise.all(emailPromises).then((results) => {
          const successfulEmails = results.filter(
            (result) => result !== null
          ).length;
          console.log(
            `Successfully sent seller application notifications to ${successfulEmails} out of ${emailPromises.length} admins`
          );
        });
      } else {
        console.log("No admins to notify or missing applicant email:", {
          hasApplicant: !!applicant,
          hasApplicantEmail: !!applicant?.email,
          adminsCount: admins.length,
        });
      }
    } catch (notificationError) {
      console.error("Error sending admin notifications:", notificationError);
      // Don't fail the application submission if notifications fail
    }

    return { success: "Application submitted successfully!" };
  } catch (error) {
    const userMessage = logError({
      code: "SELLER_APPLICATION_FAILED",
      userId,
      route: "/actions/seller-application",
      method: "POST",
      error,
      metadata: {
        hasReferralCode: !!values.referralCode,
        craftingProcess: values.craftingProcess,
        productTypes: values.productTypes,
      },
    });
    return { error: userMessage };
  }
};
