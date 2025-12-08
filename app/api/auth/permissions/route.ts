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
        select: { 
          role: true,
          seller: {
            select: {
              id: true
            }
          }
        }
      })
    ]);

    // Determine role: if user has a seller profile, they're a SELLER
    // even if role field hasn't been updated yet
    const userRole = user?.role === 'SELLER' || user?.seller 
      ? 'SELLER' 
      : (user?.role || 'MEMBER');

    console.log("Permissions API - Retrieved user data:", {
      userId: session.user.id,
      role: user?.role,
      hasSellerProfile: !!user?.seller,
      determinedRole: userRole,
      permissionsCount: permissions.length,
      permissions: permissions,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      role: userRole,
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