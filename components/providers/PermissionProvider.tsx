"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useSession } from "next-auth/react";

interface Permission {
  permission: string;
  grantedAt: string;
  grantedBy: string;
  reason: string;
  expiresAt: string | null;
}

interface PermissionContextType {
  permissions: (Permission | string)[];
  role: string | null;
  loading: boolean;
  error: string | null;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissionList: string[]) => boolean;
  hasAllPermissions: (permissionList: string[]) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

// localStorage keys
const PERMISSIONS_STORAGE_KEY = 'yarnnu_user_permissions';
const ROLE_STORAGE_KEY = 'yarnnu_user_role';
const PERMISSIONS_TIMESTAMP_KEY = 'yarnnu_permissions_timestamp';
const PERMISSIONS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [permissions, setPermissions] = useState<(Permission | string)[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get cached data from localStorage
  const getCachedData = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    try {
      const timestamp = localStorage.getItem(PERMISSIONS_TIMESTAMP_KEY);
      const cachedPermissions = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
      const cachedRole = localStorage.getItem(ROLE_STORAGE_KEY);
      
      if (timestamp && cachedPermissions && cachedRole) {
        const age = Date.now() - parseInt(timestamp);
        if (age < PERMISSIONS_CACHE_DURATION) {
          return {
            permissions: JSON.parse(cachedPermissions),
            role: cachedRole
          };
        }
      }
    } catch (error) {
      console.error('Error reading cached data:', error);
    }
    
    return null;
  }, []);

  // Save data to localStorage
  const saveDataToCache = useCallback((permissions: Permission[], role: string) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(permissions));
      localStorage.setItem(ROLE_STORAGE_KEY, role);
      localStorage.setItem(PERMISSIONS_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error saving data to cache:', error);
    }
  }, []);

  // Clear cached data
  const clearCachedData = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(PERMISSIONS_STORAGE_KEY);
      localStorage.removeItem(ROLE_STORAGE_KEY);
      localStorage.removeItem(PERMISSIONS_TIMESTAMP_KEY);
    } catch (error) {
      console.error('Error clearing cached data:', error);
    }
  }, []);

  const fetchUserData = useCallback(async (forceRefresh = false) => {
    if (!session?.user?.id) {
      setPermissions([]);
      setRole(null);
      setLoading(false);
      clearCachedData();
      return;
    }

    console.log("PermissionProvider - fetchUserData called:", {
      userId: session.user.id,
      forceRefresh,
      timestamp: new Date().toISOString()
    });

    // Try to get cached data first (unless forcing refresh)
    if (!forceRefresh) {
      const cachedData = getCachedData();
      if (cachedData) {
        console.log("PermissionProvider - Using cached data:", {
          userId: session.user.id,
          role: cachedData.role,
          permissionsCount: cachedData.permissions.length,
          permissions: cachedData.permissions
        });
        setPermissions(cachedData.permissions);
        setRole(cachedData.role);
        setLoading(false);
        setError(null);
        return;
      }
    }

    try {
      setLoading(true);
      console.log("PermissionProvider - Fetching fresh user data from API...");
      const response = await fetch('/api/auth/permissions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      const freshPermissions = data.permissions || [];
      const freshRole = data.role || 'MEMBER';
      
      console.log("PermissionProvider - Received fresh user data:", {
        userId: session.user.id,
        role: freshRole,
        permissionsCount: freshPermissions.length,
        permissions: freshPermissions
      });
      
      setPermissions(freshPermissions);
      setRole(freshRole);
      setError(null);
      
      // Cache the fresh data
      saveDataToCache(freshPermissions, freshRole);
      console.log("PermissionProvider - User data cached successfully");
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user data');
      setPermissions([]);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, getCachedData, saveDataToCache, clearCachedData]);

  // Fetch user data when session changes
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetchUserData();
    } else if (status === 'unauthenticated') {
      setPermissions([]);
      setRole(null);
      setLoading(false);
      clearCachedData();
    }
  }, [session?.user?.id, status, fetchUserData, clearCachedData]);

  // Helper function to check if user has a specific permission
  const hasPermission = (permission: string): boolean => {
    // Check if permissions is an array of strings (from API) or objects (from cache)
    if (permissions.length > 0 && typeof permissions[0] === 'string') {
      return permissions.includes(permission);
    } else {
      return permissions.some(p => typeof p === 'object' && p.permission === permission);
    }
  };

  // Helper function to check if user has any of the given permissions
  const hasAnyPermission = (permissionList: string[]): boolean => {
    return permissionList.some(permission => hasPermission(permission));
  };

  // Helper function to check if user has all of the given permissions
  const hasAllPermissions = (permissionList: string[]): boolean => {
    return permissionList.every(permission => hasPermission(permission));
  };

  // Function to manually refresh user data (useful after permission/role changes)
  const refreshPermissions = useCallback(async () => {
    await fetchUserData(true); // Force refresh
  }, [fetchUserData]);

  // Debug logging
  console.log("PermissionProvider - Current State:", {
    userId: session?.user?.id,
    role,
    loading,
    error,
    permissionsCount: permissions.length,
    status,
    permissions: permissions.map(p => typeof p === 'string' ? p : p.permission)
  });

  const value: PermissionContextType = {
    permissions,
    role,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshPermissions,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
} 