import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { getCurrencyDecimals } from "@/data/units";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = 'force-dynamic';

// Schema for updating discount codes - now accepts currency amounts instead of cents
const updateDiscountCodeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]).optional(),
  discountValue: z.number().min(0).optional(), // Now in currency units (e.g., dollars, euros)
  minimumOrderAmount: z.number().min(0).optional(), // Now in currency units
  maximumDiscountAmount: z.number().min(0).optional(), // Now in currency units
  maxUses: z.number().min(0).optional(),
  maxUsesPerCustomer: z.number().min(0).optional(),
  expiresAt: z.string().optional(), // ISO date string
  isActive: z.boolean().optional(),
  appliesToAllProducts: z.boolean().optional(),
  applicableProductIds: z.array(z.string()).optional(),
  applicableCategories: z.array(z.string()).optional(),
  stackableWithProductSales: z.boolean().optional(),
});

// GET - Fetch a specific discount code
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let discountCodeId: string | undefined = undefined;

  try {
    session = await auth();
    discountCodeId = params.id;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const discountCode = await db.discountCode.findUnique({
      where: { id: params.id },
      include: { seller: true },
    });

    if (!discountCode) {
      return NextResponse.json(
        { error: "Discount code not found" },
        { status: 404 }
      );
    }

    // Check if user is the seller or has admin permissions
    if (session.user.id !== discountCode.sellerId) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: { admin: true },
      });

      if (!user?.admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    return NextResponse.json(discountCode);
  } catch (error) {
    // Log to console (always happens)
    console.error("Error fetching discount code:", error);

    // Log to database - user could email about "can't see discount code"
    const userMessage = logError({
      code: "DISCOUNT_CODE_FETCH_FAILED",
      userId: session?.user?.id,
      route: "/api/seller/discount-codes/[id]",
      method: "GET",
      error,
      metadata: {
        discountCodeId,
        note: "Failed to fetch discount code",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

// PUT - Update a discount code
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;
  let discountCodeId: string | undefined = undefined;

  try {
    session = await auth();
    discountCodeId = params.id;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    body = await request.json();
    const validatedData = updateDiscountCodeSchema.parse(body);

    // Get the existing discount code to check permissions
    const existingCode = await db.discountCode.findUnique({
      where: { id: params.id },
      include: { seller: true },
    });

    if (!existingCode) {
      return NextResponse.json(
        { error: "Discount code not found" },
        { status: 404 }
      );
    }

    // Check if user is the seller
    if (session.user.id !== existingCode.sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate discount value if being updated
    if (validatedData.discountValue !== undefined) {
      const discountType =
        validatedData.discountType || existingCode.discountType;
      if (discountType === "PERCENTAGE" && validatedData.discountValue > 100) {
        return NextResponse.json(
          { error: "Percentage discount cannot exceed 100%" },
          { status: 400 }
        );
      }
    }

    // Convert currency amounts to cents if they're being updated
    const decimals = getCurrencyDecimals(existingCode.seller.preferredCurrency);
    const multiplier = Math.pow(10, decimals);

    let discountValueInCents = undefined;
    if (validatedData.discountValue !== undefined) {
      const discountType =
        validatedData.discountType || existingCode.discountType;
      discountValueInCents =
        discountType === "PERCENTAGE"
          ? validatedData.discountValue // Keep percentage as-is
          : Math.round(validatedData.discountValue * multiplier); // Convert currency to cents
    }

    const minimumOrderAmountInCents =
      validatedData.minimumOrderAmount !== undefined
        ? validatedData.minimumOrderAmount
          ? Math.round(validatedData.minimumOrderAmount * multiplier)
          : null
        : undefined;

    const maximumDiscountAmountInCents =
      validatedData.maximumDiscountAmount !== undefined
        ? validatedData.maximumDiscountAmount
          ? Math.round(validatedData.maximumDiscountAmount * multiplier)
          : null
        : undefined;

    // Update the discount code
    const updatedCode = await db.discountCode.update({
      where: { id: params.id },
      data: {
        ...(validatedData.name !== undefined && { name: validatedData.name }),
        ...(validatedData.description !== undefined && {
          description: validatedData.description,
        }),
        ...(validatedData.discountType !== undefined && {
          discountType: validatedData.discountType,
        }),
        ...(discountValueInCents !== undefined && {
          discountValue: discountValueInCents,
        }),
        ...(minimumOrderAmountInCents !== undefined && {
          minimumOrderAmount: minimumOrderAmountInCents,
        }),
        ...(maximumDiscountAmountInCents !== undefined && {
          maximumDiscountAmount: maximumDiscountAmountInCents,
        }),
        ...(validatedData.maxUses !== undefined && {
          maxUses: validatedData.maxUses || null,
        }),
        ...(validatedData.maxUsesPerCustomer !== undefined && {
          maxUsesPerCustomer: validatedData.maxUsesPerCustomer || null,
        }),
        ...(validatedData.expiresAt !== undefined && {
          expiresAt: validatedData.expiresAt
            ? new Date(validatedData.expiresAt)
            : null,
        }),
        ...(validatedData.isActive !== undefined && {
          isActive: validatedData.isActive,
        }),
        ...(validatedData.appliesToAllProducts !== undefined && {
          appliesToAllProducts: validatedData.appliesToAllProducts,
        }),
        ...(validatedData.applicableProductIds !== undefined && {
          applicableProductIds: validatedData.applicableProductIds,
        }),
        ...(validatedData.applicableCategories !== undefined && {
          applicableCategories: validatedData.applicableCategories,
        }),
        ...(validatedData.stackableWithProductSales !== undefined && {
          stackableWithProductSales: validatedData.stackableWithProductSales,
        }),
      },
    });

    return NextResponse.json(updatedCode);
  } catch (error) {
    // Check if it's a ZodError (validation error) - don't log these to DB
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    // Log to console (always happens)
    console.error("Error updating discount code:", error);

    // Log to database - user could email about "couldn't update discount code"
    const userMessage = logError({
      code: "DISCOUNT_CODE_UPDATE_FAILED",
      userId: session?.user?.id,
      route: "/api/seller/discount-codes/[id]",
      method: "PUT",
      error,
      metadata: {
        discountCodeId,
        note: "Failed to update discount code",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

// PATCH - Partial update (mainly for toggling active status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;
  let discountCodeId: string | undefined = undefined;

  try {
    session = await auth();
    discountCodeId = params.id;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    body = await request.json();
    const { isActive } = body;

    // Get the existing discount code to check permissions
    const existingCode = await db.discountCode.findUnique({
      where: { id: params.id },
    });

    if (!existingCode) {
      return NextResponse.json(
        { error: "Discount code not found" },
        { status: 404 }
      );
    }

    // Check if user is the seller
    if (session.user.id !== existingCode.sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update the discount code
    const updatedCode = await db.discountCode.update({
      where: { id: params.id },
      data: { isActive },
    });

    return NextResponse.json(updatedCode);
  } catch (error) {
    // Log to console (always happens)
    console.error("Error updating discount code:", error);

    // Log to database - user could email about "couldn't toggle discount code"
    const userMessage = logError({
      code: "DISCOUNT_CODE_TOGGLE_FAILED",
      userId: session?.user?.id,
      route: "/api/seller/discount-codes/[id]",
      method: "PATCH",
      error,
      metadata: {
        discountCodeId,
        isActive: body?.isActive,
        note: "Failed to toggle discount code active status",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

// DELETE - Delete a discount code
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let discountCodeId: string | undefined = undefined;

  try {
    session = await auth();
    discountCodeId = params.id;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the existing discount code to check permissions
    const existingCode = await db.discountCode.findUnique({
      where: { id: params.id },
    });

    if (!existingCode) {
      return NextResponse.json(
        { error: "Discount code not found" },
        { status: 404 }
      );
    }

    // Check if user is the seller
    if (session.user.id !== existingCode.sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if code has been used
    const usageCount = await db.discountCodeUsage.count({
      where: { discountCodeId: params.id },
    });

    if (usageCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete discount code that has been used" },
        { status: 400 }
      );
    }

    // Delete the discount code
    await db.discountCode.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Discount code deleted successfully" });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error deleting discount code:", error);

    // Log to database - user could email about "couldn't delete discount code"
    const userMessage = logError({
      code: "DISCOUNT_CODE_DELETE_FAILED",
      userId: session?.user?.id,
      route: "/api/seller/discount-codes/[id]",
      method: "DELETE",
      error,
      metadata: {
        discountCodeId,
        note: "Failed to delete discount code",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
