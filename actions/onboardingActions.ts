"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { encryptData, decryptData } from "@/lib/encryption";
import { updateOnboardingStep } from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";
import { recalculateOnboardingSteps } from "@/lib/onboarding";
import { logError } from "@/lib/error-logger";
import {
  assignFoundingSellerStatus,
  checkFoundingSellerEligibility,
} from "@/lib/founding-seller";

/**
 * Recalculate onboarding steps when seller settings change
 * This should be called when:
 * - Seller changes shop country
 * - Seller updates shipping exclusions
 * - Seller creates/updates products
 */
export async function recalculateSellerOnboardingSteps() {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Get the seller record
    const seller = await prisma.seller.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!seller) {
      return { error: "Seller not found" };
    }

    // Recalculate onboarding steps
    await recalculateOnboardingSteps(seller.id);

    return { success: true };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error recalculating onboarding steps:", error);

    // Log to database - user could email about "onboarding steps not updating"
    const userMessage = logError({
      code: "ONBOARDING_STEPS_RECALCULATE_FAILED",
      userId: session?.user?.id,
      route: "actions/onboardingActions",
      method: "recalculateSellerOnboardingSteps",
      error,
      metadata: {
        note: "Failed to recalculate onboarding steps",
      },
    });

    return { error: userMessage };
  }
}

/**
 * Update seller shop country and recalculate onboarding steps
 */
export async function updateSellerShopCountry(countryCode: string) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Update seller shop country
    await prisma.seller.update({
      where: { userId: session.user.id },
      data: { shopCountry: countryCode },
    });

    // Recalculate onboarding steps
    await recalculateSellerOnboardingSteps();

    return { success: true };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error updating seller shop country:", error);

    // Log to database - user could email about "couldn't update shop country"
    const userMessage = logError({
      code: "ONBOARDING_SHOP_COUNTRY_UPDATE_FAILED",
      userId: session?.user?.id,
      route: "actions/onboardingActions",
      method: "updateSellerShopCountry",
      error,
      metadata: {
        countryCode,
        note: "Failed to update shop country",
      },
    });

    return { error: userMessage };
  }
}

/**
 * Update seller shipping exclusions and recalculate onboarding steps
 */
export async function updateSellerShippingExclusions(
  excludedCountries: string[]
) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Update seller shipping exclusions
    await prisma.seller.update({
      where: { userId: session.user.id },
      data: { excludedCountries },
    });

    // Recalculate onboarding steps
    await recalculateSellerOnboardingSteps();

    return { success: true };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error updating shipping exclusions:", error);

    // Log to database - user could email about "couldn't update shipping exclusions"
    const userMessage = logError({
      code: "ONBOARDING_SHIPPING_EXCLUSIONS_UPDATE_FAILED",
      userId: session?.user?.id,
      route: "actions/onboardingActions",
      method: "updateSellerShippingExclusions",
      error,
      metadata: {
        excludedCountriesCount: excludedCountries?.length,
        note: "Failed to update shipping exclusions",
      },
    });

    return { error: userMessage };
  }
}

// Schema for help preferences
const HelpPreferencesSchema = z.object({
  helpCategories: z.array(z.string()).optional(),
});

// Schema for shop preferences
const ShopPreferencesSchema = z.object({
  country: z.string().min(1, "Country is required"),
  currency: z.string().min(1, "Currency is required"),
  language: z.string().optional().default("en"),
});

// Schema for shop name
const ShopNameSchema = z.object({
  shopName: z
    .string()
    .min(3, "Shop name must be at least 3 characters")
    .max(30, "Shop name must be 30 characters or less"),
});

// Schema for first product
const FirstProductSchema = z.object({
  name: z
    .string()
    .min(3, "Product name must be at least 3 characters")
    .max(100, "Product name must be 100 characters or less"),
  category: z.string().min(1, "Category is required"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be 2000 characters or less"),
  shortDescription: z.string(),
  shortDescriptionBullets: z
    .array(z.string())
    .max(5, "Maximum 5 bullet points allowed")
    .default([]),
  price: z.number().positive("Price must be greater than 0"),
  materials: z.string().optional(),
  dimensions: z.string().optional(),
  weight: z.string().optional(),
  processingTime: z.string().optional(),
  isDigital: z.boolean().default(false),
  freeShipping: z.boolean().default(false),
  shippingCost: z.number().min(0).default(0),
  shippingOptionId: z.string().optional(),
  images: z.array(z.string().url()).optional().default([]), // Image URLs array
});

// Schema for first name
const FirstNameSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be 50 characters or less"),
});

// Schema for handmade verification
const HandmadeVerificationSchema = z.object({
  productPhoto: z.string().url("Product photo URL is required"),
  workstationPhoto: z.string().url("Workstation photo URL is required"),
});

export const saveHelpPreferences = async (
  data: z.infer<typeof HelpPreferencesSchema>
) => {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return { error: "User not authenticated." };
    }

    // Validate the data
    const validatedData = HelpPreferencesSchema.parse(data);

    // Save help preferences to the user record
    await db.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        helpPreferences: validatedData.helpCategories || [],
      },
    });

    console.log("Help preferences saved successfully:", validatedData);
    return { success: "Help preferences saved successfully!" };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error saving help preferences:", error);

    // Don't log Zod validation errors - they're expected client-side issues
    if (error instanceof z.ZodError) {
      return { error: "Invalid help preferences data." };
    }

    // Log to database - user could email about "couldn't save help preferences"
    const userMessage = logError({
      code: "ONBOARDING_HELP_PREFERENCES_SAVE_FAILED",
      userId: session?.user?.id,
      route: "actions/onboardingActions",
      method: "saveHelpPreferences",
      error,
      metadata: {
        note: "Failed to save help preferences",
      },
    });

    return { error: userMessage };
  }
};

// Analytics functions for marketing insights
export const getHelpPreferencesAnalytics = async () => {
  try {
    // Get all users with help preferences
    const users = await db.user.findMany({
      where: {
        helpPreferences: {
          isEmpty: false,
        },
      },
      select: {
        helpPreferences: true,
        createdAt: true,
        seller: {
          select: {
            shopName: true,
            shopCountry: true,
          },
        },
      },
    });

    // Calculate analytics
    const totalUsers = users.length;
    const categoryCounts: Record<string, number> = {};
    const recentUsers = users.filter(
      (user) => user.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
    );

    // Count each category
    users.forEach((user) => {
      user.helpPreferences.forEach((category) => {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });
    });

    // Get most popular categories
    const popularCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / totalUsers) * 100),
      }));

    return {
      totalUsers,
      recentUsers: recentUsers.length,
      popularCategories,
      categoryCounts,
    };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error getting help preferences analytics:", error);

    // Log to database - admin could email about "can't get analytics"
    const userMessage = logError({
      code: "ONBOARDING_HELP_PREFERENCES_ANALYTICS_FAILED",
      userId: undefined, // Admin function
      route: "actions/onboardingActions",
      method: "getHelpPreferencesAnalytics",
      error,
      metadata: {
        note: "Failed to get help preferences analytics",
      },
    });

    return { error: userMessage };
  }
};

// Get users by specific help category for targeted marketing
export const getUsersByHelpCategory = async (category: string) => {
  try {
    const users = await db.user.findMany({
      where: {
        helpPreferences: {
          has: category,
        },
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
        seller: {
          select: {
            shopName: true,
            shopCountry: true,
          },
        },
      },
    });

    return { users, count: users.length };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error getting users by help category:", error);

    // Log to database - admin could email about "can't get users by category"
    const userMessage = logError({
      code: "ONBOARDING_GET_USERS_BY_CATEGORY_FAILED",
      userId: undefined, // Admin function
      route: "actions/onboardingActions",
      method: "getUsersByHelpCategory",
      error,
      metadata: {
        category,
        note: "Failed to get users by help category",
      },
    });

    return { error: userMessage };
  }
};

// Get user's help preferences for personalized guidance
export const getUserHelpPreferences = async () => {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return { error: "User not authenticated." };
    }

    const user = await db.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        helpPreferences: true,
      },
    });

    return { helpPreferences: user?.helpPreferences || [] };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error getting user help preferences:", error);

    // Log to database - user could email about "can't load help preferences"
    const userMessage = logError({
      code: "ONBOARDING_GET_HELP_PREFERENCES_FAILED",
      userId: session?.user?.id,
      route: "actions/onboardingActions",
      method: "getUserHelpPreferences",
      error,
      metadata: {
        note: "Failed to get user help preferences",
      },
    });

    return { error: userMessage };
  }
};

export const saveShopPreferences = async (
  data: z.infer<typeof ShopPreferencesSchema>
) => {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return { error: "User not authenticated." };
    }

    // Validate the data
    const validatedData = ShopPreferencesSchema.parse(data);

    // Update or create the seller record with shop preferences
    const seller = await db.seller.upsert({
      where: {
        userId: session.user.id,
      },
      update: {
        shopCountry: validatedData.country,
        preferredCurrency: validatedData.currency,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        shopCountry: validatedData.country,
        preferredCurrency: validatedData.currency,
        shopName: "", // Will be set in shop naming step
        shopNameSlug: "", // Will be set in shop naming step
      },
    });

    // Mark shop_preferences step as completed
    await updateOnboardingStep(seller.id, "shop_preferences", true);

    console.log("Shop preferences saved successfully:", validatedData);
    return { success: "Shop preferences saved successfully!" };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error saving shop preferences:", error);

    // Don't log Zod validation errors - they're expected client-side issues
    if (error instanceof z.ZodError) {
      return { error: "Invalid shop preferences data." };
    }

    // Log to database - user could email about "couldn't save shop preferences"
    const userMessage = logError({
      code: "ONBOARDING_SHOP_PREFERENCES_SAVE_FAILED",
      userId: session?.user?.id,
      route: "actions/onboardingActions",
      method: "saveShopPreferences",
      error,
      metadata: {
        country: data?.country,
        currency: data?.currency,
        note: "Failed to save shop preferences",
      },
    });

    return { error: userMessage };
  }
};

export const saveShopName = async (data: z.infer<typeof ShopNameSchema>) => {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return { error: "User not authenticated." };
    }

    // Validate the data
    const validatedData = ShopNameSchema.parse(data);

    // Check if shop name is available
    const shopName = validatedData.shopName.trim();

    // Basic validation
    if (shopName.toLowerCase().includes("yarnnu")) {
      return { error: "Shop name cannot contain 'Yarnnu'." };
    }

    // Check if shop name is already taken (excluding current user's own shop)
    const existingSeller = await db.seller.findFirst({
      where: {
        shopName: {
          equals: shopName,
          mode: "insensitive", // Case-insensitive search
        },
        userId: {
          not: session.user.id, // Exclude current user's own shop
        },
      },
    });

    if (existingSeller) {
      return {
        error:
          "This shop name is already taken. Please choose a different name.",
      };
    }

    // Create URL-friendly slug
    const shopNameSlug = shopName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Check if slug is already taken (excluding current user's own shop)
    const existingSlug = await db.seller.findFirst({
      where: {
        shopNameSlug: {
          equals: shopNameSlug,
          mode: "insensitive",
        },
        userId: {
          not: session.user.id, // Exclude current user's own shop
        },
      },
    });

    if (existingSlug) {
      return {
        error:
          "This shop name creates a URL that's already taken. Please choose a different name.",
      };
    }

    // Check if seller record already exists (from shop preferences step)
    const existingSellerRecord = await db.seller.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    // Update the seller record with the shop name
    // The seller record should already exist from the shop preferences step
    const seller = await db.seller.update({
      where: {
        userId: session.user.id,
      },
      data: {
        shopName: shopName,
        shopNameSlug: shopNameSlug,
        updatedAt: new Date(),
      },
    });

    // Mark shop_naming step as completed
    await updateOnboardingStep(seller.id, "shop_naming", true);

    console.log("Shop name saved successfully:", shopName);
    return { success: "Shop name saved successfully!", shopName: shopName };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error saving shop name:", error);

    // Don't log Zod validation errors - they're expected client-side issues
    if (error instanceof z.ZodError) {
      return { error: "Invalid shop name data." };
    }

    // Log to database - user could email about "couldn't save shop name"
    const userMessage = logError({
      code: "ONBOARDING_SHOP_NAME_SAVE_FAILED",
      userId: session?.user?.id,
      route: "actions/onboardingActions",
      method: "saveShopName",
      error,
      metadata: {
        shopName: data?.shopName,
        note: "Failed to save shop name",
      },
    });

    return { error: userMessage };
  }
};

export const createFirstProduct = async (
  data: z.infer<typeof FirstProductSchema>
) => {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let userId: string | undefined = undefined;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return { error: "User not authenticated." };
    }

    // Extract userId to ensure TypeScript knows it's defined
    // Create const for TypeScript type narrowing
    const currentUserId: string = session.user.id;
    userId = currentUserId; // Also assign to outer variable for catch block

    // Validate the data
    const validatedData = FirstProductSchema.parse(data);

    // Check if user has a seller account
    const seller = await db.seller.findUnique({
      where: {
        userId: currentUserId,
      },
      select: {
        id: true,
        userId: true,
        applicationAccepted: true,
        isFullyActivated: true,
        isFoundingSeller: true, // Check if already a founding seller
      },
    });

    if (!seller) {
      return {
        error: "Seller account not found. Please complete shop setup first.",
      };
    }

    // Check if this is the seller's first product (before creating it)
    const existingProductCount = await db.product.count({
      where: { userId: currentUserId },
    });
    const isFirstProduct = existingProductCount === 0;

    // Determine product status based on seller approval and activation
    // Only allow ACTIVE status if seller is approved and fully activated
    // Otherwise, create as DRAFT so seller can complete onboarding first
    const productStatus =
      seller.applicationAccepted && seller.isFullyActivated
        ? "ACTIVE"
        : "DRAFT";

    // Use transaction to ensure atomicity
    const result = await db.$transaction(async (tx) => {
      // Create the product
      const product = await tx.product.create({
        data: {
          userId: currentUserId,
          name: validatedData.name,
          shortDescription: validatedData.shortDescription,
          shortDescriptionBullets: validatedData.shortDescriptionBullets || [],
          description: {
            text: validatedData.description,
            materials: validatedData.materials || "",
            dimensions: validatedData.dimensions || "",
            weight: validatedData.weight || "",
            processingTime: validatedData.processingTime || "3-5 business days",
          },
          price: Math.round(validatedData.price * 100), // Convert to cents
          currency: "USD", // Default currency
          status: productStatus, // Set status based on seller approval/activation
          primaryCategory: validatedData.category,
          secondaryCategory: validatedData.category, // Use same category for secondary
          isDigital: validatedData.isDigital || false,
          stock: 1, // Default stock
          images: validatedData.images || [], // Use provided images or empty array
          tags: [], // Empty array for now
          materialTags: validatedData.materials
            ? [validatedData.materials]
            : [],
          inStockProcessingTime: validatedData.processingTime
            ? parseInt(validatedData.processingTime.split("-")[0])
            : 3,
          itemWeightUnit: "lbs", // Default weight unit
          itemDimensionUnit: "in", // Default dimension unit
          taxCategory: validatedData.isDigital
            ? "DIGITAL_GOODS"
            : "PHYSICAL_GOODS",
          freeShipping: validatedData.freeShipping || false,
          shippingCost: Math.round((validatedData.shippingCost || 0) * 100), // Convert to cents
          shippingOptionId: validatedData.shippingOptionId || null,
        },
      });

      // Update seller's total products count using seller.id for reliability
      await tx.seller.update({
        where: {
          id: seller.id, // Use seller.id instead of userId for more reliable lookup
        },
        data: {
          totalProducts: {
            increment: 1,
          },
          firstProductCreatedAt: new Date(),
        },
      });

      return product;
    });

    // If this is their first product, check for founding seller eligibility
    // Only assign founding seller status if they don't already have it
    if (isFirstProduct && !seller.isFoundingSeller) {
      console.log(
        `First product created for seller ${currentUserId}, checking founding seller eligibility...`
      );

      const eligibility = await checkFoundingSellerEligibility(currentUserId);
      console.log(
        `Founding seller eligibility for ${currentUserId}:`,
        eligibility
      );

      if (eligibility.eligible) {
        const result = await assignFoundingSellerStatus(
          currentUserId,
          new Date()
        );
        if (result.success) {
          console.log(
            `🎉 Congratulations! Seller ${currentUserId} is now Founding Seller #${result.status?.number}`
          );
        } else {
          console.error(
            `Failed to assign founding seller status to ${currentUserId}:`,
            result.error
          );
        }
      } else {
        console.log(
          `Seller ${currentUserId} not eligible for founding seller status: ${eligibility.reason}`
        );
      }
    }

    // Note: We don't mark first_product as completed since it's not a required step
    // Product creation is optional and sellers can create products whenever they want

    console.log(
      "First product created successfully:",
      result.id,
      "Status:",
      productStatus
    );

    // Return appropriate message based on status
    const message =
      productStatus === "DRAFT"
        ? "Product created as draft. Complete your onboarding to activate it."
        : "First product created successfully!";

    return {
      success: message,
      productId: result.id,
      status: productStatus,
      isDraft: productStatus === "DRAFT",
    };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error creating first product:", error);
    // Provide more detailed error message
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack);
    }

    // Don't log Zod validation errors - they're expected client-side issues
    if (error instanceof z.ZodError) {
      return { error: "Invalid product data." };
    }

    // Log to database - user could email about "couldn't create first product"
    const userMessage = logError({
      code: "ONBOARDING_FIRST_PRODUCT_CREATE_FAILED",
      userId,
      route: "actions/onboardingActions",
      method: "createFirstProduct",
      error,
      metadata: {
        productName: data?.name,
        category: data?.category,
        note: "Failed to create first product",
      },
    });

    return { error: userMessage };
  }
};

export const setupStripeAccount = async () => {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return { error: "User not authenticated." };
    }

    console.log("Setting up Stripe account for user:", session.user.id); // Placeholder for Stripe Connect setup
    // In a real implementation, this would:
    // 1. Create a Stripe Connect account link
    // 2. Redirect user to Stripe onboarding
    // 3. Handle the return callback
    return { success: "Stripe account setup initiated!" };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error setting up Stripe account:", error);

    // Log to database - user could email about "couldn't setup Stripe"
    const userMessage = logError({
      code: "ONBOARDING_STRIPE_SETUP_FAILED",
      userId: session?.user?.id,
      route: "actions/onboardingActions",
      method: "setupStripeAccount",
      error,
      metadata: {
        note: "Failed to setup Stripe account",
      },
    });

    return { error: userMessage };
  }
};

export const saveFirstName = async (data: z.infer<typeof FirstNameSchema>) => {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return { error: "User not authenticated." };
    }

    // Validate the data
    const validatedData = FirstNameSchema.parse(data);

    // Encrypt the first name for privacy
    const {
      encrypted: encryptedFirstName,
      iv: firstNameIV,
      salt: firstNameSalt,
    } = encryptData(validatedData.firstName);

    // Update the user record with the encrypted first name
    await db.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        encryptedFirstName: encryptedFirstName,
        firstNameIV: firstNameIV,
        firstNameSalt: firstNameSalt,
        updatedAt: new Date(),
      },
    });

    console.log("First name saved successfully");
    return { success: "First name saved successfully!" };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error saving first name:", error);

    // Don't log Zod validation errors - they're expected client-side issues
    if (error instanceof z.ZodError) {
      return { error: "Invalid first name data." };
    }

    // Log to database - user could email about "couldn't save first name"
    const userMessage = logError({
      code: "ONBOARDING_FIRST_NAME_SAVE_FAILED",
      userId: session?.user?.id,
      route: "actions/onboardingActions",
      method: "saveFirstName",
      error,
      metadata: {
        note: "Failed to save first name",
      },
    });

    return { error: userMessage };
  }
};

export const getUserFirstName = async () => {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return { error: "User not authenticated." };
    }

    // Get user data with encrypted first name
    const user = await db.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        encryptedFirstName: true,
        firstNameIV: true,
        firstNameSalt: true,
      },
    });

    if (!user?.encryptedFirstName || !user?.firstNameIV) {
      return { firstName: null };
    }

    // Decrypt the first name
    const firstName = decryptData(
      user.encryptedFirstName,
      user.firstNameIV,
      user.firstNameSalt!
    );

    return { firstName: firstName || null };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error getting user first name:", error);

    // Log to database - user could email about "can't load first name"
    logError({
      code: "ONBOARDING_GET_FIRST_NAME_FAILED",
      userId: session?.user?.id,
      route: "actions/onboardingActions",
      method: "getUserFirstName",
      error,
      metadata: {
        note: "Failed to get user first name",
      },
    });

    return { firstName: null };
  }
};

export const saveHandmadeVerification = async (
  data: z.infer<typeof HandmadeVerificationSchema>
) => {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return { error: "User not authenticated." };
    }

    // Validate the data
    const validatedData = HandmadeVerificationSchema.parse(data);

    // Get the seller record
    const seller = await db.seller.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!seller) {
      return {
        error: "Seller account not found. Please complete application first.",
      };
    }

    // Update seller with verification photos
    await db.seller.update({
      where: { id: seller.id },
      data: {
        productPhoto: validatedData.productPhoto,
        workstationPhoto: validatedData.workstationPhoto,
        updatedAt: new Date(),
      },
    });

    // Mark handmade_verification step as completed
    await updateOnboardingStep(seller.id, "handmade_verification", true);

    console.log("Handmade verification photos saved successfully");
    return { success: "Verification photos saved successfully!" };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error saving handmade verification:", error);

    // Don't log Zod validation errors - they're expected client-side issues
    if (error instanceof z.ZodError) {
      return { error: "Invalid verification data." };
    }

    // Log to database - user could email about "couldn't save verification photos"
    const userMessage = logError({
      code: "ONBOARDING_HANDMADE_VERIFICATION_SAVE_FAILED",
      userId: session?.user?.id,
      route: "actions/onboardingActions",
      method: "saveHandmadeVerification",
      error,
      metadata: {
        note: "Failed to save handmade verification photos",
      },
    });

    return { error: userMessage };
  }
};
