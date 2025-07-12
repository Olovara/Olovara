import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      encryptedStreet,
      streetIV,
      streetSalt,
      encryptedStreet2,
      street2IV,
      street2Salt,
      encryptedCity,
      cityIV,
      citySalt,
      encryptedState,
      stateIV,
      stateSalt,
      encryptedPostal,
      postalIV,
      postalSalt,
      encryptedCountry,
      countryIV,
      countrySalt,
      isDefault,
      isBusinessAddress,
    } = body;

    // Get the seller's ID
    const seller = await db.seller.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    // If this is set as default, update all other addresses to not be default
    if (isDefault) {
      await db.address.updateMany({
        where: { sellerId: seller.id },
        data: { isDefault: false },
      });
    }

    // Create the new address with pre-encrypted data
    const address = await db.address.create({
      data: {
        encryptedStreet,
        streetIV,
        streetSalt,
        encryptedStreet2,
        street2IV,
        street2Salt,
        encryptedCity,
        cityIV,
        citySalt,
        encryptedState,
        stateIV,
        stateSalt,
        encryptedPostal,
        postalIV,
        postalSalt,
        encryptedCountry,
        countryIV,
        countrySalt,
        isDefault,
        isBusinessAddress,
        sellerId: seller.id,
      },
    });

    return NextResponse.json({ success: true, address });
  } catch (error: any) {
    console.error("[ADDRESS_CREATION_ERROR]", error);
    return NextResponse.json({ 
      error: error.message || "Internal Error",
      details: error.stack
    }, { status: 500 });
  }
} 