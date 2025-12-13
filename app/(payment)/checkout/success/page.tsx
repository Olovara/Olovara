import { auth } from "@/auth";
import CheckoutSuccessClient from "./CheckoutSuccessClient";
import { PermissionProvider } from "@/components/providers/PermissionProvider";

export default async function CheckoutSuccessPage() {
  const session = await auth();
  const isAuthenticated = !!session?.user?.id;

  // Show success page for both authenticated and guest users
  // Guest users won't see the "View Purchases" button
  return (
    <PermissionProvider>
      <CheckoutSuccessClient isAuthenticated={isAuthenticated} />
    </PermissionProvider>
  );
} 