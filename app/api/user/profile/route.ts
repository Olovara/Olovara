import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { encryptData, decryptData } from "@/lib/encryption";
import { z } from "zod";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = 'force-dynamic';

// Schema for updating profile
const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be less than 50 characters")
    .transform((val) => val.trim()),
  bio: z
    .string()
    .max(500, "Bio must be less than 500 characters")
    .transform((val) => val.trim())
    .optional()
    .nullable(),
});

// GET: Fetch user profile
export async function GET() {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to view your profile" },
        { status: 401 }
      );
    }

    // Normalize email to lowercase for consistent lookup
    const normalizedEmail = session.user.email.trim().toLowerCase();

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        encryptedFirstName: true,
        firstNameIV: true,
        firstNameSalt: true,
        userBio: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Decrypt first name if it exists
    let firstName = null;
    if (user.encryptedFirstName && user.firstNameIV && user.firstNameSalt) {
      try {
        firstName = decryptData(
          user.encryptedFirstName,
          user.firstNameIV,
          user.firstNameSalt
        );
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
    // Log to console (always happens)
    console.error("Error fetching profile:", error);

    // Log to database - user could email about "can't see my profile"
    const userMessage = logError({
      code: "USER_PROFILE_FETCH_FAILED",
      userId: session?.user?.id,
      route: "/api/user/profile",
      method: "GET",
      error,
      metadata: {
        email: session?.user?.email,
        note: "Failed to fetch user profile",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

// PUT: Update user profile
export async function PUT(request: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;

  try {
    session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to update your profile" },
        { status: 401 }
      );
    }

    body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Encrypt first name if provided
    let encryptedFirstName = null;
    let firstNameIV = null;
    let firstNameSalt = null;

    if (validatedData.firstName) {
      const { encrypted, iv, salt } = encryptData(validatedData.firstName);
      encryptedFirstName = encrypted;
      firstNameIV = iv;
      firstNameSalt = salt;
    }

    // Update user profile
    const updatedUser = await db.user.update({
      where: { email: session.user.email },
      data: {
        encryptedFirstName,
        firstNameIV,
        firstNameSalt,
        userBio: validatedData.bio || null,
      },
      select: {
        encryptedFirstName: true,
        firstNameIV: true,
        firstNameSalt: true,
        userBio: true,
      },
    });

    // Decrypt first name for response
    let firstName = null;
    if (
      updatedUser.encryptedFirstName &&
      updatedUser.firstNameIV &&
      updatedUser.firstNameSalt
    ) {
      firstName = decryptData(
        updatedUser.encryptedFirstName,
        updatedUser.firstNameIV,
        updatedUser.firstNameSalt
      );
    }

    return NextResponse.json({
      firstName,
      bio: updatedUser.userBio,
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error updating profile:", error);

    // Check if it's a ZodError (validation error) - don't log these to DB
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid profile data", details: error.errors },
        { status: 400 }
      );
    }

    // Log to database - user could email about "couldn't update profile"
    const userMessage = logError({
      code: "USER_PROFILE_UPDATE_FAILED",
      userId: session?.user?.id,
      route: "/api/user/profile",
      method: "PUT",
      error,
      metadata: {
        email: session?.user?.email,
        hasFirstName: !!body?.firstName,
        hasBio: !!body?.bio,
        note: "Failed to update user profile",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
