"use client";

import { useCurrentPermissions } from "@/hooks/use-current-permissions";
import { PERMISSIONS, Permission } from "@/data/roles-and-permissions";
import FormError from "@/components/form-error";

interface PermissionGateProps {
  children: React.ReactNode;
  requiredPermission: Permission;
}

const PermissionGate = ({
  children,
  requiredPermission,
}: PermissionGateProps) => {
  const permissions = useCurrentPermissions();

  const hasPermission = permissions.includes(requiredPermission);

  if (!hasPermission) {
    return (
      <FormError message="You don't have permission to view this content!" />
    );
  }

  return <>{children}</>;
};

export default PermissionGate; 