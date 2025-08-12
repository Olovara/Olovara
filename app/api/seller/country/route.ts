import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { decryptData } from "@/lib/encryption";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
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
    console.error("[SELLER_COUNTRY_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 