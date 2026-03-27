import { auth } from "@/auth";
import SellerApplicationForm from "@/components/forms/SellerApplicationForm";
import { redirect } from "next/navigation";

export default async function SellerApplication() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login?callbackUrl=/seller-application");
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-brand-light-neutral-25">
      <div className="flex items-center justify-center px-2 sm:px-4 py-16">
      <SellerApplicationForm />
      </div>
    </div>
  );
}