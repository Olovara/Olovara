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

  const { shopName, shopDescription } = validatedFields.data;

  const session = await auth(); // Get the authenticated user session
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  await db.seller.create({
    data: {
      userId: session.user.id,
      shopName,
      shopNameSlug: shopName.toLowerCase().replace(/\s+/g, '-'),
      shopDescription,
      user: {
        connect: {
          id: session.user.id
        }
      }
    },
  });

  return { success: "Successfully added your shop information." };
};