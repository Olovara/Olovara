import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { validateDiscountCode } from "@/lib/discount-calculator";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();
    const { code, sellerId, productId, orderAmount } = body;

    if (!code || !sellerId || !productId || orderAmount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate the discount code
    const validationResult = await validateDiscountCode(
      code,
      sellerId,
      productId,
      orderAmount,
      session?.user?.id
    );

    if (!validationResult.isValid) {
      return NextResponse.json(
        { 
          error: validationResult.error,
          isValid: false 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      isValid: true,
      discountCode: validationResult.discountCode,
    });

  } catch (error) {
    console.error("Discount validation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 