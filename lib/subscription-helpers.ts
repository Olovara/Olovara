import { db } from '@/lib/db'

/**
 * Get seller's current subscription with plan details
 * This function ensures every seller has a subscription record
 */
export async function getSellerSubscription(sellerId: string) {
  const subscription = await db.sellerSubscription.findUnique({
    where: { sellerId },
    include: {
      plan: true
    }
  })

  if (!subscription) {
    // This should not happen for new sellers, but handle legacy sellers
    console.warn(`No subscription found for seller ${sellerId}. This is a legacy seller.`)
    
    // Get the STARTER plan as fallback
    const starterPlan = await db.subscriptionPlan.findUnique({
      where: { name: 'STARTER' }
    })

    if (!starterPlan) {
      throw new Error('STARTER subscription plan not found. Please seed subscription plans first.')
    }

    // Return a virtual subscription object for legacy sellers
    return {
      id: null,
      sellerId,
      planId: starterPlan.id,
      plan: starterPlan,
      status: 'ACTIVE',
      stripeSubscriptionId: null,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      trialEndsAt: null,
      cancelAtPeriodEnd: false,
      customDomain: null,
      websiteSlug: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isLegacy: true // Flag to indicate this is a virtual record
    }
  }

  return {
    ...subscription,
    isLegacy: false
  }
}

/**
 * Check if seller has a specific feature based on their subscription plan
 */
export async function sellerHasFeature(sellerId: string, feature: keyof {
  customDomain: boolean
  analytics: boolean
  prioritySupport: boolean
  websiteBuilder: boolean
}) {
  const subscription = await getSellerSubscription(sellerId)
  return subscription.plan[feature] === true
}

/**
 * Get seller's current plan name
 */
export async function getSellerPlanName(sellerId: string): Promise<string> {
  const subscription = await getSellerSubscription(sellerId)
  return subscription.plan.name
}

/**
 * Check if seller is on free plan
 */
export async function isSellerOnFreePlan(sellerId: string): Promise<boolean> {
  const planName = await getSellerPlanName(sellerId)
  return planName === 'STARTER'
}

/**
 * Get all sellers without subscription records (legacy sellers)
 * This is useful for migration scripts
 */
export async function getSellersWithoutSubscriptions() {
  const sellers = await db.seller.findMany({
    where: {
      subscription: {
        is: null
      }
    },
    select: {
      id: true,
      userId: true,
      shopName: true,
      createdAt: true
    }
  })

  return sellers
}

/**
 * Assign a free Studio plan to a seller (for test accounts, special users, etc.)
 */
export async function assignFreeStudioPlan(sellerId: string) {
  const studioFreePlan = await db.subscriptionPlan.findUnique({
    where: { name: 'STUDIO_FREE' }
  })

  if (!studioFreePlan) {
    throw new Error('STUDIO_FREE subscription plan not found. Please seed subscription plans first.')
  }

  // Check if seller already has a subscription
  const existingSubscription = await db.sellerSubscription.findUnique({
    where: { sellerId }
  })

  if (existingSubscription) {
    // Update existing subscription to STUDIO_FREE
    return await db.sellerSubscription.update({
      where: { sellerId },
      data: {
        planId: studioFreePlan.id,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        stripeSubscriptionId: null, // Remove any Stripe subscription
        cancelAtPeriodEnd: false
      }
    })
  } else {
    // Create new subscription
    return await db.sellerSubscription.create({
      data: {
        sellerId,
        planId: studioFreePlan.id,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        // No stripeSubscriptionId for free plan
      }
    })
  }
}

/**
 * Check if seller has a free Studio plan
 */
export async function hasFreeStudioPlan(sellerId: string): Promise<boolean> {
  const subscription = await getSellerSubscription(sellerId)
  return subscription.plan.name === 'STUDIO_FREE'
}
