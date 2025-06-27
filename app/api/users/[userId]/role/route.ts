import { NextRequest, NextResponse } from "next/server";
import { updateUserRole } from "@/actions/adminActions";
import { currentUser } from "@/lib/auth";
import { z } from "zod";

// Validation schema for role update request
const roleUpdateSchema = z.object({
  newRole: z.string().min(1, "Role is required"),
  reason: z.string().min(1, "Reason is required").max(500, "Reason must be less than 500 characters"),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get current user for audit logging
    const currentUserData = await currentUser();
    if (!currentUserData) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = roleUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid request data",
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { newRole, reason } = validationResult.data;

    // Update the user's role with current user info for audit logging
    const result = await updateUserRole(
      userId, 
      newRole, 
      reason, 
      currentUserData.email || currentUserData.id || "Unknown Admin"
    );

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Role updated successfully",
      data: result
    });

  } catch (error) {
    console.error("Error in role update API:", error);
    
    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes("Forbidden")) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
      
      if (error.message.includes("not found")) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
      
      if (error.message.includes("Invalid role")) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      
      if (error.message.includes("Cannot change your own role")) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      
      if (error.message.includes("Only Super Admins")) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 