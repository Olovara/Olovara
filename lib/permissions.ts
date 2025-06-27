import { db } from "@/lib/db";
import { Permission, Role, ROLE_PERMISSIONS, getPermissionValue } from "@/data/roles-and-permissions";
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

    const permissionValue = getPermissionValue(permission);

    const hasDirectPermission = userPermissions.some(
      (p) => {
        if (!isUserPermission(p)) return false;
        
        // Convert string dates back to Date objects
        const expiresAt = p.expiresAt ? new Date(p.expiresAt) : null;
        const grantedAt = p.grantedAt ? new Date(p.grantedAt) : new Date();
        
        return p.permission === permissionValue &&
               (!expiresAt || expiresAt > new Date());
      }
    );

    if (hasDirectPermission) return true;

    const rolePermissions = ROLE_PERMISSIONS[user.role as Role] || [];
    return rolePermissions.includes(permissionValue);
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
}

// Function to get all permissions for a user
export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true, permissions: true },
    });

    if (!user) return [];

    const userPermissions = user.permissions as unknown as UserPermission[];

    // Convert string dates back to Date objects and filter valid permissions
    const directPermissions = userPermissions
      .filter(p => {
        if (!isUserPermission(p)) return false;
        
        // Convert string dates back to Date objects
        const expiresAt = p.expiresAt ? new Date(p.expiresAt) : null;
        const grantedAt = p.grantedAt ? new Date(p.grantedAt) : new Date();
        
        // Check if permission is still valid (not expired)
        return !expiresAt || expiresAt > new Date();
      })
      .map(p => p.permission);

    const rolePermissions = ROLE_PERMISSIONS[user.role as Role] || [];

    // Return the combined array as string[]
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
    // We need to push a valid JSON object
    const newPermission: Omit<UserPermission, 'grantedBy'> = {
        permission: getPermissionValue(permission),
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
    const permissionValue = getPermissionValue(permission);
    const updatedPermissions = userPermissions.filter(p => !isUserPermission(p) || p.permission !== permissionValue);

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

// Utility function to clean up permissions with string dates
export async function cleanupPermissionsWithStringDates(): Promise<void> {
  try {
    const users = await db.user.findMany({
      select: { id: true, permissions: true },
    });

    for (const user of users) {
      if (!user.permissions || !Array.isArray(user.permissions)) continue;

      const permissions = user.permissions as any[];
      let hasChanges = false;

      const cleanedPermissions = permissions.map(permission => {
        if (typeof permission === 'object' && permission !== null) {
          const cleaned = { ...permission };
          
          // Convert string grantedAt to Date
          if (typeof permission.grantedAt === 'string') {
            cleaned.grantedAt = new Date(permission.grantedAt);
            hasChanges = true;
          }
          
          // Convert string expiresAt to Date
          if (typeof permission.expiresAt === 'string') {
            cleaned.expiresAt = new Date(permission.expiresAt);
            hasChanges = true;
          }
          
          return cleaned;
        }
        return permission;
      });

      if (hasChanges) {
        await db.user.update({
          where: { id: user.id },
          data: { permissions: cleanedPermissions as any },
        });
        console.log(`Cleaned up permissions for user ${user.id}`);
      }
    }
    
    console.log('Permission cleanup completed');
  } catch (error) {
    console.error('Error cleaning up permissions:', error);
  }
} 