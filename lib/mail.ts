import { Resend } from "resend";
import { VerificationEmail } from "@/components/emails/VerificationEmail";
import { PasswordResetEmail } from "@/components/emails/PasswordResetEmail";
import { TwoFactorEmail } from "@/components/emails/TwoFactorEmail";
import { SellerApplicationNotificationEmail } from "@/components/emails/SellerApplicationNotificationEmail";
import { SellerApplicationApprovedEmail } from "@/components/emails/SellerApplicationApprovedEmail";
import { SellerApplicationRejectedEmail } from "@/components/emails/SellerApplicationRejectedEmail";
import { SellerApplicationInformationRequestEmail } from "@/components/emails/SellerApplicationInformationRequestEmail";
import { ContactResponseEmail } from "@/components/emails/ContactResponseEmail";
import { CustomOrderRejectionEmail } from "@/components/emails/CustomOrderRejectionEmail";
import { CustomOrderQuoteEmail } from "@/components/emails/CustomOrderQuoteEmail";
import { logError } from "@/lib/error-logger";

const apiKey = process.env.RESEND_API_KEY;

const resend = new Resend(apiKey);

const domain = process.env.NEXT_PUBLIC_APP_URL;

export const sendTwoFactorTokenEmail = async (email: string, token: string) => {
  try {
    console.log("[2FA_EMAIL] Attempting to send 2FA email:", {
      email,
      timestamp: new Date().toISOString(),
    });

    const response = await resend.emails.send({
      from: "Yarnnu <noreply@yarnnu.com>",
      to: email,
      subject: "2FA Code",
      react: TwoFactorEmail({ token }),
    });

    if (!response) {
      throw new Error("Resend API returned no response");
    }

    if (response.error) {
      throw new Error(`Resend API error: ${JSON.stringify(response.error)}`);
    }

    console.log("[2FA_EMAIL] Email sent successfully:", {
      email,
      response: response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const userMessage = logError({
      code: "2FA_EMAIL_SEND_FAILED",
      userId: undefined,
      route: "lib/mail",
      method: "sendTwoFactorTokenEmail",
      error,
      metadata: {
        email,
        note: "Failed to send 2FA email",
      },
    });
    throw new Error(userMessage);
  }
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${domain}/new-password?token=${token}`;

  try {
    console.log("[PASSWORD_RESET] Attempting to send password reset email:", {
      email,
      timestamp: new Date().toISOString(),
    });

    const response = await resend.emails.send({
      from: "Yarnnu <noreply@yarnnu.com>",
      to: email,
      subject: "Reset your password",
      react: PasswordResetEmail({ resetLink }),
    });

    if (!response) {
      throw new Error("Resend API returned no response");
    }

    if (response.error) {
      throw new Error(`Resend API error: ${JSON.stringify(response.error)}`);
    }

    console.log("[PASSWORD_RESET] Email sent successfully:", {
      email,
      response: response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const userMessage = logError({
      code: "PASSWORD_RESET_EMAIL_SEND_FAILED",
      userId: undefined,
      route: "lib/mail",
      method: "sendPasswordResetEmail",
      error,
      metadata: {
        email,
        note: "Failed to send password reset email",
      },
    });
    throw new Error(userMessage);
  }
};

export const sendVerificationEmail = async (
  email: string,
  token: string,
  customUrl?: string
) => {
  const startTime = Date.now();
  const confirmLink = customUrl || `${domain}/new-verification?token=${token}`;

  try {
    console.log("[Email Verification] Starting process:", {
      email,
      timestamp: new Date().toISOString(),
      startTime,
    });

    const response = await resend.emails.send({
      from: "Yarnnu <noreply@yarnnu.com>",
      to: email,
      subject: "Verify your email",
      react: VerificationEmail({ confirmLink }),
      headers: {
        "X-Entity-Ref-ID": token,
      },
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (!response) {
      throw new Error(
        "Failed to send verification email: No response received"
      );
    }

    console.log("[Email Verification] Email sent successfully:", {
      email,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      response,
    });

    return response;
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    const userMessage = logError({
      code: "VERIFICATION_EMAIL_SEND_FAILED",
      userId: undefined,
      route: "lib/mail",
      method: "sendVerificationEmail",
      error,
      metadata: {
        email,
        duration: `${duration}ms`,
        note: "Failed to send verification email",
      },
    });
    throw new Error(userMessage);
  }
};

export const sendSellerApplicationNotificationEmail = async (
  adminEmail: string,
  adminName: string,
  applicantName: string,
  applicantEmail: string,
  applicationId: string
) => {
  const adminDashboardUrl = `${domain}/admin/dashboard/seller-applications`;

  try {
    console.log(
      "[SELLER_APP_NOTIFICATION] Attempting to send notification email:",
      {
        adminEmail,
        applicantName,
        applicantEmail,
        applicationId,
        timestamp: new Date().toISOString(),
      }
    );

    const response = await resend.emails.send({
      from: "Yarnnu <noreply@yarnnu.com>",
      to: adminEmail,
      subject: "New Seller Application Requires Review",
      react: SellerApplicationNotificationEmail({
        adminName,
        applicantName,
        applicantEmail,
        applicationId,
        adminDashboardUrl,
      }),
    });

    if (!response) {
      throw new Error("Resend API returned no response");
    }

    if (response.error) {
      throw new Error(`Resend API error: ${JSON.stringify(response.error)}`);
    }

    console.log("[SELLER_APP_NOTIFICATION] Email sent successfully:", {
      adminEmail,
      response: response,
      timestamp: new Date().toISOString(),
    });
    return response;
  } catch (error) {
    const userMessage = logError({
      code: "SELLER_APP_NOTIFICATION_EMAIL_SEND_FAILED",
      userId: undefined,
      route: "lib/mail",
      method: "sendSellerApplicationNotificationEmail",
      error,
      metadata: {
        adminEmail,
        applicantName,
        applicantEmail,
        applicationId,
        note: "Failed to send seller application notification email",
      },
    });
    throw new Error(userMessage);
  }
};

export const sendSellerApplicationApprovedEmail = async (
  sellerEmail: string,
  sellerName: string
) => {
  const dashboardUrl = `${domain}/seller/dashboard`;

  try {
    console.log("[SELLER_APP_APPROVED] Attempting to send approval email:", {
      sellerEmail,
      sellerName,
      timestamp: new Date().toISOString(),
    });

    const response = await resend.emails.send({
      from: "Yarnnu <noreply@yarnnu.com>",
      to: sellerEmail,
      subject: "🎉 Your Seller Application Has Been Approved!",
      react: SellerApplicationApprovedEmail({
        sellerName,
        sellerEmail,
        dashboardUrl,
      }),
    });

    if (!response) {
      throw new Error("Resend API returned no response");
    }

    if (response.error) {
      throw new Error(`Resend API error: ${JSON.stringify(response.error)}`);
    }

    console.log("[SELLER_APP_APPROVED] Email sent successfully:", {
      sellerEmail,
      response: response,
      timestamp: new Date().toISOString(),
    });
    return response;
  } catch (error) {
    const userMessage = logError({
      code: "SELLER_APP_APPROVED_EMAIL_SEND_FAILED",
      userId: undefined,
      route: "lib/mail",
      method: "sendSellerApplicationApprovedEmail",
      error,
      metadata: {
        sellerEmail,
        sellerName,
        note: "Failed to send seller application approved email",
      },
    });
    throw new Error(userMessage);
  }
};

export const sendSellerApplicationRejectedEmail = async (
  sellerEmail: string,
  sellerName: string,
  rejectionReason?: string
) => {
  const applicationUrl = `${domain}/seller-application`;

  try {
    console.log("[SELLER_APP_REJECTED] Attempting to send rejection email:", {
      sellerEmail,
      sellerName,
      hasRejectionReason: !!rejectionReason,
      timestamp: new Date().toISOString(),
    });

    const response = await resend.emails.send({
      from: "Yarnnu <noreply@yarnnu.com>",
      to: sellerEmail,
      subject: "Update on Your Seller Application",
      react: SellerApplicationRejectedEmail({
        sellerName,
        sellerEmail,
        applicationUrl,
        rejectionReason,
      }),
    });

    if (!response) {
      throw new Error("Resend API returned no response");
    }

    if (response.error) {
      throw new Error(`Resend API error: ${JSON.stringify(response.error)}`);
    }

    console.log("[SELLER_APP_REJECTED] Email sent successfully:", {
      sellerEmail,
      response: response,
      timestamp: new Date().toISOString(),
    });
    return response;
  } catch (error) {
    const userMessage = logError({
      code: "SELLER_APP_REJECTED_EMAIL_SEND_FAILED",
      userId: undefined,
      route: "lib/mail",
      method: "sendSellerApplicationRejectedEmail",
      error,
      metadata: {
        sellerEmail,
        sellerName,
        hasRejectionReason: !!rejectionReason,
        note: "Failed to send seller application rejected email",
      },
    });
    throw new Error(userMessage);
  }
};

// Send email to seller requesting additional information about their application
// Always sends from support@yarnnu.com
export const sendSellerApplicationInformationRequestEmail = async (
  sellerEmail: string,
  sellerName: string,
  requestMessage: string
) => {
  const applicationUrl = `${domain}/seller-application`;

  try {
    console.log(
      "[SELLER_APP_INFO_REQUEST] Attempting to send information request email:",
      {
        sellerEmail,
        sellerName,
        requestMessageLength: requestMessage.length,
        timestamp: new Date().toISOString(),
      }
    );

    // Validate email address before sending
    if (!sellerEmail || !sellerEmail.includes("@")) {
      throw new Error(`Invalid seller email address: ${sellerEmail}`);
    }

    // Validate request message isn't too long
    if (requestMessage.length > 50000) {
      throw new Error(
        "Request message is too long. Please keep it under 50,000 characters."
      );
    }

    const response = await resend.emails.send({
      from: "Yarnnu Support <support@yarnnu.com>", // Always from support@yarnnu.com
      to: sellerEmail,
      subject: "Additional Information Needed for Your Seller Application",
      react: SellerApplicationInformationRequestEmail({
        sellerName,
        sellerEmail,
        applicationUrl,
        requestMessage,
      }),
      replyTo: "support@yarnnu.com", // Allow replies to go to support email
    });

    if (!response) {
      throw new Error("Resend API returned no response");
    }

    if (response.error) {
      throw new Error(`Resend API error: ${JSON.stringify(response.error)}`);
    }

    console.log("[SELLER_APP_INFO_REQUEST] Email sent successfully:", {
      sellerEmail,
      response: response,
      timestamp: new Date().toISOString(),
    });
    return response;
  } catch (error) {
    const userMessage = logError({
      code: "SELLER_APP_INFO_REQUEST_EMAIL_SEND_FAILED",
      userId: undefined,
      route: "lib/mail",
      method: "sendSellerApplicationInformationRequestEmail",
      error,
      metadata: {
        sellerEmail,
        sellerName,
        requestMessageLength: requestMessage?.length,
        note: "Failed to send seller application information request email",
      },
    });
    throw new Error(userMessage);
  }
};

// Send response email to customer who submitted contact form
// Always sends from support@yarnnu.com regardless of which admin sends it
export const sendContactResponseEmail = async (
  customerEmail: string,
  customerName: string,
  originalMessage: string,
  adminResponse: string,
  reason: string
) => {
  try {
    // Get reason label for subject line
    const reasonLabels: { [key: string]: string } = {
      BILLING: "Billing",
      GENERAL: "General Support",
      LISTING: "Listing Issue",
      ACCOUNT: "Account Support",
      PAYMENT: "Payment Problem",
      FEATURE: "Feature Request",
      BUG: "Bug Report",
      OTHER: "Other",
    };
    const reasonLabel = reasonLabels[reason] || "Inquiry";

    // Validate email address before sending
    if (!customerEmail || !customerEmail.includes("@")) {
      throw new Error(`Invalid customer email address: ${customerEmail}`);
    }

    // Validate inputs aren't too long (Resend has limits)
    if (adminResponse.length > 50000) {
      throw new Error(
        "Response message is too long. Please keep it under 50,000 characters."
      );
    }

    if (originalMessage.length > 50000) {
      throw new Error("Original message is too long.");
    }

    console.log("[CONTACT_RESPONSE] Attempting to send email:", {
      customerEmail,
      customerName,
      reasonLabel,
      adminResponseLength: adminResponse.length,
      originalMessageLength: originalMessage.length,
      timestamp: new Date().toISOString(),
    });

    const response = await resend.emails.send({
      from: "Yarnnu Support <support@yarnnu.com>", // Always from support@yarnnu.com
      to: customerEmail, // Sending TO the customer who submitted the form - VERIFY THIS IS CORRECT
      subject: `Your ${reasonLabel} Inquiry`,
      react: ContactResponseEmail({
        customerName,
        originalMessage,
        adminResponse,
        reason: reasonLabel,
      }),
      replyTo: "support@yarnnu.com", // Allow replies to go to support email
    });

    if (!response) {
      throw new Error("Resend API returned no response");
    }

    if (response.error) {
      throw new Error(`Resend API error: ${JSON.stringify(response.error)}`);
    }

    // Safely access response ID - Resend response may have id in data property or directly
    const responseId =
      (response as any)?.data?.id || (response as any)?.id || "unknown";

    console.log("[CONTACT_RESPONSE] Email sent successfully:", {
      customerEmail,
      responseId: responseId,
      response: response,
      timestamp: new Date().toISOString(),
    });

    return response;
  } catch (error) {
    const userMessage = logError({
      code: "CONTACT_RESPONSE_EMAIL_SEND_FAILED",
      userId: undefined,
      route: "lib/mail",
      method: "sendContactResponseEmail",
      error,
      metadata: {
        customerEmail,
        customerName,
        reason,
        adminResponseLength: adminResponse?.length,
        originalMessageLength: originalMessage?.length,
        note: "Failed to send contact response email",
      },
    });
    throw new Error(userMessage);
  }
};

/** Email the buyer when a seller rejects a custom order (non-throwing — logs on failure). */
export const sendCustomOrderRejectionEmail = async (params: {
  to: string;
  buyerName: string;
  shopName: string;
  formTitle: string;
  rejectionReason: string;
}) => {
  const { to, buyerName, shopName, formTitle, rejectionReason } = params;
  if (!apiKey) {
    console.warn("[CUSTOM_ORDER_REJECTION_EMAIL] RESEND_API_KEY missing, skip send");
    return;
  }
  if (!to?.includes("@")) {
    console.warn("[CUSTOM_ORDER_REJECTION_EMAIL] Invalid recipient:", to);
    return;
  }
  try {
    const response = await resend.emails.send({
      from: "Yarnnu <noreply@yarnnu.com>",
      to,
      subject: `Update on your custom order request — ${shopName}`,
      react: CustomOrderRejectionEmail({
        buyerName,
        shopName,
        formTitle,
        rejectionReason,
      }),
    });
    if (response?.error) {
      throw new Error(JSON.stringify(response.error));
    }
  } catch (error) {
    logError({
      code: "CUSTOM_ORDER_REJECTION_EMAIL_FAILED",
      userId: undefined,
      route: "lib/mail",
      method: "sendCustomOrderRejectionEmail",
      error,
      metadata: { to, shopName, note: "Rejection saved; email failed" },
    });
  }
};

/** Email the buyer when a seller sends a pre-approval quote (non-throwing — logs on failure). */
export const sendCustomOrderQuoteEmail = async (params: {
  to: string;
  buyerName: string;
  shopName: string;
  formTitle: string;
  currency: string;
  quotePriceType: "FIXED" | "RANGE";
  quotePriceFixedMinor: number | null;
  quotePriceMinMinor: number | null;
  quotePriceMaxMinor: number | null;
  quoteDepositMinor: number;
  quoteTimeline: string;
  quoteNotes: string | null;
}) => {
  const {
    to,
    buyerName,
    shopName,
    formTitle,
    currency,
    quotePriceType,
    quotePriceFixedMinor,
    quotePriceMinMinor,
    quotePriceMaxMinor,
    quoteDepositMinor,
    quoteTimeline,
    quoteNotes,
  } = params;
  if (!apiKey) {
    console.warn("[CUSTOM_ORDER_QUOTE_EMAIL] RESEND_API_KEY missing, skip send");
    return;
  }
  if (!to?.includes("@")) {
    console.warn("[CUSTOM_ORDER_QUOTE_EMAIL] Invalid recipient:", to);
    return;
  }
  try {
    const response = await resend.emails.send({
      from: "Yarnnu <noreply@yarnnu.com>",
      to,
      subject: `Quote for your custom order — ${shopName}`,
      react: CustomOrderQuoteEmail({
        buyerName,
        shopName,
        formTitle,
        currency,
        quotePriceType,
        quotePriceFixedMinor,
        quotePriceMinMinor,
        quotePriceMaxMinor,
        quoteDepositMinor,
        quoteTimeline,
        quoteNotes,
      }),
    });
    if (response?.error) {
      throw new Error(JSON.stringify(response.error));
    }
  } catch (error) {
    logError({
      code: "CUSTOM_ORDER_QUOTE_EMAIL_FAILED",
      userId: undefined,
      route: "lib/mail",
      method: "sendCustomOrderQuoteEmail",
      error,
      metadata: { to, shopName, note: "Quote saved; email failed" },
    });
  }
};
