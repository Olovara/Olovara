"use client";

import { useSession } from "next-auth/react";

export const useCurrentPermissions = () => {
  const session = useSession();
  return session.data?.user?.permissions || [];
}; 