import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const productId = params.productId;
    if (!productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }

    // Find a completed, paid order for this user and product
    const order = await db.order.findFirst({
      where: {
        userId: session.user.id,
        productId,
        isDigital: true,
        status: "COMPLETED",
        paymentStatus: "PAID",
        // Ensure the order hasn't been refunded
        NOT: {
          status: "REFUNDED"
        }
      },
      select: {
        id: true,
        product: {
          select: {
            productFile: true,
          },
        },
      },
    });

    if (!order || !order.product?.productFile) {
      return NextResponse.json({ error: "No eligible order found or file missing" }, { status: 403 });
    }

    // Track the download attempt
    await db.order.update({
      where: { id: order.id },
      data: {
        digitalDownloadAttempted: true,
        digitalDownloadedAt: new Date(),
      },
    });

    // Option 1: Redirect to the file URL (if it's a signed/private URL)
    return NextResponse.redirect(order.product.productFile);

    // Option 2: (If you want to stream the file instead, implement file streaming here)
  } catch (error) {
    console.error("[DOWNLOAD_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 