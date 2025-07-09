import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Schema for updating discount codes
const updateDiscountCodeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]).optional(),
  discountValue: z.number().min(0).optional(),
  minimumOrderAmount: z.number().min(0).optional(),
  maximumDiscountAmount: z.number().min(0).optional(),
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
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const discountCode = await db.discountCode.findUnique({
      where: { id: params.id },
      include: {
        seller: true,
        usages: {
          include: {
            order: true,
          },
          orderBy: { usedAt: "desc" },
        },
      },
    });

    if (!discountCode) {
      return NextResponse.json({ error: "Discount code not found" }, { status: 404 });
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
    console.error("Error fetching discount code:", error);
    return NextResponse.json(
      { error: "Failed to fetch discount code" },
      { status: 500 }
    );
  }
}

// PUT - Update a discount code
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateDiscountCodeSchema.parse(body);

    // Get the discount code to check ownership
    const existingCode = await db.discountCode.findUnique({
      where: { id: params.id },
    });

    if (!existingCode) {
      return NextResponse.json({ error: "Discount code not found" }, { status: 404 });
    }

    // Verify the user is the seller
    if (session.user.id !== existingCode.sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate discount value if being updated
    if (validatedData.discountType === "PERCENTAGE" && validatedData.discountValue && validatedData.discountValue > 100) {
      return NextResponse.json(
        { error: "Percentage discount cannot exceed 100%" },
        { status: 400 }
      );
    }

    // Update the discount code
    const updatedCode = await db.discountCode.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined,
      },
    });

    return NextResponse.json(updatedCode);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating discount code:", error);
    return NextResponse.json(
      { error: "Failed to update discount code" },
      { status: 500 }
    );
  }
}

// PATCH - Partial update (mainly for toggling active status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { isActive } = body;

    // Get the discount code to check ownership
    const existingCode = await db.discountCode.findUnique({
      where: { id: params.id },
    });

    if (!existingCode) {
      return NextResponse.json({ error: "Discount code not found" }, { status: 404 });
    }

    // Verify the user is the seller
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
    console.error("Error updating discount code:", error);
    return NextResponse.json(
      { error: "Failed to update discount code" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a discount code
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the discount code to check ownership
    const existingCode = await db.discountCode.findUnique({
      where: { id: params.id },
    });

    if (!existingCode) {
      return NextResponse.json({ error: "Discount code not found" }, { status: 404 });
    }

    // Verify the user is the seller
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
    console.error("Error deleting discount code:", error);
    return NextResponse.json(
      { error: "Failed to delete discount code" },
      { status: 500 }
    );
  }
} 