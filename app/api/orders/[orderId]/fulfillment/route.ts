import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { OrderStatus } from "@prisma/client";
import { z } from "zod";
import { Resend } from "resend";
import { ObjectId } from "mongodb";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PERMISSIONS } from "@/data/roles-and-permissions";
import { logError } from "@/lib/error-logger";
import { decryptOrderData } from "@/lib/encryption";
import { getTrackingUrl } from "@/lib/shipping/tracking-url";
import OrderShippedEmail from "@/components/emails/OrderShippedEmail";

export const dynamic = "force-dynamic";

const CARRIERS = z.enum(["USPS", "UPS", "FedEx", "DHL", "Other"]);

const BodySchema = z.object({
  to: z.nativeEnum(OrderStatus),
  updateShipmentOnly: z.boolean().optional(),
  trackingNumber: z.string().min(1).optional(),
  carrier: CARRIERS.optional(),
  shippingService: z.string().max(200).optional().nullable(),
  /** ISO 8601 date string */
  estimatedDeliveryDate: z.string().optional().nullable(),
});

const resend = new Resend(process.env.RESEND_API_KEY);

function isPaidLike(s: OrderStatus) {
  return (
    s === "PENDING" ||
    s === "PAID" ||
    s === "PENDING_TRANSFER" ||
    s === "HELD" ||
    s === "PROCESSING"
  );
}

function canSellerTransition(
  from: OrderStatus,
  to: OrderStatus,
  isDigital: boolean,
): boolean {
  if (from === to) return true;
  if (isDigital) {
    return (
      (from === "PAID" && to === "COMPLETED") ||
      (from === "PENDING" && to === "COMPLETED")
    );
  }
  if (to === "CANCELLED") {
    return isPaidLike(from);
  }
  if (to === "PROCESSING" && (from === "PAID" || from === "PENDING" || from === "PENDING_TRANSFER" || from === "HELD")) {
    return true;
  }
  if (to === "SHIPPED" && (from === "PAID" || from === "PROCESSING" || from === "PENDING" || from === "PENDING_TRANSFER" || from === "HELD")) {
    return true;
  }
  if (to === "DELIVERED" && from === "SHIPPED") {
    return true;
  }
  if (to === "COMPLETED") {
    if (isDigital) {
      return from === "DELIVERED" || from === "SHIPPED" || from === "PAID" || from === "PENDING" || from === "PROCESSING";
    }
    return from === "DELIVERED" || from === "SHIPPED";
  }
  if (to === "PAID" && (from === "PENDING" || from === "PENDING_TRANSFER" || from === "HELD")) {
    return true;
  }
  return false;
}

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { orderId: string } },
) {
  let session: Session | null = null;
  try {
    if (!ObjectId.isValid(params.orderId)) {
      return NextResponse.json(
        { error: "Invalid order ID format" },
        { status: 400 },
      );
    }

    session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Load order early for authorization decisions.
    const order = await db.order.findUnique({
      where: { id: params.orderId },
      select: {
        id: true,
        sellerId: true,
        status: true,
        isDigital: true,
        productName: true,
        shopName: true,
        customOrderSubmissionId: true,
        trackingNumber: true,
        trackingUrl: true,
        carrier: true,
        shippingService: true,
        estimatedDeliveryDate: true,
        shippedAt: true,
        encryptedBuyerEmail: true,
        buyerEmailIV: true,
        buyerEmailSalt: true,
      },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Sellers can always manage fulfillment for their own orders.
    // Only require MANAGE_ORDERS when acting on someone else's order (e.g. admin tooling).
    if (order.sellerId !== session.user.id) {
      const dbUser = await db.user.findUnique({
        where: { id: session.user.id },
        select: { permissions: true },
      });
      if (!dbUser?.permissions?.includes(PERMISSIONS.MANAGE_ORDERS.value)) {
        return NextResponse.json(
          { error: "Insufficient permissions to manage orders" },
          { status: 403 },
        );
      }
    }

    const json = await _request.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const {
      to,
      updateShipmentOnly,
      trackingNumber,
      carrier,
      shippingService,
      estimatedDeliveryDate,
    } = parsed.data;

    if (order.isDigital && !updateShipmentOnly) {
      if (to === "SHIPPED" || to === "DELIVERED" || to === "PROCESSING") {
        return NextResponse.json(
          { error: "Digital orders are not shipped; use status updates like Completed." },
          { status: 400 },
        );
      }
    }

    const editingShipment =
      updateShipmentOnly &&
      (order.status === "SHIPPED" || order.status === "DELIVERED");

    if (editingShipment) {
      if (to !== order.status) {
        return NextResponse.json(
          { error: "When updateShipmentOnly is true, to must match current status" },
          { status: 400 },
        );
      }
      if (!trackingNumber || !carrier) {
        return NextResponse.json(
          { error: "Tracking number and carrier are required" },
          { status: 400 },
        );
      }
      const url =
        getTrackingUrl(carrier, trackingNumber) ??
        (order.trackingUrl || null);
      await db.order.update({
        where: { id: order.id },
        data: {
          trackingNumber: trackingNumber.trim(),
          carrier,
          shippingService: shippingService ?? null,
          estimatedDeliveryDate: estimatedDeliveryDate
            ? new Date(estimatedDeliveryDate)
            : null,
          trackingUrl: url,
        },
      });
      revalidatePath("/seller/dashboard/my-orders");
      revalidatePath("/member/dashboard/my-purchases");
      return NextResponse.json({ success: true, orderId: order.id });
    }

  if (to === "SHIPPED" && !order.isDigital) {
    if (!trackingNumber?.trim() || !carrier) {
      return NextResponse.json(
        {
          error:
            "To mark an order as shipped, provide trackingNumber and carrier",
        },
        { status: 400 },
      );
    }
  }

    if (!editingShipment && !canSellerTransition(order.status, to, order.isDigital)) {
      return NextResponse.json(
        { error: `Cannot move from ${order.status} to ${to}` },
        { status: 400 },
      );
    }

    const wantShipEmail = to === "SHIPPED" && order.status !== "SHIPPED";

    let trackingUrl: string | null = order.trackingUrl;
    if (to === "SHIPPED" && trackingNumber && carrier) {
      trackingUrl = getTrackingUrl(carrier, trackingNumber);
    }

    const estimatedDate =
      estimatedDeliveryDate && estimatedDeliveryDate.length > 0
        ? new Date(estimatedDeliveryDate)
        : null;

    const updateData: Prisma.OrderUpdateInput = {
      status: to,
    };
    if (to === "SHIPPED" && !order.isDigital) {
      updateData.trackingNumber = trackingNumber?.trim() ?? null;
      updateData.carrier = carrier ?? null;
      updateData.shippingService = shippingService ?? null;
      updateData.estimatedDeliveryDate = estimatedDate;
      updateData.trackingUrl = trackingUrl;
      updateData.shippedAt = order.shippedAt ?? new Date();
    }
    if (to === "COMPLETED") {
      updateData.completedAt = new Date();
    }
    await db.order.update({
      where: { id: order.id },
      data: updateData,
    });

    if (wantShipEmail && process.env.RESEND_API_KEY) {
      try {
        const buyerEmail = decryptOrderData(
          order.encryptedBuyerEmail,
          order.buyerEmailIV,
          order.buyerEmailSalt,
        );
        if (buyerEmail?.trim()) {
          await resend.emails.send({
            from: "OLOVARA <noreply@olovara.com>",
            to: [buyerEmail.trim()],
            subject: `Your order has shipped — ${order.shopName}`,
            react: OrderShippedEmail({
              productName: order.productName,
              orderId: order.id,
              shopName: order.shopName,
              trackingUrl,
              trackingNumber: trackingNumber!.trim(),
              carrier: carrier!,
              shippingService: shippingService ?? null,
              estimatedDeliveryDate: estimatedDate
                ? estimatedDate.toLocaleDateString()
                : null,
            }),
          });
        }
      } catch (e) {
        console.error("[fulfillment] buyer shipped email failed:", e);
      }
    }

    revalidatePath("/seller/dashboard/my-orders");
    revalidatePath("/member/dashboard/my-purchases");
    return NextResponse.json({ success: true, orderId: order.id });
  } catch (error) {
    logError({
      code: "ORDER_FULFILLMENT_UPDATE_FAILED",
      userId: session?.user?.id,
      route: `/api/orders/${params?.orderId}/fulfillment`,
      method: "PATCH",
      error,
    });
    return NextResponse.json(
      { error: "Failed to update fulfillment" },
      { status: 500 },
    );
  }
}
