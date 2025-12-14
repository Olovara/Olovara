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
  const startTime = Date.now();

  try {
    console.log("[CONTACT_RESPONSE] Starting sendContactResponse:", {
      submissionId,
      responseMessageLength: responseMessage?.length,
      timestamp: new Date().toISOString(),
    });

    currentUserData = await currentUserWithPermissions();

    if (!currentUserData) {
      console.error("[CONTACT_RESPONSE] Not authenticated");
      return { error: "Not authenticated" };
    }

    // Check if user has MANAGE_CONTENT permission
    const hasManageContent =
      currentUserData.permissions?.includes("MANAGE_CONTENT");

    if (!hasManageContent) {
      console.error("[CONTACT_RESPONSE] Insufficient permissions:", {
        userId: currentUserData.id,
        permissions: currentUserData.permissions,
      });
      return { error: "Forbidden: Insufficient permissions" };
    }

    // Validate response message
    if (!responseMessage || responseMessage.trim().length < 10) {
      return { error: "Response message must be at least 10 characters long" };
    }

    console.log("[CONTACT_RESPONSE] Fetching submission from database:", {
      submissionId,
    });

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
      console.error("[CONTACT_RESPONSE] Submission not found:", { submissionId });
      return { error: "Contact submission not found" };
    }

    // Verify we're using the customer's email, not the admin's
    if (!submission.email) {
      console.error("[CONTACT_RESPONSE] Customer email missing:", { submissionId });
      return { error: "Customer email not found in submission" };
    }

    // Store customer email in a const to ensure we use the right one
    const customerEmail = submission.email;
    const customerName = submission.name;

    console.log("[CONTACT_RESPONSE] Calling sendContactResponseEmail:", {
      customerEmail,
      customerName,
      reason: submission.reason,
      adminResponseLength: responseMessage.trim().length,
      originalMessageLength: submission.helpDescription?.length,
    });

    // Send the email response (always from support@yarnnu.com)
    // IMPORTANT: First parameter is customerEmail - the person who submitted the form
    await sendContactResponseEmail(
      customerEmail, // Customer's email (the person who submitted contact form)
      customerName, // Customer's name
      submission.helpDescription, // Original message from customer
      responseMessage.trim(), // Admin's response
      submission.reason
    );

    const duration = Date.now() - startTime;
    console.log("[CONTACT_RESPONSE] Email sent successfully:", {
      submissionId,
      customerEmail,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    return { success: "Response email sent successfully" };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log to console (always happens)
    console.error("[CONTACT_RESPONSE] Error sending response:", {
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
      submissionId,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

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
    // Wrap in try-catch to ensure we always return a response even if logging fails
    let userMessage = "An unexpected error occurred. Please try again.";
    try {
      userMessage = logError({
        code: "CONTACT_RESPONSE_SEND_FAILED",
        userId: currentUserData?.id || currentUserData?.user?.id,
        route: "actions/contact-response",
        method: "sendContactResponse",
        error,
        metadata: {
          submissionId,
          duration: `${duration}ms`,
          note: "Failed to send contact response email",
        },
      });
    } catch (logError) {
      // If logging fails, use default message
      console.error("[CONTACT_RESPONSE] Failed to log error:", logError);
    }

    // CRITICAL: Always return a response object, never undefined
    return {
      error: userMessage,
    };
  }
}
