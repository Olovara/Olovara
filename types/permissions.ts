import { Permission } from '@/data/roles-and-permissions'

export interface UserPermission {
  permission: string;
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date | null;
  reason?: string;
}

export function isPermissionValid(permission: UserPermission): boolean {
  if (!permission.expiresAt) return true;
  return new Date(permission.expiresAt) > new Date();
}

export function hasValidPermission(permissions: UserPermission[], requiredPermission: string): boolean {
  const permission = permissions.find(p => p.permission === requiredPermission);
  if (!permission) return false;
  return isPermissionValid(permission);
} 