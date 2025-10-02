// Example usage of subscription helpers in your components

import { getSellerSubscription, sellerHasFeature, getSellerPlanName, isSellerOnFreePlan } from './subscription-helpers'

// Example 1: Check if seller can use website builder
export async function canUseWebsiteBuilder(sellerId: string): Promise<boolean> {
  return await sellerHasFeature(sellerId, 'websiteBuilder')
}

// Example 2: Get seller's subscription details for dashboard
export async function getSellerSubscriptionDetails(sellerId: string) {
  const subscription = await getSellerSubscription(sellerId)
  
  return {
    planName: subscription.plan.displayName,
    price: subscription.plan.price,
    features: subscription.plan.features,
    hasCustomDomain: subscription.plan.customDomain,
    hasAnalytics: subscription.plan.analytics,
    hasPrioritySupport: subscription.plan.prioritySupport,
    hasWebsiteBuilder: subscription.plan.websiteBuilder,
    status: subscription.status,
    isLegacy: subscription.isLegacy
  }
}

// Example 3: Check if seller should see upgrade prompts
export async function shouldShowUpgradePrompt(sellerId: string): Promise<boolean> {
  const isOnFreePlan = await isSellerOnFreePlan(sellerId)
  return isOnFreePlan // Show upgrade prompts for free plan users
}

// Example 4: Get plan-specific limits
export async function getSellerLimits(sellerId: string) {
  const planName = await getSellerPlanName(sellerId)
  
  switch (planName) {
    case 'STARTER':
      return {
        maxProducts: 50,
        maxCustomOrders: 10,
        commissionRate: 0.10, // 10%
        hasWebsiteBuilder: false,
        hasCustomDomain: false
      }
    case 'MAKER':
      return {
        maxProducts: 200,
        maxCustomOrders: 50,
        commissionRate: 0.08, // 8%
        hasWebsiteBuilder: false,
        hasCustomDomain: false
      }
    case 'STUDIO':
      return {
        maxProducts: -1, // Unlimited
        maxCustomOrders: -1, // Unlimited
        commissionRate: 0.08, // 8%
        hasWebsiteBuilder: true,
        hasCustomDomain: true
      }
    default:
      // Fallback to STARTER limits
      return {
        maxProducts: 50,
        maxCustomOrders: 10,
        commissionRate: 0.10,
        hasWebsiteBuilder: false,
        hasCustomDomain: false
      }
  }
}
