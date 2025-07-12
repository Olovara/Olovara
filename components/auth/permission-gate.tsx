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
  const { hasPermission } = useCurrentPermissions();

  // Get the permission value from the permission object
  const permissionObject = PERMISSIONS[requiredPermission];
  
  if (!permissionObject) {
    console.error(`Invalid permission key: ${requiredPermission}`);
    return (
      <FormError message="Invalid permission configuration. Please contact support." />
    );
  }

  const permissionValue = permissionObject.value;
  const userHasPermission = hasPermission(permissionValue);

  if (!userHasPermission) {
    return (
      <FormError message="You don't have permission to view this content!" />
    );
  }

  return <>{children}</>;
};

export default PermissionGate; 