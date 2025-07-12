"use client";

import { useSession } from "next-auth/react";
import { usePermissions } from "@/components/providers/PermissionProvider";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode, useState } from "react";
import Spinner from "@/components/spinner";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermissions?: string[];
  fallback?: ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredPermissions = [], 
  fallback,
  redirectTo = "/"
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const { permissions, loading: permissionsLoading, hasAllPermissions } = usePermissions();
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [redirectPath, setRedirectPath] = useState("");

  // Handle redirects in useEffect to avoid React warnings
  useEffect(() => {
    console.log("ProtectedRoute - useEffect triggered:", {
      status,
      permissionsLoading,
      requiredPermissions,
      permissionsCount: permissions.length,
      shouldRedirect,
      redirectPath
    });

    // If not authenticated, redirect to login
    if (status === "unauthenticated") {
      setRedirectPath(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      setShouldRedirect(true);
      return;
    }

    // If permissions are required, check them (only after permissions have loaded)
    if (requiredPermissions.length > 0 && !permissionsLoading) {
      console.log("ProtectedRoute - Checking permissions:", {
        requiredPermissions,
        currentPermissions: permissions,
        hasRequiredPermissions: hasAllPermissions(requiredPermissions),
        permissionsLoading,
        permissionsCount: permissions.length
      });
      
      const hasRequiredPermissions = hasAllPermissions(requiredPermissions);
      
      if (!hasRequiredPermissions) {
        console.log("ProtectedRoute - Access denied, redirecting to:", redirectTo);
        setRedirectPath(redirectTo);
        setShouldRedirect(true);
        return;
      } else {
        console.log("ProtectedRoute - Access granted!");
      }
    }
  }, [status, permissionsLoading, requiredPermissions, permissions, hasAllPermissions, redirectTo, shouldRedirect, redirectPath]);

  // Execute redirect
  useEffect(() => {
    if (shouldRedirect && redirectPath) {
      router.push(redirectPath);
    }
  }, [shouldRedirect, redirectPath, router]);

  // Show loading while checking authentication and permissions
  if (status === "loading" || permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Spinner />
      </div>
    );
  }

  // If not authenticated or missing permissions, show fallback or nothing
  if (status === "unauthenticated" || shouldRedirect) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  // User is authenticated and has required permissions
  return <>{children}</>;
}

// Convenience components for common route types
export function AdminRoute({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ProtectedRoute 
      requiredPermissions={['ACCESS_ADMIN_DASHBOARD']}
      fallback={fallback}
      redirectTo="/unauthorized"
    >
      {children}
    </ProtectedRoute>
  );
}

export function SellerRoute({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ProtectedRoute 
      requiredPermissions={['ACCESS_SELLER_DASHBOARD']}
      fallback={fallback}
      redirectTo="/unauthorized"
    >
      {children}
    </ProtectedRoute>
  );
}

export function MemberRoute({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ProtectedRoute 
      requiredPermissions={['ACCESS_MEMBER_DASHBOARD']}
      fallback={fallback}
      redirectTo="/unauthorized"
    >
      {children}
    </ProtectedRoute>
  );
} 