import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptResponsiblePerson, decryptAddress } from "@/lib/encryption";

export async function GET(
  request: NextRequest,
  { params }: { params: { sellerId: string } }
) {
  try {
    const { sellerId } = params;

    if (!sellerId) {
      return NextResponse.json(
        { error: "Seller ID is required" },
        { status: 400 }
      );
    }

    // Fetch the seller to verify they exist
    const seller = await db.seller.findUnique({
      where: { userId: sellerId },
      select: { id: true, userId: true, shopName: true },
    });

    if (!seller) {
      return NextResponse.json(
        { error: "Seller not found" },
        { status: 404 }
      );
    }

    // Fetch responsible person data
    const responsiblePerson = await db.responsiblePerson.findUnique({
      where: { sellerId },
    });

    // Fetch business address data
    const businessAddress = await db.address.findFirst({
      where: {
        sellerId,
        isBusinessAddress: true,
      },
    });

    let responsiblePersonData = null;
    let businessAddressData = null;

    // Decrypt responsible person data if it exists
    if (responsiblePerson) {
      try {
        const decryptedResponsiblePerson = decryptResponsiblePerson({
          encryptedName: responsiblePerson.encryptedName,
          nameIV: responsiblePerson.nameIV,
          nameSalt: responsiblePerson.nameSalt,
          encryptedEmail: responsiblePerson.encryptedEmail,
          emailIV: responsiblePerson.emailIV,
          emailSalt: responsiblePerson.emailSalt,
          encryptedPhone: responsiblePerson.encryptedPhone,
          phoneIV: responsiblePerson.phoneIV,
          phoneSalt: responsiblePerson.phoneSalt,
          encryptedCompanyName: responsiblePerson.encryptedCompanyName,
          companyNameIV: responsiblePerson.companyNameIV,
          companyNameSalt: responsiblePerson.companyNameSalt,
          encryptedVatNumber: responsiblePerson.encryptedVatNumber || undefined,
          vatNumberIV: responsiblePerson.vatNumberIV || undefined,
          vatNumberSalt: responsiblePerson.vatNumberSalt || undefined,
          encryptedStreet: responsiblePerson.encryptedStreet,
          streetIV: responsiblePerson.streetIV,
          streetSalt: responsiblePerson.streetSalt,
          encryptedStreet2: responsiblePerson.encryptedStreet2 || undefined,
          street2IV: responsiblePerson.street2IV || undefined,
          street2Salt: responsiblePerson.street2Salt || undefined,
          encryptedCity: responsiblePerson.encryptedCity,
          cityIV: responsiblePerson.cityIV,
          citySalt: responsiblePerson.citySalt,
          encryptedState: responsiblePerson.encryptedState || undefined,
          stateIV: responsiblePerson.stateIV || undefined,
          stateSalt: responsiblePerson.stateSalt || undefined,
          encryptedPostalCode: responsiblePerson.encryptedPostalCode,
          postalCodeIV: responsiblePerson.postalCodeIV,
          postalCodeSalt: responsiblePerson.postalCodeSalt,
          encryptedCountry: responsiblePerson.encryptedCountry,
          countryIV: responsiblePerson.countryIV,
          countrySalt: responsiblePerson.countrySalt,
        });

        responsiblePersonData = {
          name: decryptedResponsiblePerson.name,
          email: decryptedResponsiblePerson.email,
          phone: decryptedResponsiblePerson.phone,
          companyName: decryptedResponsiblePerson.companyName,
          vatNumber: decryptedResponsiblePerson.vatNumber,
          address: decryptedResponsiblePerson.address,
        };
      } catch (error) {
        console.error("Error decrypting responsible person data:", error);
        // Continue without responsible person data
      }
    }

    // Decrypt business address data if it exists
    if (businessAddress) {
      try {
        const decryptedAddress = decryptAddress({
          encryptedStreet: businessAddress.encryptedStreet,
          streetIV: businessAddress.streetIV,
          streetSalt: businessAddress.streetSalt,
          encryptedStreet2: businessAddress.encryptedStreet2 || undefined,
          street2IV: businessAddress.street2IV || undefined,
          street2Salt: businessAddress.street2Salt || undefined,
          encryptedCity: businessAddress.encryptedCity,
          cityIV: businessAddress.cityIV,
          citySalt: businessAddress.citySalt,
          encryptedState: businessAddress.encryptedState || undefined,
          stateIV: businessAddress.stateIV || undefined,
          stateSalt: businessAddress.stateSalt || undefined,
          encryptedPostal: businessAddress.encryptedPostal,
          postalIV: businessAddress.postalIV,
          postalSalt: businessAddress.postalSalt,
          encryptedCountry: businessAddress.encryptedCountry,
          countryIV: businessAddress.countryIV,
          countrySalt: businessAddress.countrySalt,
        });

        businessAddressData = {
          street: decryptedAddress.street,
          street2: decryptedAddress.street2,
          city: decryptedAddress.city,
          state: decryptedAddress.state,
          postalCode: decryptedAddress.postalCode,
          country: decryptedAddress.country,
        };
      } catch (error) {
        console.error("Error decrypting business address data:", error);
        // Continue without business address data
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        responsiblePerson: responsiblePersonData,
        businessAddress: businessAddressData,
        hasResponsiblePerson: !!responsiblePersonData,
        hasBusinessAddress: !!businessAddressData,
      },
    });
  } catch (error) {
    console.error("Error fetching seller compliance data:", error);
    return NextResponse.json(
      { error: "Failed to fetch compliance data" },
      { status: 500 }
    );
  }
}
