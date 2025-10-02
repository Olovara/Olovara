import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const subscriptionPlans = [
  {
    name: 'STARTER',
    displayName: 'Starter',
    price: 0, // $0.00 in cents
    currency: 'USD',
    features: [
      'Marketplace access',
      '10% commission fee',
      'Custom orders',
      'Basic analytics'
    ],
    customDomain: false,
    analytics: true, // basic analytics
    prioritySupport: false,
    websiteBuilder: false,
    stripePriceId: null, // Free plan - no Stripe price ID needed
    isActive: true
  },
  {
    name: 'MAKER',
    displayName: 'Maker',
    price: 1500, // $15.00 in cents
    currency: 'USD',
    features: [
      'Everything in Starter plus',
      '8% commission fee instead of 10%',
      'Advanced analytics',
      'SEO assistance',
      'Basic CRM (track repeat buyers)',
      'Digital product stamping + licensing options'
    ],
    customDomain: false,
    analytics: true, // advanced analytics
    prioritySupport: false,
    websiteBuilder: false,
    stripePriceId: 'price_maker_monthly', // Replace with actual Stripe price ID
    isActive: true
  },
  {
    name: 'STUDIO',
    displayName: 'Studio',
    price: 3000, // $30.00 in cents
    currency: 'USD',
    features: [
      'Everything in Maker plus',
      'Website builder',
      'Email marketing',
      'Priority search placement',
      'Team access',
      'Advanced integration (Pinterest, IG, Google Shopping)',
      'Advanced CRM',
      'Material forecasting',
      'Profit and expenses tracking (pricing calculator integrated with product will also work with material forecasting)'
    ],
    customDomain: true,
    analytics: true, // advanced analytics
    prioritySupport: true,
    websiteBuilder: true,
    stripePriceId: 'price_studio_monthly', // Replace with actual Stripe price ID
    isActive: true
  },
  {
    name: 'MAKER_FREE',
    displayName: 'Maker (Free)',
    price: 0, // $0.00 in cents - Free Maker plan
    currency: 'USD',
    features: [
      'Everything in Starter plus',
      '8% commission fee instead of 10%',
      'Advanced analytics',
      'SEO assistance',
      'Basic CRM (track repeat buyers)',
      'Digital product stamping + licensing options'
    ],
    customDomain: false,
    analytics: true, // advanced analytics
    prioritySupport: false,
    websiteBuilder: false,
    stripePriceId: null, // Free plan - no Stripe price ID needed
    isActive: true
  },
  {
    name: 'STUDIO_FREE',
    displayName: 'Studio (Free)',
    price: 0, // $0.00 in cents - Free Studio plan
    currency: 'USD',
    features: [
      'Everything in Maker plus',
      'Website builder',
      'Email marketing',
      'Priority search placement',
      'Team access',
      'Advanced integration (Pinterest, IG, Google Shopping)',
      'Advanced CRM',
      'Material forecasting',
      'Profit and expenses tracking (pricing calculator integrated with product will also work with material forecasting)'
    ],
    customDomain: true,
    analytics: true, // advanced analytics
    prioritySupport: true,
    websiteBuilder: true,
    stripePriceId: null, // Free plan - no Stripe price ID needed
    isActive: true
  }
]

async function seedSubscriptionPlans() {
  try {
    console.log('🌱 Seeding subscription plans...')

    for (const plan of subscriptionPlans) {
      await prisma.subscriptionPlan.upsert({
        where: { name: plan.name },
        update: plan,
        create: plan
      })
      console.log(`✅ Created/updated ${plan.displayName} plan`)
    }

    console.log('🎉 Subscription plans seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedSubscriptionPlans()


