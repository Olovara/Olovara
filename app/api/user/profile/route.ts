import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { encryptName, decryptName } from "@/lib/encryption";
import { z } from "zod";

// Schema for updating profile
const updateProfileSchema = z.object({
  firstName: z.string()
    .min(1, "First name is required")
    .max(50, "First name must be less than 50 characters")
    .transform(val => val.trim()),
  bio: z.string()
    .max(500, "Bio must be less than 500 characters")
    .transform(val => val.trim())
    .optional()
    .nullable(),
});

// GET: Fetch user profile
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to view your profile" },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: {
        encryptedFirstName: true,
        firstNameIV: true,
        userBio: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Decrypt first name if it exists
    let firstName = null;
    if (user.encryptedFirstName && user.firstNameIV) {
      try {
        firstName = decryptName(user.encryptedFirstName, user.firstNameIV);
      } catch (error) {
        console.error("Error decrypting first name:", error);
        firstName = null;
      }
    }

    return NextResponse.json({
      firstName,
      bio: user.userBio,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT: Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to update your profile" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Encrypt first name if provided
    let encryptedFirstName = null;
    let firstNameIV = null;
    
    if (validatedData.firstName) {
      const { encrypted, iv } = encryptName(validatedData.firstName);
      encryptedFirstName = encrypted;
      firstNameIV = iv;
    }

    // Update user profile
    const updatedUser = await db.user.update({
      where: { email: session.user.email },
      data: {
        encryptedFirstName,
        firstNameIV,
        userBio: validatedData.bio || null,
      },
      select: {
        encryptedFirstName: true,
        firstNameIV: true,
        userBio: true,
      },
    });

    // Decrypt first name for response
    let firstName = null;
    if (updatedUser.encryptedFirstName && updatedUser.firstNameIV) {
      firstName = decryptName(updatedUser.encryptedFirstName, updatedUser.firstNameIV);
    }

    return NextResponse.json({
      firstName,
      bio: updatedUser.userBio,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid profile data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
} 