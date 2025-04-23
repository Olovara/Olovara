"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function checkSellerApproval() {
  try {
    const session = await auth();
    if (!session?.user) return false;

    const seller = await db.seller.findUnique({
      where: { userId: session.user.id },
      select: { applicationAccepted: true }
    });

    return seller?.applicationAccepted || false;
  } catch (error) {
    console.error("Error checking seller approval:", error);
    return false;
  }
} 