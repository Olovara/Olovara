import { auth } from "@/auth";
import { db } from "@/lib/db";

// Remove the Edge Runtime configuration
// export const runtime = "edge";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds timeout

// For body size limit, we need to use a different approach in App Router
// This will be handled in the POST function

export async function POST(req: Request) {
  //console.log("API HIT: /api/products/create-product");

  try {
    const session = await auth();

    if (!session?.user?.id) {
      console.warn("Unauthorized access attempt - No valid session.");
      return new Response(
        JSON.stringify({ success: false, error: "User not authenticated" }),
        { status: 401 }
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

    const userId = session.user.id;

    // Check if seller is approved
    const seller = await db.seller.findUnique({
      where: { userId },
      select: { applicationAccepted: true }
    });

    if (!seller?.applicationAccepted) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Your seller application is still pending approval. You cannot create products until your application is approved." 
        }),
        { status: 403 }
      );
    }

    // Get the form data from the request body
    const data = await req.json();
    console.log("[API INPUT] Received product data:", data);

    const {
      name,
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
      tags = [],
      materialTags = [],
      options,
      inStockProcessingTime,
      outStockLeadTime,
      howItsMade,
      productDrop = false,
      NSFW = false,
      dropDate,
      discountEndDate,
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

    // --- Step 1: Prepare clean data for product creation ---
    const cleanData = {
      userId,
      name,
      price: Number(price),
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
      tags,
      materialTags,
      options,
      inStockProcessingTime: parseInt(inStockProcessingTime) || 0,
      outStockLeadTime: parseInt(outStockLeadTime) || 0,
      howItsMade: howItsMade || "",
      productDrop,
      NSFW,
      dropDate: dropDate ? new Date(dropDate) : null,
      discountEndDate: discountEndDate ? new Date(discountEndDate) : null,
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
