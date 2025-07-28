import { auth } from "@/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";
import { Permission } from "@/data/roles-and-permissions";
import { generateUniqueSKU } from "@/lib/sku-generator";

// Remove the Edge Runtime configuration
// export const runtime = "edge";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds timeout

// For body size limit, we need to use a different approach in App Router
// This will be handled in the POST function

export async function POST(req: NextRequest) {
  //console.log("API HIT: /api/products/create-product");

  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    // Fetch seller record to confirm user is a seller
    const seller = await db.seller.findUnique({
      where: { userId },
      select: { id: true, userId: true },
    });
    if (!seller) {
      return NextResponse.json(
        { error: "Seller account not found" },
        { status: 403 }
      );
    }

    const canCreateProducts = await hasPermission(userId, "CREATE_PRODUCTS" as Permission);
    if (!canCreateProducts) {
      return NextResponse.json(
        { error: "You don't have permission to create products" },
        { status: 403 }
      );
    }

    // Add the body size check here
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
      // 10MB
      return new Response(
        JSON.stringify({ success: false, error: "Request body too large" }),
        { status: 413 }
      );
    }

    // Get the form data from the request body
    const data = await req.json();
    console.log("[API INPUT] Received product data:", data);

    const {
      name,
      sku,
      price,
      description,
      status,
      shippingCost = 0,
      handlingFee = 0,
      itemWeight,
      itemLength,
      itemWidth,
      itemHeight,
      shippingNotes,
      freeShipping = false,
      isDigital,
      stock,
      images = [],
      productFile,
      numberSold = 0,
      onSale = false,
      discount,
      primaryCategory,
      secondaryCategory,
      tertiaryCategory,
      tags = [],
      materialTags = [],
      options,
      inStockProcessingTime,
      outStockLeadTime,
      howItsMade,
      productDrop = false,
      NSFW = false,
      dropDate,
      dropTime,
      discountEndDate,
      currency = "USD",
      isTestProduct = false,
      // SEO fields
      metaTitle,
      metaDescription,
      keywords = [],
      ogTitle,
      ogDescription,
      ogImage,
    } = data;

    // Basic validation for required fields
    if (!name || !price || !primaryCategory) {
      console.warn("Missing required fields:", {
        name,
        price,
        primaryCategory,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Required fields are missing",
        }),
        { status: 400 }
      );
    }

    //console.log("Creating product with sanitized data...");

    // --- Step 1: Generate SKU if not provided ---
    let finalSku = sku;
    if (!sku || sku.trim() === "") {
      try {
        finalSku = await generateUniqueSKU(name, seller.userId);
        console.log("[SKU GENERATION] Generated SKU:", finalSku);
      } catch (error) {
        console.error("[SKU GENERATION] Error generating SKU:", error);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Failed to generate SKU",
          }),
          { status: 500 }
        );
      }
    }

    // --- Step 2: Prepare clean data for product creation ---
    const cleanData = {
      userId: seller.userId, // Use seller's userId for Product
      name,
      sku: finalSku,
      price: Number(price),
      currency,
      description: description || "",
      status,
      shippingCost: Number(shippingCost),
      handlingFee: Number(handlingFee),
      itemWeight: parseFloat(itemWeight) || 0,
      itemLength: parseFloat(itemLength) || 0,
      itemWidth: parseFloat(itemWidth) || 0,
      itemHeight: parseFloat(itemHeight) || 0,
      shippingNotes: shippingNotes || "",
      freeShipping,
      isDigital,
      stock: Number(stock),
      images,
      productFile: productFile || null,
      numberSold,
      onSale,
      discount: discount ? Number(discount) : null,
      primaryCategory,
      secondaryCategory,
      tertiaryCategory,
      tags,
      materialTags,
      options,
      inStockProcessingTime: parseInt(inStockProcessingTime) || 0,
      outStockLeadTime: parseInt(outStockLeadTime) || 0,
      howItsMade: howItsMade || "",
      productDrop,
      NSFW,
      dropDate: dropDate ? new Date(dropDate) : null,
      dropTime: dropTime || null,
      discountEndDate: discountEndDate ? new Date(discountEndDate) : null,
      isTestProduct,
      // SEO fields
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      keywords: keywords || [],
      ogTitle: ogTitle || null,
      ogDescription: ogDescription || null,
      ogImage: ogImage || null,
    };
    console.log("[PRE-CREATE] Data prepared for db.product.create:", cleanData);

    // --- Step 2: Create the product in the database ---
    const result = await db.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: cleanData,
      });

      console.log("[DEBUG] Product created successfully:", product.id);
      return product;
    });

    return new Response(JSON.stringify({ success: true, product: result }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}
