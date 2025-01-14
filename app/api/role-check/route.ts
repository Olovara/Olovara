import { currentRole } from "@/lib/auth";

export default async function roleCheck(req, res) {
  try {
    // Retrieve the current user role from the session
    const role = await currentRole();

    if (!role) {
      // If no role is found (user is not authenticated), return 403
      return res.status(403).json({ allowed: false, message: "Unauthorized" });
    }

    const { pathname } = req.nextUrl; // Directly get pathname from req.nextUrl

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
          return res.status(200).json({ allowed: true });
        } else {
          return res.status(403).json({ allowed: false, message: "Access denied" });
        }
      }
    }

    // If no matching role route found, return forbidden
    return res.status(403).json({ allowed: false, message: "Access denied" });
    
  } catch (error) {
    console.error("Error in role-check API:", error);
    return res.status(500).json({ allowed: false, message: "Internal server error" });
  }
}