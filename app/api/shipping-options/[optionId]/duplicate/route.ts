import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ObjectId } from "mongodb";
import { getCountryByCode } from "@/data/countries";

/**
 * Duplicate/Copy a shipping option
 * Creates a new shipping option with all the same data as the original,
 * including all rates, but with a new ID and name appended with " (Copy)"
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { optionId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401 }
      );
    }

    // Validate that the ID is a valid ObjectID
    if (!ObjectId.isValid(params.optionId)) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Invalid shipping option ID format" }),
        { status: 400 }
      );
    }

    // Get the original shipping option with all rates
    const originalOption = await db.shippingOption.findUnique({
      where: {
        id: params.optionId,
        sellerId: session.user.id, // Ensure user owns this option
      },
      include: {
        rates: true,
      },
    });

    if (!originalOption) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Shipping option not found" }),
        { status: 404 }
      );
    }

    // Create the duplicate shipping option
    // Append " (Copy)" to the name and set isDefault to false
    const duplicatedOption = await db.shippingOption.create({
      data: {
        name: `${originalOption.name} (Copy)`,
        isDefault: false, // Don't set duplicate as default
        countryOfOrigin: originalOption.countryOfOrigin,
        defaultShipping: originalOption.defaultShipping,
        defaultShippingCurrency: originalOption.defaultShippingCurrency,
        sellerId: session.user.id,
        // Duplicate all rates
        rates: {
          create: originalOption.rates.map((rate) => {
            // For country type, determine zone from country code
            // For zone type, use the zone directly
            let zoneValue = rate.zone;
            if (rate.type === "country" && rate.countryCode) {
              const country = getCountryByCode(rate.countryCode);
              zoneValue = country?.zone || "NORTH_AMERICA"; // Default fallback
            }

            return {
              type: rate.type || "zone",
              zone: zoneValue || "NORTH_AMERICA", // Ensure zone is always set
              countryCode: rate.type === "country" ? rate.countryCode : null,
              price: rate.price,
              additionalItem: rate.additionalItem,
              isFreeShipping: rate.isFreeShipping || false,
            };
          }),
        },
      },
      include: {
        rates: true,
      },
    });

    return new NextResponse(
      JSON.stringify({
        success: true,
        shippingOptionId: duplicatedOption.id,
        message: "Shipping option duplicated successfully!",
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("[DUPLICATE_SHIPPING_OPTION] Error:", error);
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: "Failed to duplicate shipping option",
      }),
      { status: 500 }
    );
  }
}

