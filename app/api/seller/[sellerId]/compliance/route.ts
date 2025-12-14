import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { decryptResponsiblePerson, decryptAddress } from "@/lib/encryption";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { sellerId: string } }
) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let sellerId: string | undefined = undefined;

  try {
    // Require authentication - this data is sensitive
    session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    sellerId = params.sellerId;

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
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    // Verify the user is the seller or an admin
    // This prevents unauthorized access to sensitive compliance data
    if (session.user.id !== sellerId) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: { admin: true },
      });

      if (!user?.admin) {
        return NextResponse.json(
          {
            error: "Unauthorized - You can only view your own compliance data",
          },
          { status: 403 }
        );
      }
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
    // Log to console (always happens)
    console.error("Error fetching seller compliance data:", error);

    // Log to database - user could email about "can't see compliance data"
    const userMessage = logError({
      code: "SELLER_COMPLIANCE_FETCH_FAILED",
      userId: session?.user?.id,
      route: "/api/seller/[sellerId]/compliance",
      method: "GET",
      error,
      metadata: {
        sellerId,
        requestedBy: session?.user?.id,
        note: "Failed to fetch seller compliance data",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
