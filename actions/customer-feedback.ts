"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { CustomerFeedbackSchema } from "@/schemas/CustomerFeedbackSchema";
import { verifyRecaptcha } from "@/lib/recaptcha";

export const submitCustomerFeedback = async (values: z.infer<typeof CustomerFeedbackSchema>) => {
  const validatedFields = CustomerFeedbackSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields." };
  }

  const { heardFrom, overallExperience, placedOrder, orderNumber, experience, improvements, returnLikelihood, email, recaptchaToken } = validatedFields.data;

  // Verify reCAPTCHA token
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