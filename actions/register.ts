"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";

import { RegisterSchema } from "@/schemas";
import { db } from "@/lib/db";
import { getUserByEmail, getUserByUsername } from "@/data/user";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields." };
  }

  const { username, password, email } = validatedFields.data;
  const hashedPassword = await bcrypt.hash(password, 10);

  // Check for existing email
  const existingUserByEmail = await getUserByEmail(email);
  if (existingUserByEmail) {
    return { error: "Email already exists." };
  }

  // Check for existing username
  const existingUserByUsername = await getUserByUsername(username);
  if (existingUserByUsername) {
    return { error: "Username already exists." };
  }

  await db.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
    },
  });

  const verificationToken = await generateVerificationToken(email);
  await sendVerificationEmail(verificationToken.email, verificationToken.token);

  return { success: "Successfully registered. Verify your email!" };
};