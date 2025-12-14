import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { logError } from "@/lib/error-logger";

// Schema for shop SEO updates
const ShopSEOSchema = z.object({
  metaTitle: z
    .string()
    .max(60, "Meta title must be 60 characters or less")
    .optional(),
  metaDescription: z
    .string()
    .max(160, "Meta description must be 160 characters or less")
    .optional(),
  keywords: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  ogTitle: z
    .string()
    .max(60, "Social media title must be 60 characters or less")
    .optional(),
  ogDescription: z
    .string()
    .max(160, "Social media description must be 160 characters or less")
    .optional(),
  ogImage: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
});

export async function PATCH(req: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;

  try {
    session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    body = await req.json();
    const validatedData = ShopSEOSchema.parse(body);

    // Get the seller
    const seller = await db.seller.findUnique({
      where: { userId: session.user.id },
    });

    if (!seller) {
      return new NextResponse("Seller not found", { status: 404 });
    }

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

    return NextResponse.json({
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
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error updating shop SEO:", error);

    // Check if it's a ZodError (validation error) - don't log these to DB
    if (error instanceof z.ZodError) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: "Validation error",
          details: error.errors,
        }),
        { status: 400 }
      );
    }

    // Log to database - user could email about "couldn't update SEO"
    const userMessage = logError({
      code: "SELLER_SEO_UPDATE_FAILED",
      userId: session?.user?.id,
      route: "/api/seller/seo",
      method: "PATCH",
      error,
      metadata: {
        note: "Failed to update seller SEO settings",
      },
    });

    return new NextResponse(
      JSON.stringify({
        success: false,
        error: userMessage,
      }),
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the seller's SEO data
    const seller = await db.seller.findUnique({
      where: { userId: session.user.id },
      select: {
        metaTitle: true,
        metaDescription: true,
        keywords: true,
        tags: true,
        ogTitle: true,
        ogDescription: true,
        ogImage: true,
      },
    });

    if (!seller) {
      return new NextResponse("Seller not found", { status: 404 });
    }

    return NextResponse.json({
      success: true,
      seo: seller,
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error fetching shop SEO:", error);

    // Log to database - user could email about "can't see SEO settings"
    const userMessage = logError({
      code: "SELLER_SEO_FETCH_FAILED",
      userId: session?.user?.id,
      route: "/api/seller/seo",
      method: "GET",
      error,
      metadata: {
        note: "Failed to fetch seller SEO settings",
      },
    });

    return new NextResponse(
      JSON.stringify({
        success: false,
        error: userMessage,
      }),
      { status: 500 }
    );
  }
}
