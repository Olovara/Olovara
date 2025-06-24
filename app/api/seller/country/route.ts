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

    // Get the seller's business address
    const seller = await db.seller.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        addresses: {
          where: {
            isBusinessAddress: true,
          },
          take: 1,
        },
      },
    });

    if (!seller?.addresses?.[0]?.encryptedCountry) {
      return new NextResponse("No business address found", { status: 404 });
    }

    // Return the tax country if no business address is found
    return NextResponse.json({ country: seller.taxCountry });
  } catch (error) {
    console.error("[SELLER_COUNTRY_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 