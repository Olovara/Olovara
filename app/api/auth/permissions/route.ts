import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getUserPermissions } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log("Permissions API - Fetching user data:", {
      userId: session.user.id,
      timestamp: new Date().toISOString()
    });

    // Fetch fresh permissions and role from database
    const [permissions, user] = await Promise.all([
      getUserPermissions(session.user.id),
      db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
      })
    ]);

    console.log("Permissions API - Retrieved user data:", {
      userId: session.user.id,
      role: user?.role,
      permissionsCount: permissions.length,
      permissions: permissions,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      role: user?.role || 'MEMBER',
      permissions: permissions,
      userId: session.user.id,
      fetchedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" }, 
      { status: 500 }
    );
  }
} 