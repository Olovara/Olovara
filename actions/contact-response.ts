"use server";

import { sendContactResponseEmail } from "@/lib/mail";
import { db } from "@/lib/db";
import { currentUserWithPermissions } from "@/lib/auth";
import { logError } from "@/lib/error-logger";

// Send email response to a contact submission
// Always sends from support@yarnnu.com regardless of which admin sends it
export async function sendContactResponse(
  submissionId: string,
  responseMessage: string
) {
  // Declare variables outside try block so they're accessible in catch
  let currentUserData: any = null;

  try {
    currentUserData = await currentUserWithPermissions();

    if (!currentUserData) {
      return { error: "Not authenticated" };
    }

    // Check if user has MANAGE_CONTENT permission
    const hasManageContent =
      currentUserData.permissions?.includes("MANAGE_CONTENT");

    if (!hasManageContent) {
      return { error: "Forbidden: Insufficient permissions" };
    }

    // Validate response message
    if (!responseMessage || responseMessage.trim().length < 10) {
      return { error: "Response message must be at least 10 characters long" };
    }

    // Get the contact submission
    const submission = await db.contactUs.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        email: true,
        name: true,
        helpDescription: true,
        reason: true,
      },
    });

    if (!submission) {
      return { error: "Contact submission not found" };
    }

    // Verify we're using the customer's email, not the admin's
    if (!submission.email) {
      return { error: "Customer email not found in submission" };
    }

    // Store customer email in a const to ensure we use the right one
    const customerEmail = submission.email;
    const customerName = submission.name;

    // Send the email response (always from support@yarnnu.com)
    // IMPORTANT: First parameter is customerEmail - the person who submitted the form
    await sendContactResponseEmail(
      customerEmail, // Customer's email (the person who submitted contact form)
      customerName, // Customer's name
      submission.helpDescription, // Original message from customer
      responseMessage.trim(), // Admin's response
      submission.reason
    );

    return { success: "Response email sent successfully" };
  } catch (error) {
    // Log to console (always happens)
    console.error("[CONTACT_RESPONSE] Error sending response:", error);

    // Don't log authentication/permission errors - they're expected
    if (
      error instanceof Error &&
      (error.message.includes("Not authenticated") ||
        error.message.includes("Forbidden") ||
        error.message.includes("Insufficient permissions"))
    ) {
      return {
        error: error.message,
      };
    }

    // Log to database - admin could email about "couldn't send contact response"
    const userMessage = logError({
      code: "CONTACT_RESPONSE_SEND_FAILED",
      userId: currentUserData?.user?.id,
      route: "actions/contact-response",
      method: "sendContactResponse",
      error,
      metadata: {
        submissionId,
        note: "Failed to send contact response email",
      },
    });

    return {
      error: userMessage,
    };
  }
}
