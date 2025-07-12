import { auth } from "@/auth";
import CheckoutSuccessClient from "./CheckoutSuccessClient";
import { PermissionProvider } from "@/components/providers/PermissionProvider";

export default async function CheckoutSuccessPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return <div>Not authenticated</div>;
  }

  return (
    <PermissionProvider>
      <CheckoutSuccessClient />
    </PermissionProvider>
  );
} 