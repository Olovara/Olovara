"use client";

import { usePermissions } from "@/components/providers/PermissionProvider";

export const useCurrentPermissions = () => {
  const { 
    permissions, 
    loading, 
    error, 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions, 
    refreshPermissions 
  } = usePermissions();

  return {
    permissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshPermissions,
  };
}; 