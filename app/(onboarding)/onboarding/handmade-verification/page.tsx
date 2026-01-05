import { auth } from "@/auth";
import { redirect } from "next/navigation";
import HandmadeVerificationForm from "@/components/onboarding/HandmadeVerificationForm";

export default async function HandmadeVerificationPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login?callbackUrl=/onboarding/handmade-verification");
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <HandmadeVerificationForm />
    </div>
  );
}

