import { db } from "@/lib/db";
import { Permission, Role, ROLE_PERMISSIONS } from "@/data/roles-and-permissions";
import { UserPermission } from "@/types/permissions";

function isUserPermission(obj: any): obj is UserPermission {
  return obj && typeof obj === 'object' && 'permission' in obj;
}

// Function to check if a user has a specific permission
export async function hasPermission(userId: string, permission: Permission): Promise<boolean> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true, permissions: true },
    });

    if (!user) return false;

    // Cast to unknown first, then to UserPermission[]
    const userPermissions = user.permissions as unknown as UserPermission[];

    const hasDirectPermission = userPermissions.some(
      (p) =>
        isUserPermission(p) &&
        p.permission === permission &&
        (!p.expiresAt || new Date(p.expiresAt) > new Date())
    );

    if (hasDirectPermission) return true;

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
      select: { role: true, permissions: true },
    });

    if (!user) return [];

    const userPermissions = user.permissions as unknown as UserPermission[];

    const directPermissions = userPermissions
      .filter(p => isUserPermission(p) && (!p.expiresAt || new Date(p.expiresAt) > new Date()))
      .map(p => p.permission);

    const rolePermissions = ROLE_PERMISSIONS[user.role as Role] || [];

    // Cast the final combined array to Permission[]
    return Array.from(new Set([...directPermissions, ...rolePermissions])) as Permission[];
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
    // We need to push a valid JSON object
    const newPermission: Omit<UserPermission, 'grantedBy'> = {
        permission,
        grantedAt: new Date(),
        expiresAt,
    };

    await db.user.update({
      where: { id: userId },
      data: {
        permissions: {
          push: newPermission as any, // Prisma expects JsonValue
        },
      },
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
      select: { permissions: true },
    });

    if (!user) return false;

    const userPermissions = user.permissions as unknown as UserPermission[];
    const updatedPermissions = userPermissions.filter(p => !isUserPermission(p) || p.permission !== permission);

    await db.user.update({
      where: { id: userId },
      data: {
        permissions: updatedPermissions as any, // Prisma expects JsonValue
      },
    });

    return true;
  } catch (error) {
    console.error("Error revoking permission:", error);
    return false;
  }
} 