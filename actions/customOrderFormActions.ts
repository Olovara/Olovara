"use server";

import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import {
  CustomOrderFormSchema,
  CustomOrderSubmissionSchema,
  CustomOrderSubmissionStatusSchema,
} from "@/schemas/CustomOrderFormSchema";
import { SendCustomOrderQuoteSchema } from "@/schemas/CustomOrderQuoteSchema";
import { revalidatePath } from "next/cache";
import {
  buildEncryptedCustomerContactPayload,
  getDecryptedCustomerContact,
  withDecryptedCustomerContact,
} from "@/lib/custom-order-submission-contact";
import { majorToMinorAmount } from "@/data/units";
import { convertCurrencyAmount } from "@/lib/currency-convert";
import { formatCustomOrderFieldValue } from "@/lib/custom-order-response-display";
import {
  sendCustomOrderQuoteEmail,
  sendCustomOrderRejectionEmail,
} from "@/lib/mail";
import { CUSTOM_ORDER_MAX_REFERENCE_IMAGES } from "@/lib/custom-order-reference-config";

/** Emailed to the buyer when the server auto-rejects for budget below seller minimum. */
const AUTO_REJECT_BUDGET_BELOW_MIN_REASON =
  'Automatically declined: your budget is below this seller\'s minimum for custom orders. You may submit a new request with a higher budget or select "I\'m flexible on budget" if that applies.';

/** Only persist image URLs from our UploadThing hosts (blocks arbitrary URL injection). */
function isTrustedUploadThingImageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    const h = u.hostname.toLowerCase();
    if (h === "utfs.io" || h.endsWith(".utfs.io")) return true;
    if (h === "ufs.sh" || h.endsWith(".ufs.sh")) return true;
    if (h.includes("uploadthing")) return true;
    return false;
  } catch {
    return false;
  }
}

function sanitizeCustomOrderReferenceImageUrls(urls: string[]): string[] {
  const out: string[] = [];
  for (const url of urls) {
    if (out.length >= CUSTOM_ORDER_MAX_REFERENCE_IMAGES) break;
    if (!isTrustedUploadThingImageUrl(url)) continue;
    out.push(url);
  }
  return out;
}

// Get all custom order forms for a seller
export async function getCustomOrderForms() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const forms = await db.customOrderForm.findMany({
      where: {
        sellerId: session.user.id,
      },
      include: {
        fields: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { data: forms };
  } catch (error) {
    console.error("Error fetching custom order forms:", error);
    return { error: "Failed to fetch forms" };
  }
}

// Get a specific custom order form
export async function getCustomOrderForm(formId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const form = await db.customOrderForm.findFirst({
      where: {
        id: formId,
        sellerId: session.user.id,
      },
      include: {
        fields: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!form) {
      return { error: "Form not found" };
    }

    return { data: form };
  } catch (error) {
    console.error("Error fetching custom order form:", error);
    return { error: "Failed to fetch form" };
  }
}

// Create or update a custom order form
export async function saveCustomOrderForm(values: any) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const validatedData = CustomOrderFormSchema.parse(values);

    // Check form limits (max 5 forms per seller)
    if (!validatedData.id) {
      // Creating new form - check limit
      const existingFormsCount = await db.customOrderForm.count({
        where: { sellerId: session.user.id },
      });

      if (existingFormsCount >= 5) {
        return {
          error:
            "You can only create up to 5 custom order forms. Please delete an existing form first.",
        };
      }
    }

    const result = await db.$transaction(async (tx) => {
      if (validatedData.id) {
        // Update existing form
        const updatedForm = await tx.customOrderForm.update({
          where: {
            id: validatedData.id,
            sellerId: session.user.id,
          },
          data: {
            title: validatedData.title,
            description: validatedData.description,
            isActive: validatedData.isActive,
          },
        });

        // Get existing field IDs to track what's being removed
        const existingFields = await tx.customOrderFormField.findMany({
          where: { formId: validatedData.id },
          select: { id: true },
        });
        const existingFieldIds = existingFields.map((f) => f.id);
        const updatedFieldIds: string[] = [];

        // Update or create fields
        for (const field of validatedData.fields) {
          if (field.id) {
            // Update existing field
            await tx.customOrderFormField.update({
              where: { id: field.id },
              data: {
                label: field.label,
                type: field.type,
                required: field.required,
                placeholder: field.placeholder,
                helpText: field.helpText,
                options: field.options,
                validation: field.validation,
                order: field.order,
                isActive: field.isActive,
              },
            });
            updatedFieldIds.push(field.id);
          } else {
            // Create new field
            const newField = await tx.customOrderFormField.create({
              data: {
                formId: validatedData.id,
                label: field.label,
                type: field.type,
                required: field.required,
                placeholder: field.placeholder,
                helpText: field.helpText,
                options: field.options,
                validation: field.validation,
                order: field.order,
                isActive: field.isActive,
              },
            });
            updatedFieldIds.push(newField.id);
          }
        }

        // Remove fields that are no longer in the form
        const fieldsToRemove = existingFieldIds.filter(
          (id) => !updatedFieldIds.includes(id),
        );
        if (fieldsToRemove.length > 0) {
          await tx.customOrderFormField.deleteMany({
            where: { id: { in: fieldsToRemove } },
          });
        }

        return updatedForm;
      } else {
        // Create new form
        const newForm = await tx.customOrderForm.create({
          data: {
            sellerId: session.user.id!,
            title: validatedData.title,
            description: validatedData.description,
            isActive: validatedData.isActive,
          },
        });

        // Create fields
        for (const field of validatedData.fields) {
          await tx.customOrderFormField.create({
            data: {
              formId: newForm.id,
              label: field.label,
              type: field.type,
              required: field.required,
              placeholder: field.placeholder,
              helpText: field.helpText,
              options: field.options,
              validation: field.validation,
              order: field.order,
              isActive: field.isActive,
            },
          });
        }

        return newForm;
      }
    });

    revalidatePath("/seller/dashboard/custom-orders");
    revalidatePath("/seller/dashboard/custom-orders/submissions");
    return { success: "Form saved successfully", data: result };
  } catch (error) {
    console.error("Error saving custom order form:", error);
    return { error: "Failed to save form" };
  }
}

// Toggle whether a form accepts new public submissions (seller dashboard list)
export async function toggleCustomOrderFormActive(
  formId: string,
  isActive: boolean,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const result = await db.customOrderForm.updateMany({
      where: {
        id: formId,
        sellerId: session.user.id,
      },
      data: { isActive },
    });

    if (result.count === 0) {
      return { error: "Form not found" };
    }

    revalidatePath("/seller/dashboard/custom-orders");
    return { success: true };
  } catch (error) {
    console.error("Error toggling custom order form:", error);
    return { error: "Failed to update form" };
  }
}

// Delete a custom order form
export async function deleteCustomOrderForm(formId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    await db.customOrderForm.delete({
      where: {
        id: formId,
        sellerId: session.user.id,
      },
    });

    revalidatePath("/seller/dashboard/custom-orders");
    revalidatePath("/seller/dashboard/custom-orders/submissions");
    return { success: "Form deleted successfully" };
  } catch (error) {
    console.error("Error deleting custom order form:", error);
    return { error: "Failed to delete form" };
  }
}

// Get submissions for a form
export async function getCustomOrderSubmissions(formId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const ownedForm = await db.customOrderForm.findFirst({
      where: { id: formId, sellerId: session.user.id },
      select: { id: true },
    });
    if (!ownedForm) {
      return { error: "Form not found" };
    }

    const submissions = await db.customOrderSubmission.findMany({
      where: { formId },
      include: {
        responses: {
          include: {
            field: true,
          },
        },
        user: {
          select: {
            username: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = submissions.map((s) => withDecryptedCustomerContact(s));
    return { data };
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return { error: "Failed to fetch submissions" };
  }
}

/** One row in the submission detail panel (customer answers). */
export type CustomOrderSubmissionDetailAnswer = {
  fieldId: string;
  label: string;
  type: string;
  displayValue: string;
};

/** Full submission for seller review (form answers + contact). */
export type CustomOrderSubmissionDetail = {
  id: string;
  formId: string;
  formTitle: string;
  status: string;
  notes: string | null;
  rejectionReason: string | null;
  createdAt: string;
  customerEmail: string;
  customerName: string | null;
  buyerUsername: string | null;
  buyerEmail: string | null;
  answers: CustomOrderSubmissionDetailAnswer[];
  customerBudgetMinor: number | null;
  customerBudgetCurrency: string | null;
  budgetFlexible: boolean;
  currency: string;
  quotePriceType: string | null;
  quotePriceFixedMinor: number | null;
  quotePriceMinMinor: number | null;
  quotePriceMaxMinor: number | null;
  quoteDepositMinor: number | null;
  quoteDepositPaid: boolean;
  quoteTimeline: string | null;
  quoteNotes: string | null;
  quoteSentAt: string | null;
  referenceImageUrls: string[];
};

// Single submission with decrypted contact and ordered field responses (seller-owned only)
export async function getCustomOrderSubmissionDetail(
  submissionId: string,
): Promise<
  | { error: string; data?: undefined }
  | { data: CustomOrderSubmissionDetail; error?: undefined }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const row = await db.customOrderSubmission.findFirst({
      where: { id: submissionId },
      include: {
        form: {
          select: { id: true, title: true, sellerId: true },
        },
        responses: {
          include: {
            field: {
              select: {
                id: true,
                label: true,
                type: true,
                order: true,
              },
            },
          },
        },
        user: {
          select: { username: true, email: true },
        },
      },
    });

    if (!row || row.form.sellerId !== session.user.id) {
      return { error: "Submission not found or unauthorized" };
    }

    // Prisma payload type with `include` can lag new scalars in the IDE; fields exist at runtime.
    const rowWithBudget = row as typeof row & {
      customerBudgetMinor?: number | null;
      customerBudgetCurrency?: string | null;
      budgetFlexible?: boolean;
      quoteDepositPaid?: boolean;
      quoteDepositSessionId?: string | null;
    };

    const decrypted = withDecryptedCustomerContact(row);
    const rejectionReason =
      (decrypted as { rejectionReason?: string | null }).rejectionReason ??
      null;
    const answers: CustomOrderSubmissionDetailAnswer[] = decrypted.responses
      .slice()
      .sort((a, b) => a.field.order - b.field.order)
      .map((r) => ({
        fieldId: r.fieldId,
        label: r.field.label,
        type: r.field.type,
        displayValue: formatCustomOrderFieldValue(r.value, r.field.type),
      }));

    return {
      data: {
        id: decrypted.id,
        formId: decrypted.formId,
        formTitle: decrypted.form.title,
        status: decrypted.status,
        notes: decrypted.notes,
        rejectionReason,
        createdAt: decrypted.createdAt.toISOString(),
        customerEmail: decrypted.customerEmail,
        customerName: decrypted.customerName,
        buyerUsername: decrypted.user?.username ?? null,
        buyerEmail: decrypted.user?.email ?? null,
        answers,
        customerBudgetMinor: rowWithBudget.customerBudgetMinor ?? null,
        customerBudgetCurrency: rowWithBudget.customerBudgetCurrency ?? null,
        budgetFlexible: Boolean(rowWithBudget.budgetFlexible),
        currency: decrypted.currency || "USD",
        quotePriceType: decrypted.quotePriceType ?? null,
        quotePriceFixedMinor: decrypted.quotePriceFixedMinor ?? null,
        quotePriceMinMinor: decrypted.quotePriceMinMinor ?? null,
        quotePriceMaxMinor: decrypted.quotePriceMaxMinor ?? null,
        quoteDepositMinor: decrypted.quoteDepositMinor ?? null,
        quoteDepositPaid: Boolean(rowWithBudget.quoteDepositPaid),
        quoteTimeline: decrypted.quoteTimeline ?? null,
        quoteNotes: decrypted.quoteNotes ?? null,
        quoteSentAt: decrypted.quoteSentAt?.toISOString() ?? null,
        referenceImageUrls: Array.isArray(
          (row as { referenceImageUrls?: string[] }).referenceImageUrls,
        )
          ? (row as { referenceImageUrls: string[] }).referenceImageUrls
          : [],
      },
    };
  } catch (error) {
    console.error("Error fetching submission detail:", error);
    return { error: "Failed to load submission" };
  }
}

/** One row for the member dashboard custom-order list. */
export type MyCustomOrderSubmissionRow = {
  id: string;
  formId: string;
  formTitle: string;
  shopName: string;
  shopNameSlug: string;
  status: string;
  createdAt: string;
  quoteSentAt: string | null;
};

/** Buyer-facing detail (no seller-only fields like internal notes). */
export type BuyerCustomOrderSubmissionDetail = {
  id: string;
  formId: string;
  formTitle: string;
  shopName: string;
  shopNameSlug: string;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
  answers: CustomOrderSubmissionDetailAnswer[];
  customerBudgetMinor: number | null;
  customerBudgetCurrency: string | null;
  budgetFlexible: boolean;
  currency: string;
  quotePriceType: string | null;
  quotePriceFixedMinor: number | null;
  quotePriceMinMinor: number | null;
  quotePriceMaxMinor: number | null;
  quoteDepositMinor: number | null;
  quoteDepositPaid: boolean;
  finalPaymentAmount: number | null;
  finalPaymentPaid: boolean;
  quoteTimeline: string | null;
  quoteNotes: string | null;
  quoteSentAt: string | null;
  referenceImageUrls: string[];
};

export async function getMyCustomOrderSubmissions(): Promise<
  | { error: string; data?: undefined }
  | { data: MyCustomOrderSubmissionRow[]; error?: undefined }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const rows = await db.customOrderSubmission.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        formId: true,
        status: true,
        createdAt: true,
        quoteSentAt: true,
        form: {
          select: {
            title: true,
            seller: {
              select: { shopName: true, shopNameSlug: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const data: MyCustomOrderSubmissionRow[] = rows.map((r) => ({
      id: r.id,
      formId: r.formId,
      formTitle: r.form.title,
      shopName: r.form.seller.shopName,
      shopNameSlug: r.form.seller.shopNameSlug,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      quoteSentAt: r.quoteSentAt?.toISOString() ?? null,
    }));

    return { data };
  } catch (error) {
    console.error("getMyCustomOrderSubmissions:", error);
    return { error: "Failed to load custom orders" };
  }
}

// Decrypted answers + quote for the buyer who submitted (not seller tools)
export async function getBuyerCustomOrderSubmissionDetail(
  submissionId: string,
): Promise<
  | { error: string; data?: undefined }
  | { data: BuyerCustomOrderSubmissionDetail; error?: undefined }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const row = await db.customOrderSubmission.findFirst({
      where: { id: submissionId, userId: session.user.id },
      include: {
        form: {
          select: {
            id: true,
            title: true,
            seller: { select: { shopName: true, shopNameSlug: true } },
          },
        },
        responses: {
          include: {
            field: {
              select: {
                id: true,
                label: true,
                type: true,
                order: true,
              },
            },
          },
        },
      },
    });

    if (!row) {
      return { error: "Request not found" };
    }

    const rowWithBudget = row as typeof row & {
      customerBudgetMinor?: number | null;
      customerBudgetCurrency?: string | null;
      budgetFlexible?: boolean;
      quoteDepositPaid?: boolean;
      quoteDepositSessionId?: string | null;
    };

    const decrypted = withDecryptedCustomerContact(row);
    const rejectionReason =
      (decrypted as { rejectionReason?: string | null }).rejectionReason ??
      null;
    const answers: CustomOrderSubmissionDetailAnswer[] = decrypted.responses
      .slice()
      .sort((a, b) => a.field.order - b.field.order)
      .map((r) => ({
        fieldId: r.fieldId,
        label: r.field.label,
        type: r.field.type,
        displayValue: formatCustomOrderFieldValue(r.value, r.field.type),
      }));

    return {
      data: {
        id: decrypted.id,
        formId: decrypted.formId,
        formTitle: decrypted.form.title,
        shopName: decrypted.form.seller.shopName,
        shopNameSlug: decrypted.form.seller.shopNameSlug,
        status: decrypted.status,
        rejectionReason,
        createdAt: decrypted.createdAt.toISOString(),
        answers,
        customerBudgetMinor: rowWithBudget.customerBudgetMinor ?? null,
        customerBudgetCurrency: rowWithBudget.customerBudgetCurrency ?? null,
        budgetFlexible: Boolean(rowWithBudget.budgetFlexible),
        currency: decrypted.currency || "USD",
        quotePriceType: decrypted.quotePriceType ?? null,
        quotePriceFixedMinor: decrypted.quotePriceFixedMinor ?? null,
        quotePriceMinMinor: decrypted.quotePriceMinMinor ?? null,
        quotePriceMaxMinor: decrypted.quotePriceMaxMinor ?? null,
        quoteDepositMinor: decrypted.quoteDepositMinor ?? null,
        quoteDepositPaid: Boolean(rowWithBudget.quoteDepositPaid),
        finalPaymentAmount: row.finalPaymentAmount ?? null,
        finalPaymentPaid: Boolean(row.finalPaymentPaid),
        quoteTimeline: decrypted.quoteTimeline ?? null,
        quoteNotes: decrypted.quoteNotes ?? null,
        quoteSentAt: decrypted.quoteSentAt?.toISOString() ?? null,
        referenceImageUrls: Array.isArray(
          (row as { referenceImageUrls?: string[] }).referenceImageUrls,
        )
          ? (row as { referenceImageUrls: string[] }).referenceImageUrls
          : [],
      },
    };
  } catch (error) {
    console.error("getBuyerCustomOrderSubmissionDetail:", error);
    return { error: "Failed to load submission" };
  }
}

/** Seller sends a pre-approval quote; sets status to QUOTED and emails the buyer. */
export async function sendCustomOrderQuote(values: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const data = SendCustomOrderQuoteSchema.parse(values);

    const row = await db.customOrderSubmission.findFirst({
      where: { id: data.submissionId },
      select: {
        id: true,
        status: true,
        currency: true,
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
            sellerId: true,
            title: true,
            seller: { select: { shopName: true } },
          },
        },
      },
    });

    if (!row || row.form.sellerId !== session.user.id) {
      return { error: "Submission not found" };
    }

    const blocked = new Set([
      "APPROVED",
      "REVIEWED",
      "PENDING_SELLER_START",
      "IN_PROGRESS",
      "READY_FOR_FINAL_PAYMENT",
      "COMPLETED",
      "REJECTED",
    ]);
    if (blocked.has(row.status)) {
      return {
        error:
          "You cannot send a quote for this submission in its current state.",
      };
    }

    const cur = row.currency || "USD";
    const quotePriceFixedMinor =
      data.quotePriceType === "FIXED"
        ? majorToMinorAmount(data.quotePriceFixedMajor!, cur)
        : null;
    const quotePriceMinMinor =
      data.quotePriceType === "RANGE"
        ? majorToMinorAmount(data.quotePriceMinMajor!, cur)
        : null;
    const quotePriceMaxMinor =
      data.quotePriceType === "RANGE"
        ? majorToMinorAmount(data.quotePriceMaxMajor!, cur)
        : null;
    const quoteDepositMinor = majorToMinorAmount(data.quoteDepositMajor, cur);
    const quotedAt = new Date();

    await db.customOrderSubmission.update({
      where: { id: data.submissionId },
      data: {
        quotePriceType: data.quotePriceType,
        quotePriceFixedMinor,
        quotePriceMinMinor,
        quotePriceMaxMinor,
        quoteDepositMinor,
        quoteTimeline: data.quoteTimeline.trim(),
        quoteNotes: data.quoteNotes?.trim() || null,
        quoteSentAt: quotedAt,
        status: "QUOTED",
      },
    });

    await db.customOrderQuoteSnapshot.create({
      data: {
        submissionId: data.submissionId,
        sentAt: quotedAt,
        quotePriceType: data.quotePriceType,
        quotePriceFixedMinor,
        quotePriceMinMinor,
        quotePriceMaxMinor,
        quoteDepositMinor,
        quoteTimeline: data.quoteTimeline.trim(),
        quoteNotes: data.quoteNotes?.trim() || null,
      },
    });

    const { email, name } = getDecryptedCustomerContact(row);
    if (email?.includes("@")) {
      await sendCustomOrderQuoteEmail({
        to: email,
        buyerName: name?.trim() || "there",
        shopName: row.form.seller.shopName || "The seller",
        formTitle: row.form.title,
        currency: cur,
        quotePriceType: data.quotePriceType,
        quotePriceFixedMinor,
        quotePriceMinMinor,
        quotePriceMaxMinor,
        quoteDepositMinor,
        quoteTimeline: data.quoteTimeline.trim(),
        quoteNotes: data.quoteNotes?.trim() || null,
      });
    }

    revalidatePath("/seller/dashboard/custom-orders");
    revalidatePath("/seller/dashboard/custom-orders/submissions");
    revalidatePath("/member/dashboard/custom-orders");
    return { success: "Quote sent to the buyer" };
  } catch (error) {
    console.error("sendCustomOrderQuote:", error);
    return { error: "Failed to send quote" };
  }
}

/** After the buyer pays the deposit, status is PENDING_SELLER_START; seller confirms here → IN_PROGRESS. */
export async function sellerStartCustomOrderWork(submissionId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const id = submissionId.trim();
  if (!id) {
    return { error: "Submission ID is required" };
  }

  try {
    const row = await db.customOrderSubmission.findFirst({
      where: { id },
      select: {
        id: true,
        status: true,
        form: { select: { sellerId: true } },
      },
    });
    if (!row || row.form.sellerId !== session.user.id) {
      return { error: "Submission not found" };
    }
    if (row.status !== "PENDING_SELLER_START") {
      return {
        error:
          "You can only start work when the deposit is paid and the order is waiting for you to begin.",
      };
    }

    const startedAt = new Date();
    await db.customOrderSubmission.update({
      where: { id },
      data: { status: "IN_PROGRESS", inProgressAt: startedAt },
    });

    revalidatePath("/seller/dashboard/custom-orders");
    revalidatePath("/seller/dashboard/custom-orders/submissions");
    revalidatePath("/member/dashboard/custom-orders");
    return { success: "Order marked as in progress" };
  } catch (error) {
    console.error("sellerStartCustomOrderWork:", error);
    return { error: "Failed to update status" };
  }
}

// Update submission status (rejection requires rejectionReason — emailed to the buyer)
export async function updateSubmissionStatus(values: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const validatedData = CustomOrderSubmissionStatusSchema.parse(values);

    const existing = await db.customOrderSubmission.findFirst({
      where: { id: validatedData.submissionId },
      select: { id: true, status: true, form: { select: { sellerId: true } } },
    });
    if (!existing || existing.form.sellerId !== session.user.id) {
      return { error: "Submission not found" };
    }

    if (validatedData.status === "APPROVED") {
      if (existing.status !== "QUOTED" && existing.status !== "APPROVED") {
        return {
          error: "Send a quote to the buyer before you accept this request.",
        };
      }
    }

    const submission = await db.customOrderSubmission.update({
      where: { id: validatedData.submissionId },
      data: {
        status: validatedData.status,
        rejectionReason:
          validatedData.status === "REJECTED"
            ? validatedData.rejectionReason!.trim()
            : null,
        ...(validatedData.notes !== undefined
          ? { notes: validatedData.notes }
          : {}),
      } as Prisma.CustomOrderSubmissionUpdateInput,
    });

    if (validatedData.status === "REJECTED") {
      const forEmail = await db.customOrderSubmission.findFirst({
        where: { id: validatedData.submissionId },
        include: {
          form: {
            select: {
              title: true,
              seller: { select: { shopName: true } },
            },
          },
        },
      });
      if (forEmail) {
        const dec = withDecryptedCustomerContact(forEmail);
        await sendCustomOrderRejectionEmail({
          to: dec.customerEmail,
          buyerName: dec.customerName?.trim() || "there",
          shopName: forEmail.form.seller.shopName || "The seller",
          formTitle: forEmail.form.title,
          rejectionReason: validatedData.rejectionReason!.trim(),
        });
      }
    }

    revalidatePath("/seller/dashboard/custom-orders");
    revalidatePath("/seller/dashboard/custom-orders/submissions");
    revalidatePath("/member/dashboard/custom-orders");
    return { success: "Status updated successfully", data: submission };
  } catch (error) {
    console.error("Error updating submission status:", error);
    return { error: "Failed to update status" };
  }
}

// Public function to get a form for customers (no auth required)
export async function getPublicCustomOrderForm(sellerId: string) {
  try {
    const form = await db.customOrderForm.findFirst({
      where: {
        sellerId,
        isActive: true,
      },
      include: {
        fields: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
        seller: {
          select: {
            shopName: true,
            preferredCurrency: true,
            customOrderMinBudgetMinor: true,
          },
        },
      },
    });

    if (!form) {
      return { error: "No custom order form available" };
    }

    return { data: form };
  } catch (error) {
    console.error("Error fetching public form:", error);
    return { error: "Failed to fetch form" };
  }
}

// Submit a custom order form (requires authentication)
export async function submitCustomOrderForm(values: any) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Authentication required" };
  }

  // At this point, we know session.user.id exists
  const userId = session.user.id;

  try {
    const validatedData = CustomOrderSubmissionSchema.parse(values);

    // Form + seller (for min budget, shop name, payment currency)
    const form = await db.customOrderForm.findFirst({
      where: {
        id: validatedData.formId,
        isActive: true,
      },
      include: {
        fields: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
        seller: {
          select: {
            shopName: true,
            customOrderMinBudgetMinor: true,
            preferredCurrency: true,
          },
        },
      },
    });

    if (!form) {
      return { error: "Form not found or inactive" };
    }

    const prefCur = form.seller.preferredCurrency?.trim() || "USD";
    const buyerCur = validatedData.customerBudgetCurrency.trim().toUpperCase();
    const customerBudgetMinor = majorToMinorAmount(
      validatedData.customerBudgetMajor,
      buyerCur,
    );
    const minMinor = form.seller.customOrderMinBudgetMinor ?? null;
    const hasEffectiveMin = minMinor != null && minMinor > 0;
    let autoRejectBelowMin = false;
    if (hasEffectiveMin && !validatedData.budgetFlexible) {
      try {
        const minInBuyerMinor = await convertCurrencyAmount(
          minMinor,
          prefCur,
          buyerCur,
          true,
        );
        autoRejectBelowMin = customerBudgetMinor < minInBuyerMinor;
      } catch (e) {
        console.error("[submitCustomOrderForm] min budget currency convert:", e);
      }
    }

    // Validate that all required fields are provided
    const requiredFields = form.fields.filter((field) => field.required);
    const providedFieldIds = validatedData.responses.map((r) => r.fieldId);

    for (const requiredField of requiredFields) {
      if (!providedFieldIds.includes(requiredField.id)) {
        return { error: `Required field "${requiredField.label}" is missing` };
      }
    }

    // Validate field values based on type and custom validation rules
    for (const response of validatedData.responses) {
      const field = form.fields.find((f) => f.id === response.fieldId);
      if (!field) {
        return { error: "Invalid field ID provided" };
      }

      // Type-specific validation
      const validationError = validateFieldValue(field, response.value);
      if (validationError) {
        return { error: validationError };
      }
    }

    const referenceImageUrls = sanitizeCustomOrderReferenceImageUrls(
      validatedData.referenceImageUrls ?? [],
    );

    const contactPayload = buildEncryptedCustomerContactPayload(
      validatedData.customerEmail,
      validatedData.customerName ?? null,
    );

    const result = await db.$transaction(async (tx) => {
      const submission = await tx.customOrderSubmission.create({
        data: {
          formId: validatedData.formId,
          sellerId: form.sellerId,
          userId: userId,
          ...contactPayload,
          customerBudgetMinor,
          customerBudgetCurrency: buyerCur,
          budgetFlexible: validatedData.budgetFlexible,
          referenceImageUrls,
          currency: prefCur,
          status: autoRejectBelowMin ? "REJECTED" : "PENDING",
          rejectionReason: autoRejectBelowMin
            ? AUTO_REJECT_BUDGET_BELOW_MIN_REASON
            : null,
        } as unknown as Prisma.CustomOrderSubmissionUncheckedCreateInput,
      });

      // Create responses
      for (const response of validatedData.responses) {
        await tx.customOrderSubmissionResponse.create({
          data: {
            submissionId: submission.id,
            fieldId: response.fieldId,
            value: response.value,
          },
        });
      }

      return submission;
    });

    if (autoRejectBelowMin) {
      await sendCustomOrderRejectionEmail({
        to: validatedData.customerEmail.trim(),
        buyerName: validatedData.customerName?.trim() || "there",
        shopName: form.seller.shopName || "The seller",
        formTitle: form.title,
        rejectionReason: AUTO_REJECT_BUDGET_BELOW_MIN_REASON,
      });
    }

    revalidatePath("/seller/dashboard/custom-orders");
    revalidatePath("/seller/dashboard/custom-orders/submissions");
    revalidatePath("/member/dashboard/custom-orders");
    return {
      success: autoRejectBelowMin
        ? "Request recorded but did not meet this shop's minimum budget"
        : "Form submitted successfully",
      data: result,
      autoRejected: autoRejectBelowMin,
    };
  } catch (error) {
    console.error("Error submitting form:", error);
    return { error: "Failed to submit form" };
  }
}

// Helper function to validate field values
function validateFieldValue(field: any, value: string): string | null {
  if (!value || value.trim() === "") {
    if (field.required) {
      return `Field "${field.label}" is required`;
    }
    return null; // Empty value is OK for non-required fields
  }

  switch (field.type) {
    case "number":
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return `Field "${field.label}" must be a valid number`;
      }
      // Check custom validation rules
      if (field.validation) {
        const validation = field.validation as any;
        if (validation.min !== undefined && numValue < validation.min) {
          return `Field "${field.label}" must be at least ${validation.min}`;
        }
        if (validation.max !== undefined && numValue > validation.max) {
          return `Field "${field.label}" must be no more than ${validation.max}`;
        }
      }
      break;

    case "select":
    case "multiselect":
      if (field.options && field.options.length > 0) {
        if (field.type === "multiselect") {
          const selectedValues = value.split(",").map((v) => v.trim());
          for (const selected of selectedValues) {
            if (!field.options.includes(selected)) {
              return `Field "${field.label}" contains invalid option: ${selected}`;
            }
          }
        } else {
          if (!field.options.includes(value)) {
            return `Field "${field.label}" contains invalid option: ${value}`;
          }
        }
      }
      break;

    case "date":
      const dateValue = new Date(value);
      if (isNaN(dateValue.getTime())) {
        return `Field "${field.label}" must be a valid date`;
      }
      break;
  }

  // Check custom validation rules
  if (field.validation) {
    const validation = field.validation as any;
    if (validation.minLength && value.length < validation.minLength) {
      return `Field "${field.label}" must be at least ${validation.minLength} characters`;
    }
    if (validation.maxLength && value.length > validation.maxLength) {
      return `Field "${field.label}" must be no more than ${validation.maxLength} characters`;
    }
    if (validation.pattern) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        return `Field "${field.label}" format is invalid`;
      }
    }
  }

  return null;
}
