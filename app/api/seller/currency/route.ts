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
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the seller's preferred currency
    const seller = await db.seller.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        preferredCurrency: true,
      },
    });

    if (!seller) {
      return new NextResponse("Seller not found", { status: 404 });
    }

    const currency = seller.preferredCurrency || "USD";

    return NextResponse.json({ currency });
  } catch (error) {
    // Log to console (always happens)
    console.error("[SELLER_CURRENCY_GET]", error);

    // Log to database - user could email about "can't see currency"
    const userMessage = logError({
      code: "SELLER_CURRENCY_FETCH_FAILED",
      userId: session?.user?.id,
      route: "/api/seller/currency",
      method: "GET",
      error,
      metadata: {
        note: "Failed to fetch seller currency",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
