"use server";

import * as z from "zod";

import { db } from "@/lib/db";
import { MemberSchema } from "@/schemas/MemberSchema";

import { auth } from "@/auth"; // Adjust to your auth method

export const memberInformation = async (values: z.infer<typeof MemberSchema>) => {
  const validatedFields = MemberSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields." };
  }

  const { firstName, lastName, userBio } = validatedFields.data;

  const session = await auth(); // Get the authenticated user session
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  await db.member.create({
    data: {
      userId: session.user.id, // Associate with the logged-in user
      firstName,
      lastName,
      userBio,
    },
  });

  return { success: "Successfully added your member information." };
};