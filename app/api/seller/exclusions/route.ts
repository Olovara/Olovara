import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = 'force-dynamic';

export async function GET() {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the seller's excluded countries
    const seller = await db.seller.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        excludedCountries: true,
      },
    });

    if (!seller) {
      return new NextResponse("Seller not found", { status: 404 });
    }

    const excludedCountries = seller.excludedCountries || [];

    return NextResponse.json({ excludedCountries });
  } catch (error) {
    // Log to console (always happens)
    console.error("[SELLER_EXCLUSIONS_GET]", error);

    // Log to database - user could email about "can't see excluded countries"
    const userMessage = logError({
      code: "SELLER_EXCLUSIONS_FETCH_FAILED",
      userId: session?.user?.id,
      route: "/api/seller/exclusions",
      method: "GET",
      error,
      metadata: {
        note: "Failed to fetch seller excluded countries",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
