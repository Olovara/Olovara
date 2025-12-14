import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logError } from "@/lib/error-logger";

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let userId: string | undefined = undefined;

  try {
    session = await auth();
    userId = params.userId;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is checking their own access or is an admin
    const isOwnAccess = session.user.id === userId;
    const isAdmin = await db.admin.findUnique({
      where: { userId: session.user.id },
      select: { role: true },
    });

    if (!isOwnAccess && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        canAccessTestEnvironment: true,
        role: true,
        admin: {
          select: { role: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Admins always have access
    const userIsAdmin = user.role === "SUPER_ADMIN" || user.admin?.role;
    const canAccessTestEnvironment =
      userIsAdmin || user.canAccessTestEnvironment;

    return NextResponse.json({
      canAccessTestEnvironment,
      isAdmin: userIsAdmin,
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error checking test environment access:", error);

    // Log to database - user could email about "can't check test access"
    const userMessage = logError({
      code: "USER_TEST_ACCESS_CHECK_FAILED",
      userId: session?.user?.id,
      route: "/api/users/[userId]/test-access",
      method: "GET",
      error,
      metadata: {
        targetUserId: userId,
        note: "Failed to check test environment access",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
