import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { getCurrencyDecimals } from "@/data/units";
import { logError } from "@/lib/error-logger";

// Schema for creating discount codes - now accepts currency amounts instead of cents
const createDiscountCodeSchema = z.object({
  sellerId: z.string(),
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  discountValue: z.number().min(0), // Now in currency units (e.g., dollars, euros)
  minimumOrderAmount: z.number().min(0).optional(), // Now in currency units
  maximumDiscountAmount: z.number().min(0).optional(), // Now in currency units
  maxUses: z.number().min(0).optional(),
  maxUsesPerCustomer: z.number().min(0).optional(),
  expiresAt: z.string().optional(), // ISO date string
  isActive: z.boolean().default(true),
  appliesToAllProducts: z.boolean().default(true),
  applicableProductIds: z.array(z.string()).default([]),
  applicableCategories: z.array(z.string()).default([]),
  stackableWithProductSales: z.boolean().default(true),
});

// GET - Fetch discount codes for a seller
export async function GET(request: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get("sellerId");

    if (!sellerId) {
      return NextResponse.json(
        { error: "Seller ID is required" },
        { status: 400 }
      );
    }

    // Verify the user is the seller or an admin
    const seller = await db.seller.findUnique({
      where: { userId: sellerId },
    });

    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    // Check if user is the seller or has admin permissions
    if (session.user.id !== sellerId) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: { admin: true },
      });

      if (!user?.admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const discountCodes = await db.discountCode.findMany({
      where: { sellerId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(discountCodes);
  } catch (error) {
    // Log to console (always happens)
    console.error("Error fetching discount codes:", error);

    // Log to database - user could email about "can't see discount codes"
    const userMessage = logError({
      code: "DISCOUNT_CODES_FETCH_FAILED",
      userId: session?.user?.id,
      route: "/api/seller/discount-codes",
      method: "GET",
      error,
      metadata: {
        note: "Failed to fetch discount codes",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

// POST - Create a new discount code
export async function POST(request: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    body = await request.json();
    const validatedData = createDiscountCodeSchema.parse(body);

    // Verify the user is the seller
    if (session.user.id !== validatedData.sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if seller exists and get their preferred currency
    const seller = await db.seller.findUnique({
      where: { userId: validatedData.sellerId },
      select: {
        id: true,
        preferredCurrency: true,
      },
    });

    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    // Check if code already exists (case insensitive)
    const existingCode = await db.discountCode.findFirst({
      where: {
        code: { equals: validatedData.code, mode: "insensitive" },
      },
    });

    if (existingCode) {
      return NextResponse.json(
        { error: "Discount code already exists" },
        { status: 400 }
      );
    }

    // Validate discount value based on type
    if (
      validatedData.discountType === "PERCENTAGE" &&
      validatedData.discountValue > 100
    ) {
      return NextResponse.json(
        { error: "Percentage discount cannot exceed 100%" },
        { status: 400 }
      );
    }

    // Convert currency amounts to cents
    const decimals = getCurrencyDecimals(seller.preferredCurrency);
    const multiplier = Math.pow(10, decimals);

    // Convert amounts to cents for storage
    const discountValueInCents =
      validatedData.discountType === "PERCENTAGE"
        ? validatedData.discountValue // Keep percentage as-is
        : Math.round(validatedData.discountValue * multiplier); // Convert currency to cents

    const minimumOrderAmountInCents = validatedData.minimumOrderAmount
      ? Math.round(validatedData.minimumOrderAmount * multiplier)
      : null;

    const maximumDiscountAmountInCents = validatedData.maximumDiscountAmount
      ? Math.round(validatedData.maximumDiscountAmount * multiplier)
      : null;

    // Create the discount code
    const discountCode = await db.discountCode.create({
      data: {
        sellerId: validatedData.sellerId,
        code: validatedData.code.toUpperCase(),
        name: validatedData.name,
        description: validatedData.description,
        discountType: validatedData.discountType,
        discountValue: discountValueInCents,
        minimumOrderAmount: minimumOrderAmountInCents,
        maximumDiscountAmount: maximumDiscountAmountInCents,
        maxUses: validatedData.maxUses || null,
        maxUsesPerCustomer: validatedData.maxUsesPerCustomer || null,
        expiresAt: validatedData.expiresAt
          ? new Date(validatedData.expiresAt)
          : null,
        isActive: validatedData.isActive,
        appliesToAllProducts: validatedData.appliesToAllProducts,
        applicableProductIds: validatedData.applicableProductIds,
        applicableCategories: validatedData.applicableCategories,
        stackableWithProductSales: validatedData.stackableWithProductSales,
      },
    });

    return NextResponse.json(discountCode, { status: 201 });
  } catch (error) {
    // Check if it's a ZodError (validation error) - don't log these to DB
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    // Log to console (always happens)
    console.error("Error creating discount code:", error);

    // Log to database - user could email about "couldn't create discount code"
    const userMessage = logError({
      code: "DISCOUNT_CODE_CREATE_FAILED",
      userId: session?.user?.id,
      route: "/api/seller/discount-codes",
      method: "POST",
      error,
      metadata: {
        sellerId: body?.sellerId,
        code: body?.code,
        discountType: body?.discountType,
        note: "Failed to create discount code",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
