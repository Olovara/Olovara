import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getUserPermissions } from "@/lib/permissions";
import { logError } from "@/lib/error-logger";

export async function GET(request: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log("Permissions API - Fetching user data:", {
      userId: session.user.id,
      timestamp: new Date().toISOString(),
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
              id: true,
            },
          },
        },
      }),
    ]);

    // Determine role: if user has a seller profile, they're a SELLER
    // even if role field hasn't been updated yet
    const userRole =
      user?.role === "SELLER" || user?.seller
        ? "SELLER"
        : user?.role || "MEMBER";

    console.log("Permissions API - Retrieved user data:", {
      userId: session.user.id,
      role: user?.role,
      hasSellerProfile: !!user?.seller,
      determinedRole: userRole,
      permissionsCount: permissions.length,
      permissions: permissions,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      role: userRole,
      permissions: permissions,
      userId: session.user.id,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error fetching user data:", error);

    // Log to database - user could email about "can't load permissions"
    const userMessage = logError({
      code: "AUTH_PERMISSIONS_FETCH_FAILED",
      userId: session?.user?.id,
      route: "/api/auth/permissions",
      method: "GET",
      error,
      metadata: {
        note: "Failed to fetch user permissions",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
