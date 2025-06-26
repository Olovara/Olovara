import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { markShippingProfileCreated } from "@/actions/sellerOnboardingActions";
import { updateUserSession } from "@/lib/session-update";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, rates, isDefault, countryOfOrigin } = body;

    // If this is set as default, unset any existing default profiles
    if (isDefault) {
      await db.shippingProfile.updateMany({
        where: {
          sellerId: session.user.id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const shippingProfile = await db.shippingProfile.create({
      data: {
        name,
        isDefault,
        countryOfOrigin,
        sellerId: session.user.id,
        rates: {
          create: rates.map((rate: any) => ({
            zone: rate.zone,
            price: rate.price,
            currency: rate.currency,
            estimatedDays: rate.estimatedDays,
            additionalItem: rate.additionalItem,
            serviceLevel: rate.serviceLevel,
            isFreeShipping: rate.isFreeShipping,
          })),
        },
      },
      include: {
        rates: true,
      },
    });

    // Mark shipping profile creation as complete if it's not already
    const currentOnboarding = session.user.sellerOnboarding;
    if (!currentOnboarding?.shippingProfileCreated) {
      await markShippingProfileCreated();
    } else {
      // If already complete, just update the session to ensure it's current
      await updateUserSession(session.user.id);
    }

    return NextResponse.json(shippingProfile);
  } catch (error) {
    console.error("[SHIPPING_PROFILES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const shippingProfiles = await db.shippingProfile.findMany({
      where: {
        sellerId: session.user.id,
      },
      include: {
        rates: true,
      },
    });

    return NextResponse.json(shippingProfiles);
  } catch (error) {
    console.error("[SHIPPING_PROFILES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 