"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { ContactUsSchema } from "@/schemas/ContactUsSchema";
import { verifyRecaptcha, validateHoneypot } from "@/lib/recaptcha";

export const contactUs = async (values: z.infer<typeof ContactUsSchema>) => {
  const validatedFields = ContactUsSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields." };
  }

  const { name, email, reason, helpDescription, website, recaptchaToken } = validatedFields.data;

  // Step 1: Validate honeypot first (server-side double-check)
  if (!validateHoneypot(website)) {
    console.log("Bot detected via honeypot field in contact form");
    return { error: "Invalid submission." };
  }

  // Step 2: Verify reCAPTCHA token
  if (!recaptchaToken) {
    return { error: "Security verification failed. Please try again." };
  }

  const recaptchaResult = await verifyRecaptcha(recaptchaToken, 'contact_form', 0.5);
  if (!recaptchaResult.success) {
    console.error("reCAPTCHA verification failed:", recaptchaResult.error);
    return { error: "Security verification failed. Please try again." };
  }

  await db.contactUs.create({
    data: {
      name,
      email,
      reason,
      helpDescription,
    },
  });

  return { success: "Successfully submitted your request." };
};