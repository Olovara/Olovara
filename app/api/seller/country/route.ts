import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { decryptData } from "@/lib/encryption";
import { logError } from "@/lib/error-logger";

export const dynamic = "force-dynamic";

export async function GET() {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the seller's shop country
    const seller = await db.seller.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        shopCountry: true,
      },
    });

    if (!seller) {
      return new NextResponse("Seller not found", { status: 404 });
    }

    const country = seller.shopCountry;

    if (!country) {
      return new NextResponse("No country information found", { status: 404 });
    }

    return NextResponse.json({ country });
  } catch (error) {
    // Log to console (always happens)
    console.error("[SELLER_COUNTRY_GET]", error);

    // Log to database - user could email about "can't see country"
    const userMessage = logError({
      code: "SELLER_COUNTRY_FETCH_FAILED",
      userId: session?.user?.id,
      route: "/api/seller/country",
      method: "GET",
      error,
      metadata: {
        note: "Failed to fetch seller country",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
