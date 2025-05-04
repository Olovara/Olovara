import { auth } from "@/auth";
import { db } from "@/lib/db";
import { encryptName } from "@/lib/encryption";

export async function updateMemberProfile(data: {
  firstName: string;
  lastName: string;
  userBio?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    // Encrypt the names
    const { encrypted: encryptedFirstName, iv: firstNameIV } = encryptName(
      data.firstName
    );
    const { encrypted: encryptedLastName, iv: lastNameIV } = encryptName(
      data.lastName
    );

    // Update the member profile
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

    return { success: true };
  } catch (error) {
    console.error("Error updating member profile:", error);
    throw error;
  }
} 