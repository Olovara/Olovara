import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logError } from "@/lib/error-logger";

export const dynamic = "force-dynamic";

export async function GET() {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the seller's preferences
    const seller = await db.seller.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        preferredCurrency: true,
        preferredWeightUnit: true,
        preferredDimensionUnit: true,
        preferredDistanceUnit: true,
      },
    });

    if (!seller) {
      return NextResponse.json(
        {
          preferredCurrency: "USD",
          preferredWeightUnit: "lbs",
          preferredDimensionUnit: "in",
          preferredDistanceUnit: "miles",
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      preferredCurrency: seller.preferredCurrency || "USD",
      preferredWeightUnit: seller.preferredWeightUnit || "lbs",
      preferredDimensionUnit: seller.preferredDimensionUnit || "in",
      preferredDistanceUnit: seller.preferredDistanceUnit || "miles",
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("[SELLER_PREFERENCES_GET]", error);

    // Log to database - user could email about "can't see preferences"
    const userMessage = logError({
      code: "SELLER_PREFERENCES_FETCH_FAILED",
      userId: session?.user?.id,
      route: "/api/seller/preferences",
      method: "GET",
      error,
      metadata: {
        note: "Failed to fetch seller preferences",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
