import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ObjectId } from "mongodb";
import { 
  ROLES, 
  ROLE_PERMISSIONS,
  PERMISSIONS 
} from "@/data/roles-and-permissions";
import { updateUserSession } from "@/lib/session-update";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Validate ObjectID
    if (!ObjectId.isValid(params.userId)) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if current user has MANAGE_ROLES permission
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { permissions: true, role: true }
    });

    if (!currentUser?.permissions?.includes('MANAGE_ROLES')) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions. MANAGE_ROLES permission required." },
        { status: 403 }
      );
    }

    const { newRole, reason } = await req.json();

    if (!newRole || !reason?.trim()) {
      return NextResponse.json(
        { error: "New role and reason are required" },
        { status: 400 }
      );
    }

    // Validate the new role
    if (!Object.keys(ROLES).includes(newRole)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // Prevent changing own role (security measure)
    if (params.userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot change your own role" },
        { status: 400 }
      );
    }

    // Get the target user
    const targetUser = await db.user.findUnique({
      where: { id: params.userId },
      select: { 
        id: true, 
        role: true, 
        permissions: true,
        email: true,
        username: true
      }
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get default permissions for the new role
    const permissionValues = ROLE_PERMISSIONS[newRole as keyof typeof ROLES];

    // Update user role and permissions
    const updatedUser = await db.user.update({
      where: { id: params.userId },
      data: { 
        role: newRole,
        permissions: permissionValues
      },
      select: {
        id: true,
        role: true,
        permissions: true,
        email: true,
        username: true
      }
    });

    // Log the role change
    console.log(`Role change logged: User ${session.user.email} (${session.user.id}) changed user ${targetUser.email} (${params.userId}) role from ${targetUser.role} to ${newRole}. Reason: ${reason}`);

    // Update user session to reflect new role and permissions
    await updateUserSession(params.userId);

    // Emit WebSocket event for real-time session update
    try {
      const response = await fetch(`${process.env.NEXTAUTH_URL}/api/socket/session-update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: params.userId,
          updatedBy: session.user.id,
          reason: `Role changed to ${newRole}: ${reason}`,
        }),
      });

      if (response.ok) {
        console.log("WebSocket session update sent successfully");
      } else {
        console.log("WebSocket session update failed, but role was updated");
      }
    } catch (error) {
      console.log("WebSocket session update error:", error);
      // Continue anyway - the role was still updated successfully
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `User role updated to ${newRole} with default permissions`
    });

  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 