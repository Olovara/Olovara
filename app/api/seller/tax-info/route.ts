import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { encryptData } from "@/lib/encryption";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const {
      businessAddress,
      businessCity,
      businessState,
      businessPostalCode,
      taxCountry,
    } = body;

    // Encrypt the business address data
    const encryptedStreet = encryptData(businessAddress);
    const encryptedCity = encryptData(businessCity);
    const encryptedState = businessState ? encryptData(businessState) : null;
    const encryptedPostal = encryptData(businessPostalCode);
    const encryptedCountry = encryptData(taxCountry);

    // Update the seller's tax information
    await db.seller.update({
      where: {
        userId: session.user.id,
      },
      data: {
        taxCountry: taxCountry,
      },
    });

    // Find all business addresses for this seller
    const businessAddresses = await db.address.findMany({
      where: {
        sellerId: session.user.id,
        isBusinessAddress: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (businessAddresses.length > 0) {
      // Update the most recent business address
      await db.address.update({
        where: { id: businessAddresses[0].id },
        data: {
          encryptedStreet: encryptedStreet.encrypted,
          streetIV: encryptedStreet.iv,
          streetSalt: encryptedStreet.salt,
          encryptedCity: encryptedCity.encrypted,
          cityIV: encryptedCity.iv,
          citySalt: encryptedCity.salt,
          encryptedState: encryptedState ? encryptedState.encrypted : null,
          stateIV: encryptedState ? encryptedState.iv : null,
          stateSalt: encryptedState ? encryptedState.salt : null,
          encryptedPostal: encryptedPostal.encrypted,
          postalIV: encryptedPostal.iv,
          postalSalt: encryptedPostal.salt,
          encryptedCountry: encryptedCountry.encrypted,
          countryIV: encryptedCountry.iv,
          countrySalt: encryptedCountry.salt,
          isBusinessAddress: true,
          isDefault: true,
        },
      });
      // Optionally, clean up any extra business addresses (keep only one)
      if (businessAddresses.length > 1) {
        const idsToDelete = businessAddresses.slice(1).map(addr => addr.id);
        await db.address.deleteMany({ where: { id: { in: idsToDelete } } });
      }
    } else {
      // Create a new business address
      await db.address.create({
        data: {
          encryptedStreet: encryptedStreet.encrypted,
          streetIV: encryptedStreet.iv,
          streetSalt: encryptedStreet.salt,
          encryptedCity: encryptedCity.encrypted,
          cityIV: encryptedCity.iv,
          citySalt: encryptedCity.salt,
          encryptedState: encryptedState ? encryptedState.encrypted : null,
          stateIV: encryptedState ? encryptedState.iv : null,
          stateSalt: encryptedState ? encryptedState.salt : null,
          encryptedPostal: encryptedPostal.encrypted,
          postalIV: encryptedPostal.iv,
          postalSalt: encryptedPostal.salt,
          encryptedCountry: encryptedCountry.encrypted,
          countryIV: encryptedCountry.iv,
          countrySalt: encryptedCountry.salt,
          isBusinessAddress: true,
          isDefault: true,
          seller: {
            connect: {
              userId: session.user.id,
            },
          },
        },
      });
    }

    return new NextResponse("Tax information and business address updated successfully", { status: 200 });
  } catch (error) {
    console.error("[TAX_INFO_UPDATE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 