"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import * as z from "zod";

// Schema for setting payment amounts
const SetPaymentAmountsSchema = z.object({
  submissionId: z.string().min(1, "Submission ID is required"),
  materialsDepositAmount: z.number().min(1, "Materials deposit must be at least $0.01"),
  finalPaymentAmount: z.number().min(1, "Final payment must be at least $0.01"),
  totalAmount: z.number().min(1, "Total amount must be at least $0.01"),
  currency: z.string().default("USD"),
  shippingCost: z.number().min(0, "Shipping cost cannot be negative").optional(),
});

// Schema for marking order ready for final payment
const MarkReadyForFinalPaymentSchema = z.object({
  submissionId: z.string().min(1, "Submission ID is required"),
  notes: z.string().max(1000, "Notes must be less than 1000 characters").optional(),
});

// Set payment amounts for a custom order submission
export async function setPaymentAmounts(values: z.infer<typeof SetPaymentAmountsSchema>) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const validatedData = SetPaymentAmountsSchema.parse(values);

    // Verify the submission belongs to this seller
    const submission = await db.customOrderSubmission.findFirst({
      where: {
        id: validatedData.submissionId,
        form: {
          sellerId: session.user.id,
        },
      },
      select: {
        id: true,
        status: true,
        materialsDepositPaid: true,
        finalPaymentPaid: true,
      },
    });

    if (!submission) {
      return { error: "Submission not found or unauthorized" };
    }

    // Validate that materials deposit hasn't been paid yet
    if (submission.materialsDepositPaid) {
      return { error: "Cannot modify payment amounts after materials deposit has been paid" };
    }

    // Validate that total equals materials + final payment
    const calculatedTotal = validatedData.materialsDepositAmount + validatedData.finalPaymentAmount;
    if (Math.abs(calculatedTotal - validatedData.totalAmount) > 0.01) {
      return { error: "Total amount must equal materials deposit plus final payment" };
    }

    // Update submission with payment amounts
    await db.customOrderSubmission.update({
      where: { id: validatedData.submissionId },
      data: {
        materialsDepositAmount: Math.round(validatedData.materialsDepositAmount * 100), // Convert to cents
        finalPaymentAmount: Math.round(validatedData.finalPaymentAmount * 100), // Convert to cents
        totalAmount: Math.round(validatedData.totalAmount * 100), // Convert to cents
        currency: validatedData.currency,
        shippingCost: validatedData.shippingCost ? Math.round(validatedData.shippingCost * 100) : null,
        status: "REVIEWED", // Move to reviewed status after setting amounts
      },
    });

    revalidatePath("/seller/dashboard/custom-orders");
    return { success: "Payment amounts set successfully" };
  } catch (error) {
    console.error("Error setting payment amounts:", error);
    return { error: "Failed to set payment amounts" };
  }
}

// Mark order as ready for final payment
export async function markReadyForFinalPayment(values: z.infer<typeof MarkReadyForFinalPaymentSchema>) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const validatedData = MarkReadyForFinalPaymentSchema.parse(values);

    // Verify the submission belongs to this seller
    const submission = await db.customOrderSubmission.findFirst({
      where: {
        id: validatedData.submissionId,
        form: {
          sellerId: session.user.id,
        },
      },
      select: {
        id: true,
        status: true,
        materialsDepositPaid: true,
        finalPaymentPaid: true,
        finalPaymentAmount: true,
      },
    });

    if (!submission) {
      return { error: "Submission not found or unauthorized" };
    }

    // Validate that materials deposit has been paid
    if (!submission.materialsDepositPaid) {
      return { error: "Materials deposit must be paid before marking ready for final payment" };
    }

    // Validate that final payment hasn't been paid yet
    if (submission.finalPaymentPaid) {
      return { error: "Final payment has already been paid" };
    }

    // Validate that final payment amount is set
    if (!submission.finalPaymentAmount) {
      return { error: "Final payment amount must be set before marking ready for final payment" };
    }

    // Update submission status
    await db.customOrderSubmission.update({
      where: { id: validatedData.submissionId },
      data: {
        status: "READY_FOR_FINAL_PAYMENT",
        notes: validatedData.notes,
      },
    });

    revalidatePath("/seller/dashboard/custom-orders");
    return { success: "Order marked as ready for final payment" };
  } catch (error) {
    console.error("Error marking ready for final payment:", error);
    return { error: "Failed to mark order as ready for final payment" };
  }
}

// Get payment details for a submission
export async function getSubmissionPaymentDetails(submissionId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const submission = await db.customOrderSubmission.findFirst({
      where: {
        id: submissionId,
        form: {
          sellerId: session.user.id,
        },
      },
      select: {
        id: true,
        status: true,
        materialsDepositAmount: true,
        finalPaymentAmount: true,
        totalAmount: true,
        currency: true,
        materialsDepositPaid: true,
        finalPaymentPaid: true,
        shippingCost: true,
        materialsDepositSessionId: true,
        finalPaymentSessionId: true,
        customerEmail: true,
        customerName: true,
        createdAt: true,
        updatedAt: true,
        form: {
          select: {
            title: true,
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

    if (!submission) {
      return { error: "Submission not found or unauthorized" };
    }

    return { data: submission };
  } catch (error) {
    console.error("Error fetching payment details:", error);
    return { error: "Failed to fetch payment details" };
  }
}

// Get all submissions with payment status for a seller
export async function getSubmissionsWithPaymentStatus() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const submissions = await db.customOrderSubmission.findMany({
      where: {
        form: {
          sellerId: session.user.id,
        },
      },
      select: {
        id: true,
        status: true,
        materialsDepositAmount: true,
        finalPaymentAmount: true,
        totalAmount: true,
        currency: true,
        materialsDepositPaid: true,
        finalPaymentPaid: true,
        customerEmail: true,
        customerName: true,
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

    return { data: submissions };
  } catch (error) {
    console.error("Error fetching submissions with payment status:", error);
    return { error: "Failed to fetch submissions" };
  }
} 