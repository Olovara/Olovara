"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

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
  shopName: z.string().min(3, "Shop name must be at least 3 characters").max(30, "Shop name must be 30 characters or less"),
});

// Schema for first product
const FirstProductSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters").max(100, "Product name must be 100 characters or less"),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description must be 1000 characters or less"),
  price: z.number().positive("Price must be greater than 0"),
  materials: z.string().optional(),
  dimensions: z.string().optional(),
  weight: z.string().optional(),
  processingTime: z.string().optional(),
});

export const saveHelpPreferences = async (data: z.infer<typeof HelpPreferencesSchema>) => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  try {
    // Validate the data
    const validatedData = HelpPreferencesSchema.parse(data);

    // Save to database (placeholder for now)
    console.log("Saving help preferences:", validatedData);

    return { success: "Help preferences saved successfully!" };
  } catch (error) {
    console.error("Error saving help preferences:", error);
    return { error: "Failed to save help preferences." };
  }
};

export const saveShopPreferences = async (data: z.infer<typeof ShopPreferencesSchema>) => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  try {
    // Validate the data
    const validatedData = ShopPreferencesSchema.parse(data);

    // Save to database (placeholder for now)
    console.log("Saving shop preferences:", validatedData);

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

    // Check if shop name is available (placeholder for now)
    const shopName = validatedData.shopName.trim();
    
    // Basic validation
    if (shopName.toLowerCase().includes('yarnnu')) {
      return { error: "Shop name cannot contain 'Yarnnu'." };
    }

    // Save to database (placeholder for now)
    console.log("Saving shop name:", shopName);

    return { success: "Shop name saved successfully!" };
  } catch (error) {
    console.error("Error saving shop name:", error);
    return { error: "Failed to save shop name." };
  }
};

export const createFirstProduct = async (data: z.infer<typeof FirstProductSchema>) => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  try {
    // Validate the data
    const validatedData = FirstProductSchema.parse(data);

    // Save to database (placeholder for now)
    console.log("Creating first product:", validatedData);

    return { success: "First product created successfully!" };
  } catch (error) {
    console.error("Error creating first product:", error);
    return { error: "Failed to create first product." };
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