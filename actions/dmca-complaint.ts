"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { DMCASchema } from "@/schemas/DMCASchema";
import { verifyRecaptcha, validateHoneypot } from "@/lib/recaptcha";

export const submitDMCAComplaint = async (values: z.infer<typeof DMCASchema>) => {
  const validatedFields = DMCASchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields." };
  }

  const {
    name,
    email,
    phoneNumber,
    productLink,
    infringingStatement,
    legalAgreement,
    copyrightDocumentUrl,
    website,
    recaptchaToken
  } = validatedFields.data;

  // Step 1: Validate honeypot first (server-side double-check)
  if (!validateHoneypot(website)) {
    console.log("Bot detected via honeypot field in DMCA form");
    return { error: "Invalid submission." };
  }

  // Step 2: Verify reCAPTCHA token
  if (!recaptchaToken) {
    return { error: "Security verification failed. Please try again." };
  }

  const recaptchaResult = await verifyRecaptcha(recaptchaToken, 'dmca_form', 0.5);
  if (!recaptchaResult.success) {
    console.error("reCAPTCHA verification failed:", recaptchaResult.error);
    return { error: "Security verification failed. Please try again." };
  }

  try {
    // Create DMCA complaint in database
    await db.dMCAComplaint.create({
      data: {
        name,
        email,
        phoneNumber,
        productLink,
        infringingStatement,
        legalAgreement,
        copyrightDocumentUrl,
      },
    });

    return { success: "Your DMCA complaint has been submitted successfully. We will review it and take appropriate action within 24-48 hours." };
  } catch (error) {
    console.error("Error submitting DMCA complaint:", error);
    return { error: "Failed to submit complaint. Please try again." };
  }
};
