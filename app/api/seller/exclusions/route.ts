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
    console.error("[SELLER_EXCLUSIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

