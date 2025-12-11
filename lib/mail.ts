import { Resend } from "resend";
import { VerificationEmail } from "@/components/emails/VerificationEmail";
import { PasswordResetEmail } from "@/components/emails/PasswordResetEmail";
import { TwoFactorEmail } from "@/components/emails/TwoFactorEmail";
import { SellerApplicationNotificationEmail } from "@/components/emails/SellerApplicationNotificationEmail";
import { SellerApplicationApprovedEmail } from "@/components/emails/SellerApplicationApprovedEmail";
import { SellerApplicationRejectedEmail } from "@/components/emails/SellerApplicationRejectedEmail";
import { ContactResponseEmail } from "@/components/emails/ContactResponseEmail";

const apiKey = process.env.RESEND_API_KEY;

const resend = new Resend(apiKey);

const domain = process.env.NEXT_PUBLIC_APP_URL;

export const sendTwoFactorTokenEmail = async (email: string, token: string) => {
  try {
    const response = await resend.emails.send({
      from: "Yarnnu <noreply@yarnnu.com>",
      to: email,
      subject: "2FA Code",
      react: TwoFactorEmail({ token }),
    });
    console.log("2FA Email sent successfully:", response);
  } catch (error) {
    console.error("Error sending 2FA email:", error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${domain}/new-password?token=${token}`;

  try {
    const response = await resend.emails.send({
      from: "Yarnnu <noreply@yarnnu.com>",
      to: email,
      subject: "Reset your password",
      react: PasswordResetEmail({ resetLink }),
    });
    console.log("Password reset email sent successfully:", response);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
};

export const sendVerificationEmail = async (email: string, token: string, customUrl?: string) => {
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
      throw new Error("Failed to send verification email: No response received");
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
    
    console.error("[Email Verification] Error sending email:", {
      error,
      email,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
    throw new Error("Failed to send verification email. Please try again later.");
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
    console.log("Seller application notification email sent successfully:", response);
    return response;
  } catch (error) {
    console.error("Error sending seller application notification email:", error);
    throw error;
  }
};

export const sendSellerApplicationApprovedEmail = async (
  sellerEmail: string,
  sellerName: string
) => {
  const dashboardUrl = `${domain}/seller/dashboard`;

  try {
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
    console.log("Seller application approved email sent successfully:", response);
    return response;
  } catch (error) {
    console.error("Error sending seller application approved email:", error);
    throw error;
  }
};

export const sendSellerApplicationRejectedEmail = async (
  sellerEmail: string,
  sellerName: string,
  rejectionReason?: string
) => {
  const applicationUrl = `${domain}/seller-application`;

  try {
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
    console.log("Seller application rejected email sent successfully:", response);
    return response;
  } catch (error) {
    console.error("Error sending seller application rejected email:", error);
    throw error;
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
      'BILLING': 'Billing',
      'GENERAL': 'General Support',
      'LISTING': 'Listing Issue',
      'ACCOUNT': 'Account Support',
      'PAYMENT': 'Payment Problem',
      'FEATURE': 'Feature Request',
      'BUG': 'Bug Report',
      'OTHER': 'Other',
    };
    const reasonLabel = reasonLabels[reason] || 'Inquiry';

    // Validate email address before sending
    if (!customerEmail || !customerEmail.includes('@')) {
      throw new Error(`Invalid customer email address: ${customerEmail}`);
    }

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
    
    
    return response;
  } catch (error) {
    console.error("[CONTACT_RESPONSE] Error sending contact response email:", {
      error,
      customerEmail,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};