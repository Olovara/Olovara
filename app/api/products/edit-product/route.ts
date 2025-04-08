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
    console.log('Received update data:', data);

    const { id, ...updateData } = data;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: "Product ID is required" }),
        { status: 400 }
      );
    }

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

    // Clean up the update data
    const cleanData = {
      ...updateData,
      dropDate: updateData.dropDate ? new Date(updateData.dropDate) : null,
      discountEndDate: updateData.discountEndDate 
        ? new Date(updateData.discountEndDate) 
        : null,
      // Ensure these fields are properly formatted
      price: Number(updateData.price),
      stock: Number(updateData.stock),
      shippingCost: Number(updateData.shippingCost),
      handlingFee: Number(updateData.handlingFee),
      discount: updateData.discount ? Number(updateData.discount) : null,
    };

    console.log('Updating product with data:', cleanData);

    // Update the product
    const updatedProduct = await db.product.update({
      where: { id },
      data: cleanData,
    });

    // Handle file associations
    if (updatedProduct.id) {
      // Get the current product to compare with updated data
      const currentProduct = await db.product.findUnique({
        where: { id },
        select: {
          images: true,
          productFile: true
        }
      });

      if (currentProduct) {
        // Handle image changes
        if (updateData.images && Array.isArray(updateData.images)) {
          // Disassociate removed images
          const removedImages = currentProduct.images.filter(
            (img: string) => !updateData.images.includes(img)
          );
          
          if (removedImages.length > 0) {
            await db.temporaryUpload.updateMany({
              where: {
                fileUrl: {
                  in: removedImages
                },
                productId: id
              },
              data: {
                productId: null
              }
            });
          }

          // Associate new images
          const newImages = updateData.images.filter(
            (img: string) => !currentProduct.images.includes(img)
          );
          
          if (newImages.length > 0) {
            await db.temporaryUpload.updateMany({
              where: {
                fileUrl: {
                  in: newImages
                },
                userId: session.user.id,
                productId: null
              },
              data: {
                productId: id
              }
            });
          }
        }

        // Handle product file changes
        if (updateData.productFile !== currentProduct.productFile) {
          // If there was a previous file, disassociate it
          if (currentProduct.productFile) {
            await db.temporaryUpload.updateMany({
              where: {
                fileUrl: currentProduct.productFile,
                productId: id
              },
              data: {
                productId: null
              }
            });
          }

          // If there's a new file, associate it
          if (updateData.productFile) {
            await db.temporaryUpload.updateMany({
              where: {
                fileUrl: updateData.productFile,
                userId: session.user.id,
                productId: null
              },
              data: {
                productId: id
              }
            });
          }
        }
      }
    }

    console.log('Product updated successfully:', updatedProduct);

    return new Response(
      JSON.stringify({ success: true, product: updatedProduct }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating product:', error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}
