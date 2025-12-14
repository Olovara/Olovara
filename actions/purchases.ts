"use server";

import { db } from "@/lib/db";
import { logError } from "@/lib/error-logger";

export async function getPurchases(userId: string) {
  try {
    if (!userId) {
      throw new Error("You must be logged in!");
    }

    return await db.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }, // Optional: Sort by created date
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error fetching purchases:", error);

    // Don't log authentication errors - they're expected
    if (error instanceof Error && error.message.includes("logged in")) {
      throw error; // Re-throw authentication errors
    }

    // Log to database - user could email about "can't load purchases"
    const userMessage = logError({
      code: "PURCHASES_FETCH_FAILED",
      userId,
      route: "actions/purchases",
      method: "getPurchases",
      error,
      metadata: {
        note: "Failed to fetch user purchases",
      },
    });

    throw new Error(userMessage);
  }
}
