import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is checking their own access or is an admin
    const isOwnAccess = session.user.id === params.userId;
    const isAdmin = await db.admin.findUnique({
      where: { userId: session.user.id },
      select: { role: true }
    });

    if (!isOwnAccess && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: params.userId },
      select: {
        canAccessTestEnvironment: true,
        role: true,
        admin: {
          select: { role: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Admins always have access
    const userIsAdmin = user.role === "SUPER_ADMIN" || user.admin?.role;
    const canAccessTestEnvironment = userIsAdmin || user.canAccessTestEnvironment;

    return NextResponse.json({
      canAccessTestEnvironment,
      isAdmin: userIsAdmin,
    });

  } catch (error) {
    console.error("Error checking test environment access:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 