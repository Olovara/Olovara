import { NextRequest, NextResponse } from "next/server";
import { refundOrder } from "@/actions/orders";
import { auth } from "@/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Call the server action
    const result = await refundOrder(params.orderId);
    
    // Return the result
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in refund order API:", error);
    return NextResponse.json(
      { error: "Failed to refund order" },
      { status: 500 }
    );
  }
} 