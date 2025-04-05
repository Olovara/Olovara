import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb", // Increase limit to 10 MB
    },
  },
};

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

    const userId = session.user.id;

    // Get the form data from the request body
    const data = await req.json();
    //console.log("Received data:", data);

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

    // Create product in the database
    const product = await prisma.product.create({
      data: {
        userId,
        name,
        price: parseFloat(price), // Ensure price is parsed correctly
        description: description || "",
        status,
        shippingCost: parseFloat(shippingCost),
        handlingFee: parseFloat(handlingFee),
        itemWeight: parseFloat(itemWeight) || 0,
        itemLength: parseFloat(itemLength) || 0,
        itemWidth: parseFloat(itemWidth) || 0,
        itemHeight: parseFloat(itemHeight) || 0,
        shippingNotes: shippingNotes || "",
        freeShipping,
        isDigital,
        stock: parseInt(stock) || (isDigital ? 0 : 1),
        images,
        productFile: productFile || null,
        numberSold,
        onSale,
        discount: parseInt(discount) || 0,
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
        dropDate: dropDate ? new Date(dropDate) : undefined,
        discountEndDate: discountEndDate
          ? new Date(discountEndDate)
          : undefined,
      },
    });

    //console.log("Product created successfully:", product);

    return new Response(
      JSON.stringify({ success: "Product created successfully", product }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}
