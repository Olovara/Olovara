import { auth } from "@/auth";
import { redirect } from "next/navigation";
import HelpPreferencesForm from "@/components/onboarding/HelpPreferencesForm";

export default async function HelpPreferencesPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login?callbackUrl=/onboarding/help-preferences");
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <HelpPreferencesForm />
    </div>
  );
} 