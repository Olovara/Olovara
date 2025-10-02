import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Migration script to create subscription records for existing sellers
 * who don't have subscription records (legacy sellers)
 */
async function migrateSellersToSubscriptions() {
  try {
    console.log('🔄 Starting migration of sellers to subscription system...')

    // Get the STARTER plan
    const starterPlan = await prisma.subscriptionPlan.findUnique({
      where: { name: 'STARTER' }
    })

    if (!starterPlan) {
      throw new Error('STARTER subscription plan not found. Please seed subscription plans first.')
    }

    // Find all sellers without subscription records
    const sellersWithoutSubscriptions = await prisma.seller.findMany({
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

    console.log(`📊 Found ${sellersWithoutSubscriptions.length} sellers without subscription records`)

    if (sellersWithoutSubscriptions.length === 0) {
      console.log('✅ All sellers already have subscription records!')
      return
    }

    // Create subscription records for each seller
    let successCount = 0
    let errorCount = 0

    for (const seller of sellersWithoutSubscriptions) {
      try {
        await prisma.sellerSubscription.create({
          data: {
            sellerId: seller.id,
            planId: starterPlan.id,
            status: 'ACTIVE',
            currentPeriodStart: seller.createdAt, // Use seller creation date as start
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            // No stripeSubscriptionId for free plan
            // No trialEndsAt for free plan
          }
        })

        successCount++
        console.log(`✅ Created subscription for seller: ${seller.shopName} (${seller.id})`)
      } catch (error) {
        errorCount++
        console.error(`❌ Failed to create subscription for seller ${seller.shopName}:`, error)
      }
    }

    console.log(`\n🎉 Migration completed!`)
    console.log(`✅ Successfully migrated: ${successCount} sellers`)
    console.log(`❌ Failed migrations: ${errorCount} sellers`)

    if (errorCount > 0) {
      console.log('\n⚠️  Some sellers failed to migrate. Please check the errors above.')
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
migrateSellersToSubscriptions()
