"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { z } from "zod";

interface EncryptedMemberData {
  encryptedFirstName: string;
  encryptedLastName: string;
  firstNameIV: string;
  lastNameIV: string;
  userBio: string;
  image?: string;
}

export const memberInformation = async (values: EncryptedMemberData) => {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    // Update member information with encrypted data
    await db.member.updateMany({
      where: {
        userId: session.user.id,
      },
      data: {
        encryptedFirstName: values.encryptedFirstName,
        encryptedLastName: values.encryptedLastName,
        firstNameIV: values.firstNameIV,
        lastNameIV: values.lastNameIV,
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

    return { success: "Member information updated successfully!" };
  } catch (error) {
    console.error("Error updating member information:", error);
    return { error: "Something went wrong!" };
  }
};