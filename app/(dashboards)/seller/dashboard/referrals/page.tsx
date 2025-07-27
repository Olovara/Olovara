import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ReferralDashboard from "@/components/referrals/ReferralDashboard";

export default async function SellerReferralsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Referrals</h1>
          <p className="text-gray-600">
            Track your referrals and earn rewards for bringing new sellers to Yarnnu
          </p>
        </div>
        
        <ReferralDashboard 
          userId={session.user.id} 
        />
      </div>
    </div>
  );
} 