"use server";

import * as z from "zod";

import { db } from "@/lib/db";
import { SellerApplicationSchema } from "@/schemas/SellerApplicationSchema";

import { auth } from "@/auth"; // Adjust to your auth method

export const sellerApplication = async (values: z.infer<typeof SellerApplicationSchema>) => {
  const validatedFields = SellerApplicationSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields." };
  }

  const { craftingProcess, portfolio, interestInJoining } = validatedFields.data;

  const session = await auth(); // Get the authenticated user session
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  await db.sellerApplication.create({
    data: {
      userId: session.user.id, // Associate with the logged-in user
      craftingProcess,
      portfolio,
      interestInJoining,
    },
  });

  return { success: "Successfully submitted your seller application." };
};