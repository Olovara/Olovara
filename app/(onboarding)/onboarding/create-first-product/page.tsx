import { auth } from "@/auth";
import CreateFirstProductForm from "@/components/onboarding/CreateFirstProductForm";
import { redirect } from "next/navigation";

export default async function CreateFirstProductPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login?callbackUrl=/onboarding/create-first-product");
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <CreateFirstProductForm />
    </div>
  );
} 