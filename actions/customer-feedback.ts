"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { CustomerFeedbackSchema } from "@/schemas/CustomerFeedbackSchema";

export const submitCustomerFeedback = async (values: z.infer<typeof CustomerFeedbackSchema>) => {
  const validatedFields = CustomerFeedbackSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields." };
  }

  const { heardFrom, overallExperience, placedOrder, orderNumber, experience, improvements, returnLikelihood, email, recaptchaToken } = validatedFields.data;

  // Verify reCAPTCHA token
  if (recaptchaToken) {
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
      {
        method: "POST",
      }
    );

    const data = await response.json();

    if (!data.success || data.score < 0.5) {
      return { error: "reCAPTCHA verification failed." };
    }
  } else {
    return { error: "reCAPTCHA token missing." };
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