import { auth } from "@/auth";
import SellerApplicationForm from "@/components/forms/SellerApplicationForm";
import { redirect } from "next/navigation";

export default async function SellerApplication() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/register?callbackUrl=/seller-application");
  }

  return (
    <div className="flex items-center justify-center vertical-center">
      <SellerApplicationForm />
    </div>
  );
}