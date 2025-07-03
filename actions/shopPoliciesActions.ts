"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { ShopPoliciesSchema } from "@/schemas/ShopPoliciesSchema";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { Permission } from "@/data/roles-and-permissions";

export const updateShopPolicies = async (values: z.infer<typeof ShopPoliciesSchema>) => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  const canManageSettings = await hasPermission(session.user.id, "MANAGE_SELLER_SETTINGS" as Permission);
  if (!canManageSettings) {
    return { error: "You don't have permission to perform this action." };
  }

  const validatedFields = ShopPoliciesSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields." };
  }

  const { processingTime, returnsPolicy, exchangesPolicy, damagesPolicy, nonReturnableItems, refundPolicy, careInstructions } = validatedFields.data;

  try {
    // Update seller with shop policies
    await db.seller.update({
       where: { userId: session.user.id },
       data: {
         processingTime,
         returnsPolicy,
         exchangesPolicy,
         damagesPolicy,
         nonReturnableItems,
         refundPolicy,
         careInstructions,
       },
     });

    return { success: "Shop policies updated successfully!" };
  } catch (error) {
    console.error("Error updating shop policies:", error);
    return { error: "Failed to update shop policies." };
  }
};

export const getShopPolicies = async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  try {
     const seller = await db.seller.findUnique({
       where: { userId: session.user.id },
       select: {
         processingTime: true,
         returnsPolicy: true,
         exchangesPolicy: true,
         damagesPolicy: true,
         nonReturnableItems: true,
         refundPolicy: true,
         careInstructions: true,
       },
     });

     if (!seller) {
       return { error: "Seller not found." };
     }

     return { data: seller };
    
  } catch (error) {
    console.error("Error fetching shop policies:", error);
    return { error: "Failed to fetch shop policies." };
  }
}; 