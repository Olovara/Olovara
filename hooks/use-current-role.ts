import { usePermissions } from "@/components/providers/PermissionProvider";

export const useCurrentRole = () => {
  const { role } = usePermissions();
  return role;
}; 