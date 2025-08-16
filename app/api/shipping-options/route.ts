import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { name, countryOfOrigin, rates } = await request.json();

    if (!name || !countryOfOrigin || !rates || !Array.isArray(rates)) {
      return NextResponse.json(
        { error: "Name, country of origin, and rates array are required" },
        { status: 400 }
      );
    }

    // Get the seller profile
    const seller = await db.seller.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    });

    if (!seller) {
      return NextResponse.json({ error: "Seller profile not found" }, { status: 404 });
    }

    // Create shipping profile with rates
    const shippingOption = await db.shippingOption.create({
      data: {
        name,
        countryOfOrigin,
        sellerId: session.user.id,
        rates: {
          create: rates.map((rate: any) => ({
            zone: rate.zone,
            isInternational: rate.isInternational || false,
            price: rate.price,
            currency: rate.currency || "USD",
            estimatedDays: rate.estimatedDays,
            additionalItem: rate.additionalItem,
            serviceLevel: rate.serviceLevel,
            isFreeShipping: rate.isFreeShipping || false,
          }))
        }
      },
      include: {
        rates: true
      }
    });

    // Note: Session refresh is now handled by the client-side page reload
    // The user's shipping option has been created in the database
    console.log("Shipping option created successfully for user:", session.user.id);

    return NextResponse.json({
      success: true,
      shippingOption
    });

  } catch (error) {
          console.error("Error creating shipping option:", error);
      return NextResponse.json(
        { error: "Failed to create shipping option" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const shippingOptions = await db.shippingOption.findMany({
      where: {
        sellerId: session.user.id,
      },
      include: {
        rates: true,
      },
    });

    return NextResponse.json(shippingOptions);
  } catch (error) {
    console.error("[SHIPPING_PROFILES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 