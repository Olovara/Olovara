import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function PUT(
  req: Request,
  { params }: { params: { optionId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Validate that the optionId is a valid ObjectID
    if (!ObjectId.isValid(params.optionId)) {
      return new NextResponse("Invalid option ID format", { status: 400 });
    }

    const body = await req.json();
    const { name, rates, isDefault, countryOfOrigin } = body;

    // If this is set as default, unset any existing default options
    if (isDefault) {
      await db.shippingOption.updateMany({
        where: {
          sellerId: session.user.id,
          isDefault: true,
          id: { not: params.optionId },
        },
        data: {
          isDefault: false,
        },
      });
    }

    // First, delete all existing rates
    await db.shippingRate.deleteMany({
      where: {
        profileId: params.optionId,
      },
    });

    // Then update the option and create new rates
    const shippingOption = await db.shippingOption.update({
      where: {
        id: params.optionId,
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
            countryRates: rate.countryRates || [],
          })),
        },
      },
      include: {
        rates: true,
      },
    });

    return NextResponse.json(shippingOption);
  } catch (error) {
    console.error("[SHIPPING_PROFILES_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { optionId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Validate that the optionId is a valid ObjectID
    if (!ObjectId.isValid(params.optionId)) {
      return new NextResponse("Invalid option ID format", { status: 400 });
    }

    // Delete the option (this will cascade delete the rates)
    await db.shippingOption.delete({
      where: {
        id: params.optionId,
        sellerId: session.user.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[SHIPPING_PROFILES_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
