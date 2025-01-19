"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { ProductSchema } from "@/schemas/ProductSchema";
import { auth } from "@/auth"; // Adjust to your auth method

export const createProduct = async (values: z.infer<typeof ProductSchema>) => {
  try {
    const validatedFields = ProductSchema.safeParse(values);

    if (!validatedFields.success) {
      return { error: "Invalid fields." };
    }

    const {
      name,
      description,
      price,
      images,
      isDigital,
      shippingCost,
      stock,
      productFile,
      primaryCategory,
      secondaryCategory,
    } = validatedFields.data;

    const session = await auth(); // Get the authenticated user session
    if (!session?.user?.id) {
      return { error: "User not authenticated." };
    }

    // Check if the user role is SELLER
    if (session?.user?.role !== "SELLER") {
      return { error: "You must be a seller to create a product." };
    }

    // Product creation logic
    await db.product.create({
      data: {
        userId: session.user.id, // Associate with the logged-in user
        name,
        description,
        price,
        images,
        isDigital,
        shippingCost,
        stock,
        productFile,
        primaryCategory,
        secondaryCategory,
      },
    });

    return { success: "Product created successfully!" };
  } catch (error) {
    console.error("Error creating product:", error);
    return { error: "An error occurred while creating the product." };
  }
};
