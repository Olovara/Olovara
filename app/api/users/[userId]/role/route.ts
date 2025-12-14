import { NextRequest, NextResponse } from "next/server";
import { updateUserRole } from "@/actions/adminActions";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { logError } from "@/lib/error-logger";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;
  let userId: string | undefined = undefined;

  try {
    // Get current user for updatedBy parameter
    session = await auth();
    userId = params.userId;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Validate that the userId is a valid ObjectID
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    body = await request.json();
    const { role, reason } = body;

    if (!role) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    const result = await updateUserRole(
      userId,
      role,
      reason || "Role updated by admin",
      session.user.id
    );

    if (result.success) {
      return NextResponse.json({
        ...result,
        message: "User role updated successfully.",
      });
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (error) {
    // Log to console (always happens)
    console.error("Error updating user role:", error);

    // Log to database - admin could email about "couldn't update user role"
    const userMessage = logError({
      code: "USER_ROLE_UPDATE_FAILED",
      userId: session?.user?.id,
      route: "/api/users/[userId]/role",
      method: "PATCH",
      error,
      metadata: {
        targetUserId: userId,
        role: body?.role,
        reason: body?.reason,
        note: "Failed to update user role",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
