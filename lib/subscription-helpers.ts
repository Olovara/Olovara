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
    // Removed sellerId from log for security
    console.warn(`No subscription found for seller. This is a legacy seller.`)
    
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
    // Use placeholder for websiteSlug - will be updated to actual slug when website is created
    const updateData: any = {
      planId: studioFreePlan.id,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      stripeSubscriptionId: `free_${sellerId}`, // Unique placeholder for free plans (avoids unique constraint issues)
      cancelAtPeriodEnd: false
    };
    
    // If websiteSlug is null or starts with placeholder, set pending placeholder
    // This will be updated to actual slug when website is created
    if (!existingSubscription.websiteSlug || 
        existingSubscription.websiteSlug.startsWith('pending_website_') ||
        existingSubscription.websiteSlug.startsWith('no_website_')) {
      updateData.websiteSlug = `pending_website_${sellerId}`;
    }
    
    return await db.sellerSubscription.update({
      where: { sellerId },
      data: updateData
    })
  } else {
    // Create new subscription for STUDIO_FREE plan
    // Use placeholder for websiteSlug - will be updated to actual slug when website is created
    return await db.sellerSubscription.create({
      data: {
        sellerId,
        planId: studioFreePlan.id,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        stripeSubscriptionId: `free_${sellerId}`, // Unique placeholder for free plans (avoids unique constraint issues)
        websiteSlug: `pending_website_${sellerId}`, // Placeholder for STUDIO plans - will be updated when website is created
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
