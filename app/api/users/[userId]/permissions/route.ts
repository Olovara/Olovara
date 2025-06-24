import { NextRequest, NextResponse } from "next/server";
import { addUserPermission, removeUserPermission } from "@/actions/adminActions";

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { permission, reason } = await request.json();
    
    if (!permission) {
      return NextResponse.json(
        { error: "Permission is required" },
        { status: 400 }
      );
    }

    const result = await addUserPermission(params.userId, permission, reason);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error adding permission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const permission = searchParams.get("permission");
    
    if (!permission) {
      return NextResponse.json(
        { error: "Permission is required" },
        { status: 400 }
      );
    }

    const result = await removeUserPermission(params.userId, permission);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error removing permission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 