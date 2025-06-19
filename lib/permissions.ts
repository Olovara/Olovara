import { db } from "@/lib/db";
import { Permission, Role, ROLE_PERMISSIONS } from "@/data/roles-and-permissions";

// Function to check if a user has a specific permission
export async function hasPermission(userId: string, permission: Permission): Promise<boolean> {
  try {
    // Get user's role and direct permissions
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        permissions: true
      }
    });

    if (!user) return false;

    // Check direct permissions first
    const hasDirectPermission = user.permissions.some(
      (p) => p.permission === permission && (!p.expiresAt || new Date(p.expiresAt) > new Date())
    );

    if (hasDirectPermission) return true;

    // Check role-based permissions
    const rolePermissions = ROLE_PERMISSIONS[user.role as Role] || [];
    return rolePermissions.includes(permission);
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
}

// Function to get all permissions for a user
export async function getUserPermissions(userId: string): Promise<Permission[]> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        permissions: true
      }
    });

    if (!user) return [];

    // Get direct permissions that haven't expired
    const directPermissions = user.permissions
      .filter((p) => !p.expiresAt || new Date(p.expiresAt) > new Date())
      .map((p) => p.permission as Permission);

    // Get role-based permissions
    const rolePermissions = ROLE_PERMISSIONS[user.role as Role] || [];

    // Combine and deduplicate permissions
    return Array.from(new Set([...directPermissions, ...rolePermissions]));
  } catch (error) {
    console.error("Error getting user permissions:", error);
    return [];
  }
}

// Function to grant a permission to a user
export async function grantPermission(
  userId: string,
  permission: Permission,
  expiresAt?: Date
): Promise<boolean> {
  try {
    await db.user.update({
      where: { id: userId },
      data: {
        permissions: {
          push: {
            permission,
            grantedAt: new Date(),
            expiresAt
          }
        }
      }
    });
    return true;
  } catch (error) {
    console.error("Error granting permission:", error);
    return false;
  }
}

// Function to revoke a permission from a user
export async function revokePermission(userId: string, permission: Permission): Promise<boolean> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        permissions: true
      }
    });

    if (!user) return false;

    const updatedPermissions = user.permissions.filter(p => p.permission !== permission);

    await db.user.update({
      where: { id: userId },
      data: {
        permissions: updatedPermissions
      }
    });

    return true;
  } catch (error) {
    console.error("Error revoking permission:", error);
    return false;
  }
} 