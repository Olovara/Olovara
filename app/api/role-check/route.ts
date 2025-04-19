import { currentRole } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Retrieve the current user role from the session
    const role = await currentRole();

    if (!role) {
      // If no role is found (user is not authenticated), return 403
      return NextResponse.json({ allowed: false, message: "Unauthorized" }, { status: 403 });
    }

    const pathname = req.nextUrl.pathname;

    // Define route prefixes for role-based access
    const routeRoles = {
      "/admin": "ADMIN",
      "/seller": "SELLER",
      "/member": "MEMBER",
    };

    // Check if the current route matches a role
    for (const [routePrefix, requiredRole] of Object.entries(routeRoles)) {
      if (pathname.startsWith(routePrefix)) {
        if (role === requiredRole) {
          return NextResponse.json({ allowed: true }, { status: 200 });
        } else {
          return NextResponse.json({ allowed: false, message: "Access denied" }, { status: 403 });
        }
      }
    }

    // If no matching role route found, return forbidden
    return NextResponse.json({ allowed: false, message: "Access denied" }, { status: 403 });
    
  } catch (error) {
    console.error("Error in role-check API:", error);
    return NextResponse.json({ allowed: false, message: "Internal server error" }, { status: 500 });
  }
}