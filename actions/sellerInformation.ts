"use server";

import * as z from "zod";

import { db } from "@/lib/db";
import { SellerSchema } from "@/schemas/SellerSchema";

import { auth } from "@/auth"; // Adjust to your auth method

export const sellerInformation = async (values: z.infer<typeof SellerSchema>) => {
  const validatedFields = SellerSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields." };
  }

  const session = await auth(); // Get the authenticated user session
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  try {
    // Check if seller exists
    const existingSeller = await db.seller.findUnique({
      where: { userId: session.user.id },
    });

    if (existingSeller) {
      // Update existing seller
      await db.seller.update({
        where: { userId: session.user.id },
        data: {
          ...validatedFields.data,
          shopNameSlug: validatedFields.data.shopName.toLowerCase().replace(/\s+/g, '-'),
        },
      });
    } else {
      // Create new seller
      await db.seller.create({
        data: {
          ...validatedFields.data,
          shopNameSlug: validatedFields.data.shopName.toLowerCase().replace(/\s+/g, '-'),
          user: {
            connect: {
              id: session.user.id
            }
          }
        },
      });
    }

    return { success: "Successfully saved your shop information." };
  } catch (error) {
    console.error("Error saving seller information:", error);
    return { error: "Failed to save seller information." };
  }
};