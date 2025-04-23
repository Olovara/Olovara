"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { SellerApplicationSchema } from "@/schemas/SellerApplicationSchema";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";

export const sellerApplication = async (values: z.infer<typeof SellerApplicationSchema>) => {
  const validatedFields = SellerApplicationSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields." };
  }

  const { craftingProcess, portfolio, interestInJoining } = validatedFields.data;

  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  // Check if user already has a pending application
  const existingApplication = await db.sellerApplication.findUnique({
    where: { userId: session.user.id }
  });

  if (existingApplication) {
    return { error: "You already have a pending application." };
  }

  // Create the application and update user role in a transaction
  await db.$transaction(async (tx) => {
    // Create the seller application
    await tx.sellerApplication.create({
      data: {
        userId: session.user.id,
        craftingProcess,
        portfolio,
        interestInJoining,
      },
    });

    // Update user role to SELLER
    await tx.user.update({
      where: { id: session.user.id },
      data: { role: UserRole.SELLER },
    });
  });

  return { success: "Successfully submitted your seller application. You can now access your seller dashboard!" };
};