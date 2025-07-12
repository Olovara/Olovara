import { auth } from "@/auth";
import { getUserPermissions } from "@/lib/permissions";
import { NextResponse } from "next/server";

/**
 * Check if the current user has the required permissions
 * Use this in API routes for server-side permission validation
 */
export async function checkApiPermissions(requiredPermissions: string[]) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return {
      authorized: false,
      error: "Not authenticated",
      status: 401
    };
  }

  try {
    const userPermissions = await getUserPermissions(session.user.id);
    
    const hasAllPermissions = requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      return {
        authorized: false,
        error: "Insufficient permissions",
        status: 403,
        missingPermissions: requiredPermissions.filter(permission => 
          !userPermissions.includes(permission)
        )
      };
    }

    return {
      authorized: true,
      user: session.user,
      permissions: userPermissions
    };
  } catch (error) {
    console.error("Error checking API permissions:", error);
    return {
      authorized: false,
      error: "Failed to verify permissions",
      status: 500
    };
  }
}

/**
 * Higher-order function to wrap API route handlers with permission checks
 */
export function withPermissions(requiredPermissions: string[]) {
  return function(handler: (req: Request, context: any) => Promise<NextResponse>) {
    return async function(req: Request, context: any) {
      const permissionCheck = await checkApiPermissions(requiredPermissions);
      
      if (!permissionCheck.authorized) {
        return NextResponse.json(
          { error: permissionCheck.error },
          { status: permissionCheck.status }
        );
      }

      // Add user and permissions to context for the handler to use
      const enhancedContext = {
        ...context,
        user: permissionCheck.user,
        permissions: permissionCheck.permissions
      };

      return handler(req, enhancedContext);
    };
  };
}

/**
 * Convenience functions for common permission checks
 */
export const requireAdminAccess = withPermissions(['ACCESS_ADMIN_DASHBOARD']);
export const requireSellerAccess = withPermissions(['ACCESS_SELLER_DASHBOARD']);
export const requireMemberAccess = withPermissions(['ACCESS_MEMBER_DASHBOARD']);

/**
 * Check if user has any of the given permissions (OR logic)
 */
export async function checkAnyPermission(permissions: string[]) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { authorized: false, error: "Not authenticated" };
  }

  try {
    const userPermissions = await getUserPermissions(session.user.id);
    
    const hasAnyPermission = permissions.some(permission => 
      userPermissions.includes(permission)
    );

    return {
      authorized: hasAnyPermission,
      user: session.user,
      permissions: userPermissions
    };
  } catch (error) {
    console.error("Error checking any permission:", error);
    return { authorized: false, error: "Failed to verify permissions" };
  }
} 