import { NextRequest, NextResponse } from "next/server";
import {
  addUserPermission,
  removeUserPermission,
} from "@/actions/adminActions";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;
  let userId: string | undefined = undefined;

  try {
    // Get current user for grantedBy parameter
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
    const { permission, reason } = body;

    if (!permission) {
      return NextResponse.json(
        { error: "Permission is required" },
        { status: 400 }
      );
    }

    const result = await addUserPermission(
      userId,
      permission,
      reason || "Granted by admin",
      session.user.id
    );

    if (result.success) {
      return NextResponse.json({
        ...result,
        message: "Permission added successfully.",
      });
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (error) {
    // Log to console (always happens)
    console.error("Error adding permission:", error);

    // Log to database - admin could email about "couldn't add permission"
    const userMessage = logError({
      code: "USER_PERMISSION_ADD_FAILED",
      userId: session?.user?.id,
      route: "/api/users/[userId]/permissions",
      method: "POST",
      error,
      metadata: {
        targetUserId: userId,
        permission: body?.permission,
        reason: body?.reason,
        note: "Failed to add user permission",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let userId: string | undefined = undefined;
  let permission: string | null = null;

  try {
    // Get current user for removedBy parameter
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

    const { searchParams } = new URL(request.url);
    permission = searchParams.get("permission");

    if (!permission) {
      return NextResponse.json(
        { error: "Permission is required" },
        { status: 400 }
      );
    }

    const result = await removeUserPermission(
      userId,
      permission,
      session.user.id
    );

    if (result.success) {
      return NextResponse.json({
        ...result,
        message: "Permission removed successfully.",
      });
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (error) {
    // Log to console (always happens)
    console.error("Error removing permission:", error);

    // Log to database - admin could email about "couldn't remove permission"
    const userMessage = logError({
      code: "USER_PERMISSION_REMOVE_FAILED",
      userId: session?.user?.id,
      route: "/api/users/[userId]/permissions",
      method: "DELETE",
      error,
      metadata: {
        targetUserId: userId,
        permission,
        note: "Failed to remove user permission",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
