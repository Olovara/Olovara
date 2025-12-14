import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isSellerGPSRComplianceRequired } from "@/lib/gpsr-compliance";
import { logError } from "@/lib/error-logger";

/**
 * GET /api/seller/gpsr-requirement
 * Check if GPSR compliance is required for the authenticated seller
 */
export async function GET() {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the seller record with location and shipping preferences
    const seller = await prisma.seller.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        shopCountry: true,
        excludedCountries: true,
      },
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
      excludedCountries: seller.excludedCountries || [],
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error checking GPSR requirement:", error);

    // Log to database - user could email about "can't check GPSR requirement"
    const userMessage = logError({
      code: "SELLER_GPSR_CHECK_FAILED",
      userId: session?.user?.id,
      route: "/api/seller/gpsr-requirement",
      method: "GET",
      error,
      metadata: {
        note: "Failed to check GPSR requirement",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
