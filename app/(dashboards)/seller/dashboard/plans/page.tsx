import { auth } from '@/auth'
import { getSellerSubscription, getSubscriptionPlans, getSellerByUserId } from '@/lib/queries'
import { canUserAccessTestEnvironment } from '@/lib/test-environment'
import { redirect } from 'next/navigation'
import SubscriptionDashboard from './_components/subscription-dashboard'

export default async function SubscriptionPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/signin')
  }

  // Get seller information from user session
  const seller = await getSellerByUserId(session.user.id)
  
  if (!seller) {
    redirect('/seller/dashboard')
  }

  // Get seller's current subscription and available plans
  let currentSubscription = null
  let availablePlans: any[] = []
  let subscriptionsNotSetup = false

  try {
    // Check if user has test environment access (to show MAKER_FREE and STUDIO_FREE plans)
    const canAccessTest = await canUserAccessTestEnvironment(session.user.id)
    
    const [subscription, plans] = await Promise.all([
      getSellerSubscription(seller.id),
      getSubscriptionPlans(canAccessTest)
    ])
    currentSubscription = subscription
    availablePlans = plans
    subscriptionsNotSetup = plans.length === 0
  } catch (error) {
    console.error('Error fetching subscription data:', error)
    // If there's an error (like no subscription plans in database), show coming soon
    subscriptionsNotSetup = true
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription</h1>
          <p className="text-muted-foreground">
            {subscriptionsNotSetup 
              ? "Subscription plans are coming soon!" 
              : "Manage your Yarnnu subscription and access features"
            }
          </p>
        </div>
      </div>

      {subscriptionsNotSetup ? (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon!</h2>
              <p className="text-gray-600 mb-6">
                We&apos;re working hard to bring you amazing subscription plans with premium features. 
                Stay tuned for updates!
              </p>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="font-semibold text-purple-900 mb-3">What to expect:</h3>
              <ul className="text-left text-sm text-purple-800 space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                  <span>Starter Plan - Free with basic features</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                  <span>Maker Plan - Advanced features for growing sellers</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                  <span>Studio Plan - Website builder and premium features</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <SubscriptionDashboard 
          currentSubscription={currentSubscription}
          availablePlans={availablePlans}
          sellerId={seller.id}
        />
      )}
    </div>
  )
}
