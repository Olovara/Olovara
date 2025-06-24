"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { SellerApplicationSchema } from "@/schemas/SellerApplicationSchema";
import { auth } from "@/auth";
import { ROLES } from "@/data/roles-and-permissions";

export const sellerApplication = async (values: z.infer<typeof SellerApplicationSchema>) => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  const userId = session.user.id;

  try {
    // Create seller application
    await db.$transaction(async (tx) => {
      await tx.sellerApplication.create({
        data: {
          userId,
          craftingProcess: values.craftingProcess,
          portfolio: values.portfolio,
          interestInJoining: values.interestInJoining,
        } as any,
      });

      // Update user role to SELLER
      await tx.user.update({
        where: { id: userId },
        data: { role: ROLES.SELLER },
      });
    });

    return { success: "Application submitted successfully!" };
  } catch (error) {
    console.error("Error submitting seller application:", error);
    return { error: "Something went wrong!" };
  }
};