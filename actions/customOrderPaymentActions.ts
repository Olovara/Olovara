"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import * as z from "zod";
import { withDecryptedCustomerContact } from "@/lib/custom-order-submission-contact";

// Schema for setting payment amounts
const SetPaymentAmountsSchema = z.object({
  submissionId: z.string().min(1, "Submission ID is required"),
  quoteDepositAmount: z.number().min(1, "Deposit must be at least $0.01"),
  finalPaymentAmount: z.number().min(1, "Final payment must be at least $0.01"),
  totalAmount: z.number().min(1, "Total amount must be at least $0.01"),
  currency: z.string().default("USD"),
  shippingCost: z
    .number()
    .min(0, "Shipping cost cannot be negative")
    .optional(),
});

// Schema for marking order ready for final payment
const MarkReadyForFinalPaymentSchema = z.object({
  submissionId: z.string().min(1, "Submission ID is required"),
  notes: z
    .string()
    .max(1000, "Notes must be less than 1000 characters")
    .optional(),
});

// Schema for seller requesting final payment after work is started
const RequestFinalPaymentSchema = z.object({
  submissionId: z.string().min(1, "Submission ID is required"),
  finalPaymentAmount: z.number().min(0.01, "Final payment must be at least $0.01"),
  notes: z
    .string()
    .max(1000, "Notes must be less than 1000 characters")
    .optional(),
});

// Set payment amounts for a custom order submission
export async function setPaymentAmounts(
  values: z.infer<typeof SetPaymentAmountsSchema>,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const validatedData = SetPaymentAmountsSchema.parse(values);

    const existing = await db.customOrderSubmission.findFirst({
      where: { id: validatedData.submissionId },
      select: {
        id: true,
        status: true,
        quoteDepositPaid: true,
        finalPaymentPaid: true,
        form: { select: { sellerId: true } },
      },
    });
    if (!existing || existing.form.sellerId !== session.user.id) {
      return { error: "Submission not found or unauthorized" };
    }

    if (existing.quoteDepositPaid) {
      return {
        error: "Cannot modify payment amounts after deposit has been paid",
      };
    }

    // Validate that total equals deposit + final payment
    const calculatedTotal =
      validatedData.quoteDepositAmount + validatedData.finalPaymentAmount;
    if (Math.abs(calculatedTotal - validatedData.totalAmount) > 0.01) {
      return {
        error: "Total amount must equal deposit plus final payment",
      };
    }

    // Update submission with payment amounts
    await db.customOrderSubmission.update({
      where: { id: validatedData.submissionId },
      data: {
        quoteDepositMinor: Math.round(validatedData.quoteDepositAmount * 100), // Convert to cents
        finalPaymentAmount: Math.round(validatedData.finalPaymentAmount * 100), // Convert to cents
        totalAmount: Math.round(validatedData.totalAmount * 100), // Convert to cents
        currency: validatedData.currency,
        shippingCost: validatedData.shippingCost
          ? Math.round(validatedData.shippingCost * 100)
          : null,
        status: "REVIEWED", // Move to reviewed status after setting amounts
      },
    });

    revalidatePath("/seller/dashboard/custom-orders");
    revalidatePath("/seller/dashboard/custom-orders/submissions");
    return { success: "Payment amounts set successfully" };
  } catch (error) {
    console.error("Error setting payment amounts:", error);
    return { error: "Failed to set payment amounts" };
  }
}

// Mark order as ready for final payment
export async function markReadyForFinalPayment(
  values: z.infer<typeof MarkReadyForFinalPaymentSchema>,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const validatedData = MarkReadyForFinalPaymentSchema.parse(values);

    const existingMark = await db.customOrderSubmission.findFirst({
      where: { id: validatedData.submissionId },
      select: {
        id: true,
        status: true,
        quoteDepositPaid: true,
        finalPaymentPaid: true,
        finalPaymentAmount: true,
        form: { select: { sellerId: true } },
      },
    });
    if (!existingMark || existingMark.form.sellerId !== session.user.id) {
      return { error: "Submission not found or unauthorized" };
    }

    if (!existingMark.quoteDepositPaid) {
      return {
        error: "Deposit must be paid before marking ready for final payment",
      };
    }

    // Validate that final payment hasn't been paid yet
    if (existingMark.finalPaymentPaid) {
      return { error: "Final payment has already been paid" };
    }

    if (!existingMark.finalPaymentAmount) {
      return {
        error:
          "Final payment amount must be set before marking ready for final payment",
      };
    }

    if (existingMark.status !== "IN_PROGRESS") {
      return {
        error:
          "Confirm that you have started work on this order before requesting the final payment.",
      };
    }

    const now = new Date();
    // Update submission status
    await db.customOrderSubmission.update({
      where: { id: validatedData.submissionId },
      data: {
        status: "READY_FOR_FINAL_PAYMENT",
        notes: validatedData.notes,
        finalPaymentRequestedAt: now,
      },
    });

    revalidatePath("/seller/dashboard/custom-orders");
    revalidatePath("/seller/dashboard/custom-orders/submissions");
    return { success: "Order marked as ready for final payment" };
  } catch (error) {
    console.error("Error marking ready for final payment:", error);
    return { error: "Failed to mark order as ready for final payment" };
  }
}

/**
 * Seller sets/updates the final payment amount and marks the submission READY_FOR_FINAL_PAYMENT.
 * This is used at the "finish project / request final payment" step.
 */
export async function requestFinalPayment(
  values: z.infer<typeof RequestFinalPaymentSchema>,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const validatedData = RequestFinalPaymentSchema.parse(values);

    const existing = await db.customOrderSubmission.findFirst({
      where: { id: validatedData.submissionId },
      select: {
        id: true,
        status: true,
        quoteDepositPaid: true,
        quoteDepositMinor: true,
        finalPaymentPaid: true,
        currency: true,
        form: { select: { sellerId: true } },
      },
    });
    if (!existing || existing.form.sellerId !== session.user.id) {
      return { error: "Submission not found or unauthorized" };
    }

    if (!existing.quoteDepositPaid) {
      return { error: "Deposit must be paid before requesting final payment" };
    }

    if (existing.status !== "IN_PROGRESS") {
      return {
        error:
          "You can only request the final payment after you have started work (in progress).",
      };
    }

    if (existing.finalPaymentPaid) {
      return { error: "Final payment has already been paid" };
    }

    if (existing.quoteDepositMinor == null) {
      return { error: "Deposit amount is missing for this submission" };
    }

    const finalMinor = Math.round(validatedData.finalPaymentAmount * 100);
    const totalMinor = existing.quoteDepositMinor + finalMinor;
    const now = new Date();

    await db.customOrderSubmission.update({
      where: { id: validatedData.submissionId },
      data: {
        finalPaymentAmount: finalMinor,
        totalAmount: totalMinor,
        status: "READY_FOR_FINAL_PAYMENT",
        notes: validatedData.notes,
        finalPaymentRequestedAt: now,
      },
    });

    revalidatePath("/seller/dashboard/custom-orders");
    revalidatePath("/seller/dashboard/custom-orders/submissions");
    revalidatePath("/member/dashboard/custom-orders");
    return { success: "Final payment requested" };
  } catch (error) {
    console.error("requestFinalPayment:", error);
    return { error: "Failed to request final payment" };
  }
}

// Get payment details for a submission
export async function getSubmissionPaymentDetails(submissionId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const row = await db.customOrderSubmission.findFirst({
      where: { id: submissionId },
      select: {
        id: true,
        status: true,
        quoteDepositMinor: true,
        finalPaymentAmount: true,
        totalAmount: true,
        currency: true,
        quoteDepositPaid: true,
        finalPaymentPaid: true,
        shippingCost: true,
        quoteDepositSessionId: true,
        finalPaymentSessionId: true,
        customerEmail: true,
        customerName: true,
        encryptedCustomerEmail: true,
        customerEmailIV: true,
        customerEmailSalt: true,
        encryptedCustomerName: true,
        customerNameIV: true,
        customerNameSalt: true,
        createdAt: true,
        updatedAt: true,
        form: {
          select: {
            title: true,
            sellerId: true,
          },
        },
        payments: {
          select: {
            id: true,
            paymentType: true,
            amount: true,
            currency: true,
            status: true,
            platformFee: true,
            sellerAmount: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!row || row.form.sellerId !== session.user.id) {
      return { error: "Submission not found or unauthorized" };
    }

    const { form, ...rest } = row;
    const data = withDecryptedCustomerContact(rest);
    return {
      data: {
        ...data,
        form: { title: form.title },
      },
    };
  } catch (error) {
    console.error("Error fetching payment details:", error);
    return { error: "Failed to fetch payment details" };
  }
}

// Get all submissions with payment status for a seller (optional filter by form)
export async function getSubmissionsWithPaymentStatus(options?: {
  formId?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const forms = await db.customOrderForm.findMany({
      where: { sellerId: session.user.id },
      select: { id: true },
    });
    const formIds = forms.map((f) => f.id);
    if (formIds.length === 0) {
      return { data: [] };
    }

    const filterFormId = options?.formId?.trim();
    const targetFormIds =
      filterFormId && formIds.includes(filterFormId)
        ? [filterFormId]
        : filterFormId && !formIds.includes(filterFormId)
          ? []
          : formIds;

    if (targetFormIds.length === 0) {
      return { data: [] };
    }

    const submissions = await db.customOrderSubmission.findMany({
      where: { formId: { in: targetFormIds } },
      select: {
        id: true,
        formId: true,
        userId: true,
        status: true,
        quoteDepositMinor: true,
        finalPaymentAmount: true,
        totalAmount: true,
        currency: true,
        quoteDepositPaid: true,
        finalPaymentPaid: true,
        customerEmail: true,
        customerName: true,
        encryptedCustomerEmail: true,
        customerEmailIV: true,
        customerEmailSalt: true,
        encryptedCustomerName: true,
        customerNameIV: true,
        customerNameSalt: true,
        createdAt: true,
        updatedAt: true,
        form: {
          select: {
            title: true,
          },
        },
        _count: {
          select: {
            payments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = submissions.map((s) => withDecryptedCustomerContact(s));
    return { data };
  } catch (error) {
    console.error("Error fetching submissions with payment status:", error);
    return { error: "Failed to fetch submissions" };
  }
}
