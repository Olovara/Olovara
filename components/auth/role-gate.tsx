"use client";

import { Role } from "@/data/roles-and-permissions";
import { useCurrentRole } from "@/hooks/use-current-role";
import FormError from "@/components/form-error";

interface RoleGateProps {
  children: React.ReactNode;
  allowedRole: Role;
}

const RoleGate = ({ children, allowedRole }: RoleGateProps) => {
  const role = useCurrentRole();

  if (role !== allowedRole) {
    return (
      <FormError message="You don't have permission to view this content!" />
    );
  }

  return <>{children}</>;
};

export default RoleGate;