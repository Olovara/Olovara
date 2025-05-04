"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { encryptName } from "@/lib/encryption";

interface MemberData {
  firstName: string;
  lastName: string;
  userBio: string;
}

export const memberInformation = async (data: MemberData) => {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    // Encrypt the names on the server side
    const { encrypted: encryptedFirstName, iv: firstNameIV } = encryptName(data.firstName);
    const { encrypted: encryptedLastName, iv: lastNameIV } = encryptName(data.lastName);

    // Check if member exists
    const existingMember = await db.member.findUnique({
      where: { userId: session.user.id },
    });

    if (existingMember) {
      // Update existing member information
      await db.member.update({
        where: { userId: session.user.id },
        data: {
          encryptedFirstName,
          encryptedLastName,
          firstNameIV,
          lastNameIV,
          userBio: data.userBio,
        },
      });
    } else {
      // Create new member record
      await db.member.create({
        data: {
          userId: session.user.id,
          encryptedFirstName,
          encryptedLastName,
          firstNameIV,
          lastNameIV,
          userBio: data.userBio,
        },
      });
    }

    return { success: "Member information updated successfully!" };
  } catch (error) {
    console.error("Error updating member information:", error);
    return { error: "Something went wrong!" };
  }
};