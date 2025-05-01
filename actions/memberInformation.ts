"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { MemberSchema } from "@/schemas/MemberSchema";

export const memberInformation = async (values: z.infer<typeof MemberSchema>) => {
  try {
    const validatedFields = MemberSchema.safeParse(values);

    if (!validatedFields.success) {
      return { error: "Invalid fields!" };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { error: "User not authenticated." };
    }

    // Update member data
    await db.member.upsert({
      where: {
        userId: session.user.id,
      },
      update: {
        firstName: values.firstName,
        lastName: values.lastName,
        userBio: values.userBio,
      },
      create: {
        userId: session.user.id,
        firstName: values.firstName,
        lastName: values.lastName,
        userBio: values.userBio,
      },
    });

    // Update user image if provided
    if (values.image) {
      await db.user.update({
        where: {
          id: session.user.id,
        },
        data: {
          image: values.image,
        },
      });
    }

    return { success: "Member information updated!" };
  } catch (error) {
    console.error("Error updating member information:", error);
    return { error: "Failed to update member information." };
  }
};