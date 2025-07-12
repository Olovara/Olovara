import { NextRequest, NextResponse } from "next/server";
import { updateUserRole } from "@/actions/adminActions";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Get current user for updatedBy parameter
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Validate that the userId is a valid ObjectID
    if (!ObjectId.isValid(params.userId)) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    const { role, reason } = await request.json();
    
    if (!role) {
      return NextResponse.json(
        { error: "Role is required" },
        { status: 400 }
      );
    }

    const result = await updateUserRole(params.userId, role, reason || "Role updated by admin", session.user.id);
    
    if (result.success) {
      return NextResponse.json({
        ...result,
        message: "User role updated successfully."
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 