import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { validateDiscountCode } from "@/lib/discount-calculator";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;

  try {
    session = await auth();
    body = await req.json();
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
          isValid: false,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      isValid: true,
      discountCode: validationResult.discountCode,
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Discount validation error:", error);

    // Don't log validation errors - they're expected client-side issues

    // Log to database - user could email about "discount validation not working"
    const userMessage = logError({
      code: "DISCOUNT_VALIDATION_FAILED",
      userId: session?.user?.id,
      route: "/api/discount/validate",
      method: "POST",
      error,
      metadata: {
        code: body?.code,
        sellerId: body?.sellerId,
        productId: body?.productId,
        note: "Failed to validate discount code",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
