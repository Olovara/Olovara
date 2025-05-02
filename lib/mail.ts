import { Resend } from "resend";
import { VerificationEmail } from "@/components/emails/VerificationEmail";
import { PasswordResetEmail } from "@/components/emails/PasswordResetEmail";
import { TwoFactorEmail } from "@/components/emails/TwoFactorEmail";

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

export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${domain}/new-verification?token=${token}`;

  try {
    console.log("Attempting to send verification email to:", email);
    console.log("Using domain:", domain);
    console.log("Verification link:", confirmLink);
    
    const response = await resend.emails.send({
      from: "Yarnnu <noreply@yarnnu.com>",
      to: email,
      subject: "Verify your email",
      react: VerificationEmail({ confirmLink }),
    });
    
    console.log("Verification email sent successfully:", response);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
};