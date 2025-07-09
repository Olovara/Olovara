import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for creating discount codes
const createDiscountCodeSchema = z.object({
  sellerId: z.string(),
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  discountValue: z.number().min(0),
  minimumOrderAmount: z.number().min(0).optional(),
  maximumDiscountAmount: z.number().min(0).optional(),
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
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get("sellerId");

    if (!sellerId) {
      return NextResponse.json({ error: "Seller ID is required" }, { status: 400 });
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
    console.error("Error fetching discount codes:", error);
    return NextResponse.json(
      { error: "Failed to fetch discount codes" },
      { status: 500 }
    );
  }
}

// POST - Create a new discount code
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createDiscountCodeSchema.parse(body);

    // Verify the user is the seller
    if (session.user.id !== validatedData.sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if seller exists
    const seller = await db.seller.findUnique({
      where: { userId: validatedData.sellerId },
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
    if (validatedData.discountType === "PERCENTAGE" && validatedData.discountValue > 100) {
      return NextResponse.json(
        { error: "Percentage discount cannot exceed 100%" },
        { status: 400 }
      );
    }

    // Create the discount code
    const discountCode = await db.discountCode.create({
      data: {
        sellerId: validatedData.sellerId,
        code: validatedData.code.toUpperCase(),
        name: validatedData.name,
        description: validatedData.description,
        discountType: validatedData.discountType,
        discountValue: validatedData.discountValue,
        minimumOrderAmount: validatedData.minimumOrderAmount || null,
        maximumDiscountAmount: validatedData.maximumDiscountAmount || null,
        maxUses: validatedData.maxUses || null,
        maxUsesPerCustomer: validatedData.maxUsesPerCustomer || null,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
        isActive: validatedData.isActive,
        appliesToAllProducts: validatedData.appliesToAllProducts,
        applicableProductIds: validatedData.applicableProductIds,
        applicableCategories: validatedData.applicableCategories,
        stackableWithProductSales: validatedData.stackableWithProductSales,
      },
    });

    return NextResponse.json(discountCode, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating discount code:", error);
    return NextResponse.json(
      { error: "Failed to create discount code" },
      { status: 500 }
    );
  }
} 