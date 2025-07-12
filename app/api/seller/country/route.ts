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

    // Get the seller's business address and tax country
    const seller = await db.seller.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        taxCountry: true,
        addresses: {
          where: {
            isBusinessAddress: true,
          },
          select: {
            encryptedCountry: true,
            countryIV: true,
            countrySalt: true,
          },
          take: 1,
        },
      },
    });

    if (!seller) {
      return new NextResponse("Seller not found", { status: 404 });
    }

    // Try to get country from business address first, then fall back to tax country
    let country = seller.taxCountry;
    
    if (seller.addresses?.[0]?.encryptedCountry) {
      try {
        const address = seller.addresses[0];
        country = decryptData(address.encryptedCountry, address.countryIV, address.countrySalt);
      } catch (error) {
        console.error("Error decrypting country:", error);
        // Fall back to tax country
      }
    }

    if (!country) {
      return new NextResponse("No country information found", { status: 404 });
    }

    return NextResponse.json({ country });
  } catch (error) {
    console.error("[SELLER_COUNTRY_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 