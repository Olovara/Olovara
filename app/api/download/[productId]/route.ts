import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logError } from "@/lib/error-logger";

export async function GET(
  req: Request,
  { params }: { params: { productId: string } }
) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let productId: string | undefined = undefined;
  let order: any = null;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    productId = params.productId;
    if (!productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }

    // Find a completed, paid order for this user and product
    order = await db.order.findFirst({
      where: {
        userId: session.user.id,
        productId,
        isDigital: true,
        status: "COMPLETED",
        paymentStatus: "PAID",
        // Ensure the order hasn't been refunded
        NOT: {
          status: "REFUNDED",
        },
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
      return NextResponse.json(
        { error: "No eligible order found or file missing" },
        { status: 403 }
      );
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
    // Log to console (always happens)
    console.error("[DOWNLOAD_ERROR]", error);

    // Log to database - user could email about "can't download product I paid for"
    const userMessage = logError({
      code: "PRODUCT_DOWNLOAD_FAILED",
      userId: session?.user?.id,
      route: "/api/download/[productId]",
      method: "GET",
      error,
      metadata: {
        productId,
        orderId: order?.id,
        hasProductFile: !!order?.product?.productFile,
        note: "Failed to download digital product",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
