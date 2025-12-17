import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getCountryByCode } from "@/data/countries";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;

  try {
    session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    body = await request.json();
    const {
      name,
      countryOfOrigin,
      rates,
      defaultShipping,
      defaultShippingCurrency,
    } = body;

    if (!name || !countryOfOrigin) {
      return NextResponse.json(
        { error: "Name and country of origin are required" },
        { status: 400 }
      );
    }

    // Default shipping is required
    if (defaultShipping === null || defaultShipping === undefined) {
      return NextResponse.json(
        { error: "Default shipping cost is required" },
        { status: 400 }
      );
    }

    // Rates array is optional, but if provided must be an array
    if (rates !== undefined && !Array.isArray(rates)) {
      return NextResponse.json(
        { error: "Rates must be an array" },
        { status: 400 }
      );
    }

    // Get the seller profile
    const seller = await db.seller.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!seller) {
      return NextResponse.json(
        { error: "Seller profile not found" },
        { status: 404 }
      );
    }

    // Create shipping profile with rates
    const shippingOption = await db.shippingOption.create({
      data: {
        name,
        countryOfOrigin,
        defaultShipping: defaultShipping ?? null,
        defaultShippingCurrency: defaultShippingCurrency || "USD",
        sellerId: session.user.id,
        rates: {
          create: (rates || []).map((rate: any) => {
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

    // Note: Session refresh is now handled by the client-side page reload
    // The user's shipping option has been created in the database
    console.log(
      "Shipping option created successfully for user:",
      session.user.id
    );

    return NextResponse.json({
      success: true,
      shippingOption,
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error creating shipping option:", error);

    // Log to database - user could email about "couldn't create shipping option"
    const userMessage = logError({
      code: "SHIPPING_OPTION_CREATE_FAILED",
      userId: session?.user?.id,
      route: "/api/shipping-options",
      method: "POST",
      error,
      metadata: {
        name: body?.name,
        countryOfOrigin: body?.countryOfOrigin,
        ratesCount: body?.rates?.length,
        note: "Failed to create shipping option",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

export async function GET(req: Request) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check for sellerId query param (admin creating product for seller)
    const url = new URL(req.url);
    const sellerIdParam = url.searchParams.get("sellerId");

    // Determine which seller's shipping options to fetch
    let targetSellerId = session.user.id;

    if (sellerIdParam) {
      // Verify admin has permission to view other seller's shipping options
      const { hasPermission } = await import("@/lib/permissions");
      const canCreateForSellers = await hasPermission(
        session.user.id,
        "CREATE_PRODUCTS_FOR_SELLERS" as any
      );

      if (canCreateForSellers) {
        targetSellerId = sellerIdParam;
      }
    }

    const shippingOptions = await db.shippingOption.findMany({
      where: {
        sellerId: targetSellerId,
      },
      include: {
        rates: true,
      },
    });

    return NextResponse.json(shippingOptions);
  } catch (error) {
    // Log to console (always happens)
    console.error("[SHIPPING_PROFILES_GET]", error);

    // Log to database - user could email about "can't see shipping options"
    const userMessage = logError({
      code: "SHIPPING_OPTIONS_FETCH_FAILED",
      userId: session?.user?.id,
      route: "/api/shipping-options",
      method: "GET",
      error,
      metadata: {
        note: "Failed to fetch shipping options",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
