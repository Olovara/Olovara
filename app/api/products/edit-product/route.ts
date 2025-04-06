import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function PATCH(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401 }
      );
    }

    const data = await req.json();
    const { id, ...updateData } = data;

    // Verify the user owns this product
    const existingProduct = await db.product.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingProduct) {
      return new Response(
        JSON.stringify({ success: false, error: "Product not found" }),
        { status: 404 }
      );
    }

    // Update the product
    const updatedProduct = await db.product.update({
      where: { id },
      data: {
        ...updateData,
        dropDate: updateData.dropDate ? new Date(updateData.dropDate) : undefined,
        discountEndDate: updateData.discountEndDate 
          ? new Date(updateData.discountEndDate) 
          : undefined,
      },
    });

    return new Response(
      JSON.stringify({ success: true, product: updatedProduct }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating product:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}
