"use server";

import * as z from "zod";

import { db } from "@/lib/db";

import { ContactUsSchema } from "@/schemas/ContactUsSchema";

export const contactUs = async (values: z.infer<typeof ContactUsSchema>) => {
  const validatedFields = ContactUsSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields." };
  }

  const { name, email, reason, helpDescription, recaptchaToken } = validatedFields.data;

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