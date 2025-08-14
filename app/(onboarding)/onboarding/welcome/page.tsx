import { auth } from "@/auth";
import WelcomePage from "@/components/onboarding/WelcomePage";
import { redirect } from "next/navigation";

export default async function WelcomePageRoute() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login?callbackUrl=/onboarding/welcome");
  }

  return <WelcomePage />;
}
