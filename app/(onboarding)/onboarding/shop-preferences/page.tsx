import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ShopPreferencesForm from "@/components/onboarding/ShopPreferencesForm";

export default async function ShopPreferencesPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login?callbackUrl=/onboarding/shop-preferences");
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <ShopPreferencesForm />
    </div>
  );
} 