"use client";

import { Permission } from "@/data/roles-and-permissions";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import FormError from "@/components/form-error";

interface PermissionGateProps {
  children: React.ReactNode;
  requiredPermission: Permission;
}

const PermissionGate = ({ children, requiredPermission }: PermissionGateProps) => {
  const { data: session } = useSession();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      if (!session?.user?.id) {
        setHasPermission(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/check-permission?permission=${requiredPermission}`);
        if (!response.ok) {
          throw new Error('Failed to check permission');
        }
        const data = await response.json();
        setHasPermission(data.hasPermission);
      } catch (error) {
        console.error("Error checking permission:", error);
        setHasPermission(false);
      }
    };

    checkPermission();
  }, [session, requiredPermission]);

  if (hasPermission === null) {
    return null; // Loading state
  }

  if (!hasPermission) {
    return (
      <FormError message="You don't have permission to view this content!" />
    );
  }

  return <>{children}</>;
};

export default PermissionGate; 