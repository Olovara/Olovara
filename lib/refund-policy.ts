import { db } from "@/lib/db";

export interface RefundDecision {
  canRefund: boolean;
  reason: string;
  downloadAttempted: boolean;
  downloadedAt?: Date;
}

/**
 * Determines if a refund should be allowed for a digital product order
 * @param orderId - The order ID to check
 * @returns RefundDecision with details about the refund eligibility
 */
export async function checkDigitalRefundEligibility(orderId: string): Promise<RefundDecision> {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        isDigital: true,
        digitalDownloadAttempted: true,
        digitalDownloadedAt: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
      },
    });

    if (!order) {
      return {
        canRefund: false,
        reason: "Order not found",
        downloadAttempted: false,
      };
    }

    // If it's not a digital product, allow refund (normal refund policy applies)
    if (!order.isDigital) {
      return {
        canRefund: true,
        reason: "Physical product - standard refund policy applies",
        downloadAttempted: false,
      };
    }

    // For digital products, check if they've been downloaded
    if (order.digitalDownloadAttempted) {
      return {
        canRefund: false,
        reason: "Digital product has been downloaded - no refund allowed",
        downloadAttempted: true,
        downloadedAt: order.digitalDownloadedAt || undefined,
      };
    }

    // Digital product not downloaded - allow refund
    return {
      canRefund: true,
      reason: "Digital product not downloaded - refund allowed",
      downloadAttempted: false,
    };
  } catch (error) {
    console.error("Error checking refund eligibility:", error);
    return {
      canRefund: false,
      reason: "Error checking refund eligibility",
      downloadAttempted: false,
    };
  }
}

/**
 * Gets refund policy information for display to users
 */
export function getDigitalRefundPolicy(): string {
  return "Digital products are eligible for refunds only if they have not been downloaded. Once downloaded, no refunds will be issued to prevent fraud.";
} 