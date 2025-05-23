import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import EasyPost from "@easypost/api";

// Check if API key exists
const EASYPOST_API_KEY = process.env.EASYPOST_API_KEY;
if (!EASYPOST_API_KEY) {
  throw new Error("EASYPOST_API_KEY environment variable is not set");
}

// Initialize EasyPost client
const easypost = new EasyPost(EASYPOST_API_KEY);

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { productId, destinationAddress } = body;

    if (!productId || !destinationAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch the product and seller information
    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        seller: {
          include: {
            addresses: {
              where: { isDefault: true },
              select: {
                encryptedStreet: true,
                encryptedStreet2: true,
                encryptedCity: true,
                encryptedState: true,
                encryptedPostal: true,
                encryptedCountry: true,
                streetIV: true,
                streetSalt: true,
                street2IV: true,
                street2Salt: true,
                cityIV: true,
                citySalt: true,
                stateIV: true,
                stateSalt: true,
                postalIV: true,
                postalSalt: true,
                countryIV: true,
                countrySalt: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (!product.seller?.addresses?.[0]) {
      return NextResponse.json({ error: "Seller shipping address not found" }, { status: 400 });
    }

    const sellerAddress = product.seller.addresses[0];

    // Convert dimensions to inches if needed
    const convertToInches = (value: number, unit: string) => {
      if (unit === "cm") return value / 2.54;
      return value;
    };

    // Convert weight to ounces if needed
    const convertToOunces = (value: number, unit: string) => {
      if (unit === "kg") return value * 35.274;
      if (unit === "lbs") return value * 16;
      return value;
    };

    // Create from address
    const fromAddress = await easypost.Address.create({
      name: "Seller",
      street1: sellerAddress.encryptedStreet,
      street2: sellerAddress.encryptedStreet2 || undefined,
      city: sellerAddress.encryptedCity,
      state: sellerAddress.encryptedState || undefined,
      zip: sellerAddress.encryptedPostal,
      country: sellerAddress.encryptedCountry,
    });

    // Create to address
    const toAddress = await easypost.Address.create({
      name: destinationAddress.name || "Recipient",
      street1: destinationAddress.street1 || "",
      city: destinationAddress.city,
      state: destinationAddress.state,
      zip: destinationAddress.postalCode,
      country: destinationAddress.country,
      phone: destinationAddress.phone || "",
      email: destinationAddress.email || "",
    });

    // Create parcel
    const parcel = await easypost.Parcel.create({
      length: convertToInches(product.itemLength || 0, product.itemDimensionUnit),
      width: convertToInches(product.itemWidth || 0, product.itemDimensionUnit),
      height: convertToInches(product.itemHeight || 0, product.itemDimensionUnit),
      weight: convertToOunces(product.itemWeight || 0, product.itemWeightUnit),
    });

    // Create shipment
    const shipment = await easypost.Shipment.create({
      from_address: fromAddress,
      to_address: toAddress,
      parcel: parcel,
    });

    // Get rates
    const rates = shipment.rates;

    if (rates && rates.length > 0) {
      // Format and return the rates
      const formattedRates = rates.map((rate: any) => ({
        id: rate.id,
        service: rate.service,
        carrier: rate.carrier,
        amount: Math.round(rate.rate * 100), // Convert to cents
        currency: rate.currency,
        deliveryDays: rate.delivery_days,
        deliveryDate: rate.delivery_date,
      }));

      return NextResponse.json({ rates: formattedRates });
    } else {
      return NextResponse.json({ error: "No shipping rates available" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("[SHIPPING_CALCULATION_ERROR]", error);
    return NextResponse.json({ 
      error: error.message || "Internal Error",
      details: error.stack
    }, { status: 500 });
  }
} 