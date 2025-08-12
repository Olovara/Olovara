import { auth } from "@/auth";
import PaymentSetupForm from "@/components/onboarding/PaymentSetupForm";
import { redirect } from "next/navigation";

export default async function PaymentSetupPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/onboarding/payment-setup");
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <PaymentSetupForm />
    </div>
  );
}
