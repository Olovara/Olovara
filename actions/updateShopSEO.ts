"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for shop SEO updates
const ShopSEOSchema = z.object({
  metaTitle: z.string().max(60, "Meta title must be 60 characters or less").optional(),
  metaDescription: z.string().max(160, "Meta description must be 160 characters or less").optional(),
  keywords: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  ogTitle: z.string().max(60, "Social media title must be 60 characters or less").optional(),
  ogDescription: z.string().max(160, "Social media description must be 160 characters or less").optional(),
  ogImage: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

export async function updateShopSEO(data: z.infer<typeof ShopSEOSchema>) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedData = ShopSEOSchema.parse(data);

    // Update the seller's SEO fields
    const updatedSeller = await db.seller.update({
      where: { userId: session.user.id },
      data: {
        metaTitle: validatedData.metaTitle,
        metaDescription: validatedData.metaDescription,
        keywords: validatedData.keywords,
        tags: validatedData.tags,
        ogTitle: validatedData.ogTitle,
        ogDescription: validatedData.ogDescription,
        ogImage: validatedData.ogImage,
      },
    });

    return {
      success: true,
      seller: {
        metaTitle: updatedSeller.metaTitle,
        metaDescription: updatedSeller.metaDescription,
        keywords: updatedSeller.keywords,
        tags: updatedSeller.tags,
        ogTitle: updatedSeller.ogTitle,
        ogDescription: updatedSeller.ogDescription,
        ogImage: updatedSeller.ogImage,
      },
    };
  } catch (error) {
    console.error("Error updating shop SEO:", error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation error",
        details: error.errors,
      };
    }

    return {
      success: false,
      error: "Internal server error",
    };
  }
} 