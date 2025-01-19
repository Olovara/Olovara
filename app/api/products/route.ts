import { prisma } from "@/lib/prisma"; // Adjust the path
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return new Response(
        JSON.stringify({ success: false, error: "User not authenticated" }),
        { status: 401 }
      );
    }

    const userId = session.user.id; // Assuming your session contains the user's ID

    // Now get the form data from the request body
    const data = await req.json();
    const { name, price, description, primaryCategory, secondaryCategory, images, isDigital, shippingCost, stock, productFile } = data;

    // Create product in the database
    const product = await prisma.product.create({
      data: {
        name,
        price,
        description,
        primaryCategory,
        secondaryCategory,
        images,
        isDigital,
        shippingCost,
        stock,
        productFile,
        userId,  // Use the authenticated userId here
      },
    });

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