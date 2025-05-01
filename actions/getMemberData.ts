"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";

export const getMemberData = async () => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "User not authenticated." };
    }

    const member = await db.member.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        firstName: true,
        lastName: true,
        userBio: true,
      },
    });

    const user = await db.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        email: true,
        image: true,
      },
    });

    if (!member || !user) {
      return { error: "Member data not found." };
    }

    // Combine member and user data
    const formattedData = {
      ...member,
      email: user.email || "",
      image: user.image || "",
    };

    return { data: formattedData };
  } catch (error) {
    console.error("Error fetching member data:", error);
    return { error: "Failed to fetch member data." };
  }
}; 