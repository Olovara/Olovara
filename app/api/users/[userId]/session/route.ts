import { NextRequest, NextResponse } from "next/server";
import { updateUserSession } from "@/lib/session-update";
import { currentUser } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const currentUserData = await currentUser();

    if (!currentUserData) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Security check: Only allow users to update their own session or admins with proper permissions
    const isOwnSession = currentUserData.id === userId;
    const hasManagePermissions =
      currentUserData.permissions?.includes("MANAGE_PERMISSIONS") ||
      currentUserData.permissions?.includes("MANAGE_ROLES") ||
      currentUserData.role === "SUPER_ADMIN";

    if (!isOwnSession && !hasManagePermissions) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      );
    }

    // Update the user session
    const result = await updateUserSession(userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update session" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Session updated successfully",
      requiresClientRefresh: true,
    });
  } catch (error) {
    console.error("Error updating user session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
