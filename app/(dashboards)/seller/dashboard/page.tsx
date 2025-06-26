import SellerDashboardInfo from "./SellerDashboardInfo";
import SellerOnboardingDashboard from "@/components/seller/SellerOnboardingDashboard";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Seller - Dashboard",
};

export default async function SellerDashboardHome() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return <div>Not authenticated</div>;
  }

  // Check if seller onboarding data exists in session
  let onboardingData = session.user.sellerOnboarding;

  // If not in session, fetch from database
  if (!onboardingData) {
    try {
      const seller = await db.seller.findUnique({
        where: { userId: session.user.id },
        select: {
          applicationAccepted: true,
          stripeConnected: true,
          shopProfileComplete: true,
          shippingProfileCreated: true,
          isFullyActivated: true,
        }
      });

      if (seller) {
        onboardingData = {
          applicationAccepted: seller.applicationAccepted,
          stripeConnected: seller.stripeConnected,
          shopProfileComplete: seller.shopProfileComplete,
          shippingProfileCreated: seller.shippingProfileCreated,
          isFullyActivated: seller.isFullyActivated,
        };
      }
    } catch (error) {
      console.error("Error fetching seller data:", error);
    }
  }

  // If still no seller data, show error
  if (!onboardingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Seller Profile Not Found</h2>
          <p className="text-gray-600 mb-4">
            It looks like your seller profile hasn&apos;t been created yet. Please submit a seller application first.
          </p>
          <div className="space-x-4">
            <a 
              href="/seller-application" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Apply to Become a Seller
            </a>
            <button 
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if seller is fully activated using session data
  const isFullyActivated = onboardingData.isFullyActivated;

  return (
    <div>
      {isFullyActivated ? (
        <>
          <h1 className="text-3xl font-bold mb-4">Seller Dashboard</h1>
          <SellerDashboardInfo />
        </>
      ) : (
        <SellerOnboardingDashboard />
      )}
    </div>
  );
}