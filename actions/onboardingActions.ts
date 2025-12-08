"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { encryptData, decryptData } from "@/lib/encryption";
import { updateOnboardingStep } from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";
import { recalculateOnboardingSteps } from "@/lib/onboarding";

/**
 * Recalculate onboarding steps when seller settings change
 * This should be called when:
 * - Seller changes shop country
 * - Seller updates shipping exclusions
 * - Seller creates/updates products
 */
export async function recalculateSellerOnboardingSteps() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Get the seller record
    const seller = await prisma.seller.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    });

    if (!seller) {
      return { error: "Seller not found" };
    }

    // Recalculate onboarding steps
    await recalculateOnboardingSteps(seller.id);

    return { success: true };
  } catch (error) {
    console.error("Error recalculating onboarding steps:", error);
    return { error: "Failed to recalculate onboarding steps" };
  }
}

/**
 * Update seller shop country and recalculate onboarding steps
 */
export async function updateSellerShopCountry(countryCode: string) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Update seller shop country
    await prisma.seller.update({
      where: { userId: session.user.id },
      data: { shopCountry: countryCode }
    });

    // Recalculate onboarding steps
    await recalculateSellerOnboardingSteps();

    return { success: true };
  } catch (error) {
    console.error("Error updating seller shop country:", error);
    return { error: "Failed to update shop country" };
  }
}

/**
 * Update seller shipping exclusions and recalculate onboarding steps
 */
export async function updateSellerShippingExclusions(excludedCountries: string[]) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Update seller shipping exclusions
    await prisma.seller.update({
      where: { userId: session.user.id },
      data: { excludedCountries }
    });

    // Recalculate onboarding steps
    await recalculateSellerOnboardingSteps();

    return { success: true };
  } catch (error) {
    console.error("Error updating shipping exclusions:", error);
    return { error: "Failed to update shipping exclusions" };
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
    .max(1000, "Description must be 1000 characters or less"),
  shortDescription: z.string(),
  shortDescriptionBullets: z.array(z.string()).max(5, "Maximum 5 bullet points allowed").default([]),
  price: z.number().positive("Price must be greater than 0"),
  materials: z.string().optional(),
  dimensions: z.string().optional(),
  weight: z.string().optional(),
  processingTime: z.string().optional(),
  isDigital: z.boolean().default(false),
  freeShipping: z.boolean().default(false),
  shippingCost: z.number().min(0).default(0),
  shippingOptionId: z.string().optional(),
});

// Schema for first name
const FirstNameSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be 50 characters or less"),
});

export const saveHelpPreferences = async (
  data: z.infer<typeof HelpPreferencesSchema>
) => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  try {
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
    console.error("Error saving help preferences:", error);
    return { error: "Failed to save help preferences." };
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
    console.error("Error getting help preferences analytics:", error);
    return { error: "Failed to get analytics." };
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
    console.error("Error getting users by help category:", error);
    return { error: "Failed to get users." };
  }
};

// Get user's help preferences for personalized guidance
export const getUserHelpPreferences = async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  try {
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
    console.error("Error getting user help preferences:", error);
    return { error: "Failed to get help preferences." };
  }
};

export const saveShopPreferences = async (
  data: z.infer<typeof ShopPreferencesSchema>
) => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  try {
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
    console.error("Error saving shop preferences:", error);
    return { error: "Failed to save shop preferences." };
  }
};

export const saveShopName = async (data: z.infer<typeof ShopNameSchema>) => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  try {
    // Validate the data
    const validatedData = ShopNameSchema.parse(data);

    // Check if shop name is available
    const shopName = validatedData.shopName.trim();

    // Basic validation
    if (shopName.toLowerCase().includes("yarnnu")) {
      return { error: "Shop name cannot contain 'Yarnnu'." };
    }

    // Check if shop name is already taken
    const existingSeller = await db.seller.findFirst({
      where: {
        shopName: {
          equals: shopName,
          mode: "insensitive", // Case-insensitive search
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

    // Check if slug is already taken
    const existingSlug = await db.seller.findFirst({
      where: {
        shopNameSlug: {
          equals: shopNameSlug,
          mode: "insensitive",
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
    console.error("Error saving shop name:", error);
    return { error: "Failed to save shop name." };
  }
};

export const createFirstProduct = async (
  data: z.infer<typeof FirstProductSchema>
) => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  // Extract userId to ensure TypeScript knows it's defined
  const userId = session.user.id;

  try {
    // Validate the data
    const validatedData = FirstProductSchema.parse(data);

    // Check if user has a seller account
    const seller = await db.seller.findUnique({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        userId: true,
        applicationAccepted: true,
        isFullyActivated: true,
      },
    });

    if (!seller) {
      return {
        error: "Seller account not found. Please complete shop setup first.",
      };
    }

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
          userId: userId,
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
          images: [], // Empty array for now, can be updated later
          tags: [], // Empty array for now
          materialTags: validatedData.materials ? [validatedData.materials] : [],
          inStockProcessingTime: validatedData.processingTime
            ? parseInt(validatedData.processingTime.split("-")[0])
            : 3,
          itemWeightUnit: "lbs", // Default weight unit
          itemDimensionUnit: "in", // Default dimension unit
          taxCategory: validatedData.isDigital ? "DIGITAL_GOODS" : "PHYSICAL_GOODS",
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

    // Note: We don't mark first_product as completed since it's not a required step
    // Product creation is optional and sellers can create products whenever they want

    console.log("First product created successfully:", result.id, "Status:", productStatus);
    
    // Return appropriate message based on status
    const message = productStatus === "DRAFT" 
      ? "Product created as draft. Complete your onboarding to activate it."
      : "First product created successfully!";

    return {
      success: message,
      productId: result.id,
      status: productStatus,
      isDraft: productStatus === "DRAFT",
    };
  } catch (error) {
    console.error("Error creating first product:", error);
    // Provide more detailed error message
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack);
    }
    return { 
      error: error instanceof Error 
        ? `Failed to create first product: ${error.message}` 
        : "Failed to create first product." 
    };
  }
};

export const setupStripeAccount = async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  try {
    console.log("Setting up Stripe account for user:", session.user.id); // Placeholder for Stripe Connect setup
    // In a real implementation, this would:
    // 1. Create a Stripe Connect account link
    // 2. Redirect user to Stripe onboarding
    // 3. Handle the return callback
    return { success: "Stripe account setup initiated!" };
  } catch (error) {
    console.error("Error setting up Stripe account:", error);
    return { error: "Failed to setup Stripe account." };
  }
};

export const saveFirstName = async (data: z.infer<typeof FirstNameSchema>) => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  try {
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
    console.error("Error saving first name:", error);
    return { error: "Failed to save first name." };
  }
};

export const getUserFirstName = async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  try {
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
    console.error("Error getting user first name:", error);
    return { firstName: null };
  }
};
