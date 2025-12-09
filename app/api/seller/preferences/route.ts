import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
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
    console.error("[SELLER_PREFERENCES_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

