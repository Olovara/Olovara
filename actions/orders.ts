"use server";

import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { decryptData } from "@/lib/encryption";
import { withDecryptedCustomerContact } from "@/lib/custom-order-submission-contact";

/** Product marketplace order row (seller/buyer lists). */
export type ProductOrderRow = {
  source: "product";
  id: string;
  userId: string | null;
  sellerId: string;
  shopName: string;
  productId: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  productPrice: number;
  shippingCost: number;
  stripeFee: number;
  isDigital: boolean;
  status: string;
  paymentStatus: string;
  stripeSessionId: string;
  stripeTransferId: string | null;
  encryptedBuyerEmail: string;
  buyerEmailIV: string;
  buyerEmailSalt: string;
  encryptedBuyerName: string;
  buyerNameIV: string;
  buyerNameSalt: string;
  encryptedShippingAddress: string;
  shippingAddressIV: string;
  shippingAddressSalt: string;
  discount: unknown;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  orderInstructions?: string | null;
  batchNumber?: string | null;
  product: { name: string; images: string[] };
  buyerEmail: string;
  buyerName: string | null;
  shippingAddress: unknown | null;
};

/** Completed custom order surfaced alongside product orders. */
export type CustomOrderListRow = {
  source: "custom_order";
  id: string;
  submissionId: string;
  buyerEmail: string;
  buyerName: string | null;
  productName: string;
  shopName: string;
  status: "COMPLETED";
  paymentStatus: "PAID";
  totalAmount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  product: { name: string; images: string[] };
};

export type SellerOrderListEntry = ProductOrderRow | CustomOrderListRow;

export type BuyerPurchaseListEntry = ProductOrderRow | CustomOrderListRow;

function customOrderTotalCents(row: {
  totalAmount: number | null;
  quoteDepositMinor: number | null;
  finalPaymentAmount: number | null;
}): number {
  if (row.totalAmount != null && row.totalAmount > 0) {
    return row.totalAmount;
  }
  const d = row.quoteDepositMinor ?? 0;
  const f = row.finalPaymentAmount ?? 0;
  return d + f;
}

async function completedCustomOrdersForSeller(
  sellerUserId: string,
): Promise<CustomOrderListRow[]> {
  const submissionSelect = {
    id: true,
    totalAmount: true,
    quoteDepositMinor: true,
    finalPaymentAmount: true,
    currency: true,
    completedAt: true,
    updatedAt: true,
    createdAt: true,
    customerEmail: true,
    customerName: true,
    encryptedCustomerEmail: true,
    customerEmailIV: true,
    customerEmailSalt: true,
    encryptedCustomerName: true,
    customerNameIV: true,
    customerNameSalt: true,
    form: {
      select: {
        title: true,
        seller: { select: { shopName: true } },
      },
    },
  } satisfies Prisma.CustomOrderSubmissionSelect;

  const whereIndexed = {
    status: "COMPLETED",
    sellerId: sellerUserId,
  } as Prisma.CustomOrderSubmissionWhereInput;

  const whereViaForm: Prisma.CustomOrderSubmissionWhereInput = {
    status: "COMPLETED",
    form: { sellerId: sellerUserId },
  };

  /** Two queries avoid Prisma OR + nested-relation union bugs in inferred row types; merge + dedupe. */
  const [indexedRows, formRows] = await Promise.all([
    db.customOrderSubmission.findMany({
      where: whereIndexed,
      select: submissionSelect,
    }),
    db.customOrderSubmission.findMany({
      where: whereViaForm,
      select: submissionSelect,
    }),
  ]);

  const seen = new Set<string>();
  const rows: typeof indexedRows = [];
  for (const r of [...indexedRows, ...formRows]) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    rows.push(r);
  }

  rows.sort(
    (a, b) =>
      new Date(b.completedAt ?? b.updatedAt).getTime() -
      new Date(a.completedAt ?? a.updatedAt).getTime(),
  );

  return rows.map((row) => {
    const dec = withDecryptedCustomerContact(row);
    const title = row.form.title.trim() || "Custom order";
    const total = customOrderTotalCents(row);
    const when = row.completedAt ?? row.updatedAt;
    const displayName = `${title} (Custom order)`;
    return {
      source: "custom_order" as const,
      id: row.id,
      submissionId: row.id,
      buyerEmail: dec.customerEmail ?? "",
      buyerName: dec.customerName?.trim() || null,
      productName: displayName,
      shopName: row.form.seller.shopName ?? "Shop",
      status: "COMPLETED" as const,
      paymentStatus: "PAID" as const,
      totalAmount: total,
      currency: (row.currency || "USD").trim().toUpperCase(),
      createdAt: when,
      updatedAt: row.updatedAt,
      product: { name: displayName, images: [] },
    };
  });
}

async function completedCustomOrdersForBuyer(
  buyerUserId: string,
): Promise<CustomOrderListRow[]> {
  const rows = await db.customOrderSubmission.findMany({
    where: {
      userId: buyerUserId,
      status: "COMPLETED",
    },
    select: {
      id: true,
      totalAmount: true,
      quoteDepositMinor: true,
      finalPaymentAmount: true,
      currency: true,
      completedAt: true,
      updatedAt: true,
      createdAt: true,
      customerEmail: true,
      customerName: true,
      encryptedCustomerEmail: true,
      customerEmailIV: true,
      customerEmailSalt: true,
      encryptedCustomerName: true,
      customerNameIV: true,
      customerNameSalt: true,
      form: {
        select: {
          title: true,
          seller: { select: { shopName: true } },
        },
      },
    },
    orderBy: [{ completedAt: "desc" }, { updatedAt: "desc" }],
  });

  return rows.map((row) => {
    const dec = withDecryptedCustomerContact(row);
    const title = row.form.title.trim() || "Custom order";
    const total = customOrderTotalCents(row);
    const when = row.completedAt ?? row.updatedAt;
    const displayName = `${title} (Custom order)`;
    return {
      source: "custom_order" as const,
      id: row.id,
      submissionId: row.id,
      buyerEmail: dec.customerEmail ?? "",
      buyerName: dec.customerName?.trim() || null,
      productName: displayName,
      shopName: row.form.seller.shopName ?? "Shop",
      status: "COMPLETED" as const,
      paymentStatus: "PAID" as const,
      totalAmount: total,
      currency: (row.currency || "USD").trim().toUpperCase(),
      createdAt: when,
      updatedAt: row.updatedAt,
      product: { name: displayName, images: [] },
    };
  });
}

export async function getSellerOrders(userId: string): Promise<SellerOrderListEntry[]> {
  if (!userId) {
    throw new Error("You must be logged in!");
  }
  try {
    const orders = await db.order.findMany({
      where: { sellerId: userId },
      select: {
        id: true,
        userId: true,
        sellerId: true,
        shopName: true,
        productId: true,
        productName: true,
        quantity: true,
        totalAmount: true,
        productPrice: true,
        shippingCost: true,
        stripeFee: true,
        isDigital: true,
        status: true,
        paymentStatus: true,
        stripeSessionId: true,
        stripeTransferId: true,
        encryptedBuyerEmail: true,
        buyerEmailIV: true,
        buyerEmailSalt: true,
        encryptedBuyerName: true,
        buyerNameIV: true,
        buyerNameSalt: true,
        encryptedShippingAddress: true,
        shippingAddressIV: true,
        shippingAddressSalt: true,
        discount: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
        product: {
          select: {
            name: true,
            images: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const productRows: ProductOrderRow[] = orders.map((order) => ({
      source: "product",
      ...order,
      buyerEmail: decryptData(
        order.encryptedBuyerEmail,
        order.buyerEmailIV,
        order.buyerEmailSalt,
      ),
      buyerName: decryptData(
        order.encryptedBuyerName,
        order.buyerNameIV,
        order.buyerNameSalt,
      ),
      shippingAddress:
        order.encryptedShippingAddress && order.shippingAddressSalt
          ? JSON.parse(
              decryptData(
                order.encryptedShippingAddress,
                order.shippingAddressIV,
                order.shippingAddressSalt,
              ),
            )
          : null,
    }));

    const customRows = await completedCustomOrdersForSeller(userId);

    const merged: SellerOrderListEntry[] = [...productRows, ...customRows];
    merged.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return merged;
  } catch (error) {
    console.error("Error getting seller orders:", error);
    return [];
  }
}

export async function getBuyerOrders(userId: string): Promise<BuyerPurchaseListEntry[]> {
  try {
    const orders = await db.order.findMany({
      where: { userId },
      select: {
        id: true,
        userId: true,
        sellerId: true,
        shopName: true,
        productId: true,
        productName: true,
        quantity: true,
        totalAmount: true,
        productPrice: true,
        shippingCost: true,
        stripeFee: true,
        isDigital: true,
        status: true,
        paymentStatus: true,
        stripeSessionId: true,
        stripeTransferId: true,
        encryptedBuyerEmail: true,
        buyerEmailIV: true,
        buyerEmailSalt: true,
        encryptedBuyerName: true,
        buyerNameIV: true,
        buyerNameSalt: true,
        encryptedShippingAddress: true,
        shippingAddressIV: true,
        shippingAddressSalt: true,
        discount: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
        orderInstructions: true,
        batchNumber: true,
        product: {
          select: {
            name: true,
            images: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const productRows: ProductOrderRow[] = orders.map((order) => ({
      source: "product",
      ...order,
      buyerEmail: decryptData(
        order.encryptedBuyerEmail,
        order.buyerEmailIV,
        order.buyerEmailSalt,
      ),
      buyerName: decryptData(
        order.encryptedBuyerName,
        order.buyerNameIV,
        order.buyerNameSalt,
      ),
      shippingAddress:
        order.encryptedShippingAddress && order.shippingAddressSalt
          ? JSON.parse(
              decryptData(
                order.encryptedShippingAddress,
                order.shippingAddressIV,
                order.shippingAddressSalt,
              ),
            )
          : null,
    }));

    const customRows = await completedCustomOrdersForBuyer(userId);

    const merged: BuyerPurchaseListEntry[] = [...productRows, ...customRows];
    merged.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return merged;
  } catch (error) {
    console.error("Error getting buyer orders:", error);
    return [];
  }
}
