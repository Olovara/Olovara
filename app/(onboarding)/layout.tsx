import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Jost } from "next/font/google";

const jost = Jost({ subsets: ["latin"] });

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/onboarding");
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 ${jost.className}`}>
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}