"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { CustomerFeedbackSchema } from "@/schemas/CustomerFeedbackSchema";
import { verifyRecaptcha, validateHoneypot } from "@/lib/recaptcha";

export const submitCustomerFeedback = async (values: z.infer<typeof CustomerFeedbackSchema>) => {
  const validatedFields = CustomerFeedbackSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields." };
  }

  const { heardFrom, overallExperience, placedOrder, orderNumber, experience, improvements, returnLikelihood, email, website, recaptchaToken } = validatedFields.data;

  // Step 1: Validate honeypot first (server-side double-check)
  if (!validateHoneypot(website)) {
    console.log("Bot detected via honeypot field in feedback form");
    return { error: "Invalid submission." };
  }

  // Step 2: Verify reCAPTCHA token
  if (!recaptchaToken) {
    return { error: "Security verification failed. Please try again." };
  }

  const recaptchaResult = await verifyRecaptcha(recaptchaToken, 'feedback_form', 0.5);
  if (!recaptchaResult.success) {
    console.error("reCAPTCHA verification failed:", recaptchaResult.error);
    return { error: "Security verification failed. Please try again." };
  }

  await db.customerFeedback.create({
    data: {
      heardFrom,
      overallExperience,
      placedOrder,
      orderNumber,
      experience,
      improvements,
      returnLikelihood,
      email,
    },
  });

  return { success: "Thank you for your feedback!" };
}; 