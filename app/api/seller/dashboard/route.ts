import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getSellerOnboardingSteps } from "@/lib/onboarding";
import { logError } from "@/lib/error-logger";

// GET - Fetch seller dashboard data
export async function GET(request: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get("sellerId");

    if (!sellerId) {
      return NextResponse.json(
        { error: "Seller ID is required" },
        { status: 400 }
      );
    }

    // Verify the user is the seller or an admin
    const seller = await db.seller.findUnique({
      where: { userId: sellerId },
      select: {
        id: true,
        userId: true,
        shopName: true,
        shopDescription: true,
        preferredCurrency: true,
        preferredWeightUnit: true,
        preferredDimensionUnit: true,
        preferredDistanceUnit: true,
        applicationAccepted: true,
        isFullyActivated: true,
        stripeConnected: true,
        totalSales: true,
        totalProducts: true,
        acceptsCustom: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    // Get onboarding steps
    const onboardingSteps = await getSellerOnboardingSteps(seller.id);

    // Check if user is the seller or has admin permissions
    if (session.user.id !== sellerId) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: { admin: true },
      });

      if (!user?.admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    return NextResponse.json({
      ...seller,
      onboardingSteps,
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error fetching seller dashboard data:", error);

    // Log to database - user could email about "can't see dashboard"
    const userMessage = logError({
      code: "SELLER_DASHBOARD_FETCH_FAILED",
      userId: session?.user?.id,
      route: "/api/seller/dashboard",
      method: "GET",
      error,
      metadata: {
        note: "Failed to fetch seller dashboard data",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
