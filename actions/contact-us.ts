"use server";

import * as z from "zod";

import { db } from "@/lib/db";

import { ContactUsSchema } from "@/schemas/ContactUsSchema";

export const contactUs = async (values: z.infer<typeof ContactUsSchema>) => {
  const validatedFields = ContactUsSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields." };
  }

  const { name, email, reason, helpDescription } = validatedFields.data;

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