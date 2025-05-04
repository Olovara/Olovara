"use server";

import { db } from "@/lib/db";
import { decryptName } from "@/lib/encryption";

export async function getMemberData(userId: string | undefined) {
  if (!userId) {
    return null;
  }

  try {
    const member = await db.member.findUnique({
      where: { userId },
      select: {
        encryptedFirstName: true,
        encryptedLastName: true,
        firstNameIV: true,
        lastNameIV: true,
        userBio: true
      }
    });

    if (!member) {
      return null;
    }

    return {
      firstName: decryptName(member.encryptedFirstName, member.firstNameIV),
      lastName: decryptName(member.encryptedLastName, member.lastNameIV),
      userBio: member.userBio
    };
  } catch (error) {
    console.error("Error getting member data:", error);
    return null;
  }
} 