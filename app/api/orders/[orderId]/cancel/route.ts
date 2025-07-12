import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { OrderStatus } from "@prisma/client";
import { ObjectId } from "mongodb";
import { PERMISSIONS } from "@/data/roles-and-permissions";

export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    // Validate that the orderId is a valid ObjectID
    if (!ObjectId.isValid(params.orderId)) {
      return NextResponse.json(
        { error: "Invalid order ID format" },
        { status: 400 }
      );
    }

    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Fetch user permissions from database
    const dbUser = await db.user.findUnique({
      where: { id: userId },
      select: { permissions: true }
    });

    // Check if user has permission to manage orders
    if (!dbUser?.permissions?.includes(PERMISSIONS.MANAGE_ORDERS.value)) {
      return NextResponse.json(
        { error: "Insufficient permissions to manage orders" },
        { status: 403 }
      );
    }
    
    // Get the order
    const order = await db.order.findUnique({
      where: { id: params.orderId },
      include: { seller: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    // Verify the user is the seller of this order
    if (order.sellerId !== userId) {
      return NextResponse.json(
        { error: "You are not authorized to cancel this order." },
        { status: 403 }
      );
    }

    // Check if the order is already failed or completed
    if (order.status === OrderStatus.CANCELLED) {
      return NextResponse.json(
        { error: "This order is already cancelled." },
        { status: 400 }
      );
    }

    if (order.status === OrderStatus.COMPLETED) {
      return NextResponse.json(
        { error: "Cannot cancel a completed order." },
        { status: 400 }
      );
    }

    // Update the order status to CANCELLED
    await db.order.update({
      where: { id: params.orderId },
      data: { status: OrderStatus.CANCELLED },
    });

    return NextResponse.json({ success: "Order cancelled successfully." });
  } catch (error) {
    console.error("Error in cancel order API:", error);
    return NextResponse.json(
      { error: "Failed to cancel order" },
      { status: 500 }
    );
  }
} 