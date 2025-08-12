import { auth } from "@/auth";
import ShopNamingForm from "@/components/onboarding/ShopNamingForm";
import { redirect } from "next/navigation";

export default async function ShopNamingPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login?callbackUrl=/onboarding/shop-naming");
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <ShopNamingForm />
    </div>
  );
} 