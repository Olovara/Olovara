import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function PUT(
  req: Request,
  { params }: { params: { profileId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Validate that the profileId is a valid ObjectID
    if (!ObjectId.isValid(params.profileId)) {
      return new NextResponse("Invalid profile ID format", { status: 400 });
    }

    const body = await req.json();
    const { name, rates, isDefault, countryOfOrigin } = body;

    // If this is set as default, unset any existing default profiles
    if (isDefault) {
      await db.shippingProfile.updateMany({
        where: {
          sellerId: session.user.id,
          isDefault: true,
          id: { not: params.profileId },
        },
        data: {
          isDefault: false,
        },
      });
    }

    // First, delete all existing rates
    await db.shippingRate.deleteMany({
      where: {
        profileId: params.profileId,
      },
    });

    // Then update the profile and create new rates
    const shippingProfile = await db.shippingProfile.update({
      where: {
        id: params.profileId,
        sellerId: session.user.id,
      },
      data: {
        name,
        isDefault,
        countryOfOrigin,
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

    return NextResponse.json(shippingProfile);
  } catch (error) {
    console.error("[SHIPPING_PROFILES_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { profileId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Validate that the profileId is a valid ObjectID
    if (!ObjectId.isValid(params.profileId)) {
      return new NextResponse("Invalid profile ID format", { status: 400 });
    }

    // Delete the profile (this will cascade delete the rates)
    await db.shippingProfile.delete({
      where: {
        id: params.profileId,
        sellerId: session.user.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[SHIPPING_PROFILES_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 