import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isSellerGPSRComplianceRequired } from "@/lib/gpsr-compliance";

/**
 * GET /api/seller/gpsr-requirement
 * Check if GPSR compliance is required for the authenticated seller
 */
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the seller record with location and shipping preferences
    const seller = await prisma.seller.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        shopCountry: true,
        excludedCountries: true
      }
    });

    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    // Check if GPSR compliance is required
    const isGPSRRequired = isSellerGPSRComplianceRequired(
      seller.shopCountry,
      seller.excludedCountries || []
    );

    return NextResponse.json({
      isGPSRRequired,
      shopCountry: seller.shopCountry,
      excludedCountries: seller.excludedCountries || []
    });

  } catch (error) {
    console.error("Error checking GPSR requirement:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
