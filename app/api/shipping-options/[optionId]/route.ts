import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ObjectId } from "mongodb";
import { getCountryByCode } from "@/data/countries";
import { logError } from "@/lib/error-logger";

export async function GET(
  req: Request,
  { params }: { params: { optionId: string } }
) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let optionId: string | undefined = undefined;

  try {
    session = await auth();
    optionId = params.optionId;
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Validate that the optionId is a valid ObjectID
    if (!ObjectId.isValid(optionId)) {
      return new NextResponse("Invalid option ID format", { status: 400 });
    }

    // Get the shipping option with rates
    const shippingOption = await db.shippingOption.findUnique({
      where: {
        id: optionId,
        sellerId: session.user.id,
      },
      include: {
        rates: true,
      },
    });

    if (!shippingOption) {
      return new NextResponse("Shipping option not found", { status: 404 });
    }

    return NextResponse.json(shippingOption);
  } catch (error) {
    // Log to console (always happens)
    console.error("[SHIPPING_PROFILES_GET]", error);

    // Log to database - user could email about "can't see shipping option"
    const userMessage = logError({
      code: "SHIPPING_OPTION_FETCH_FAILED",
      userId: session?.user?.id,
      route: "/api/shipping-options/[optionId]",
      method: "GET",
      error,
      metadata: {
        optionId,
        note: "Failed to fetch shipping option",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { optionId: string } }
) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;
  let optionId: string | undefined = undefined;

  try {
    session = await auth();
    optionId = params.optionId;
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Validate that the optionId is a valid ObjectID
    if (!ObjectId.isValid(optionId)) {
      return new NextResponse("Invalid option ID format", { status: 400 });
    }

    body = await req.json();
    const {
      name,
      rates,
      isDefault,
      countryOfOrigin,
      defaultShipping,
      defaultShippingCurrency,
    } = body;

    // Default shipping is required
    if (defaultShipping === null || defaultShipping === undefined) {
      return NextResponse.json(
        { error: "Default shipping cost is required" },
        { status: 400 }
      );
    }

    // If this is set as default, unset any existing default options
    if (isDefault) {
      await db.shippingOption.updateMany({
        where: {
          sellerId: session.user.id,
          isDefault: true,
          id: { not: optionId },
        },
        data: {
          isDefault: false,
        },
      });
    }

    // First, delete all existing rates
    await db.shippingRate.deleteMany({
      where: {
        profileId: optionId,
      },
    });

    // Then update the option and create new rates
    const shippingOption = await db.shippingOption.update({
      where: {
        id: optionId,
        sellerId: session.user.id,
      },
      data: {
        name,
        isDefault,
        countryOfOrigin,
        defaultShipping: defaultShipping ?? null,
        defaultShippingCurrency: defaultShippingCurrency || "USD",
        rates: {
          create: rates.map((rate: any) => {
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
              isFreeShipping: rate.isFreeShipping,
            };
          }),
        },
      },
      include: {
        rates: true,
      },
    });

    return NextResponse.json(shippingOption);
  } catch (error) {
    // Log to console (always happens)
    console.error("[SHIPPING_PROFILES_PUT]", error);

    // Log to database - user could email about "couldn't update shipping option"
    const userMessage = logError({
      code: "SHIPPING_OPTION_UPDATE_FAILED",
      userId: session?.user?.id,
      route: "/api/shipping-options/[optionId]",
      method: "PUT",
      error,
      metadata: {
        optionId,
        name: body?.name,
        ratesCount: body?.rates?.length,
        isDefault: body?.isDefault,
        note: "Failed to update shipping option",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { optionId: string } }
) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let optionId: string | undefined = undefined;

  try {
    session = await auth();
    optionId = params.optionId;
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Validate that the optionId is a valid ObjectID
    if (!ObjectId.isValid(optionId)) {
      return new NextResponse("Invalid option ID format", { status: 400 });
    }

    // Delete the option (this will cascade delete the rates)
    await db.shippingOption.delete({
      where: {
        id: optionId,
        sellerId: session.user.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // Log to console (always happens)
    console.error("[SHIPPING_PROFILES_DELETE]", error);

    // Log to database - user could email about "couldn't delete shipping option"
    const userMessage = logError({
      code: "SHIPPING_OPTION_DELETE_FAILED",
      userId: session?.user?.id,
      route: "/api/shipping-options/[optionId]",
      method: "DELETE",
      error,
      metadata: {
        optionId,
        note: "Failed to delete shipping option",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
