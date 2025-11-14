import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
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
    console.error("[SELLER_CURRENCY_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

