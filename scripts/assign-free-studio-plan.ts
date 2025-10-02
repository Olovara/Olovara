import { PrismaClient } from '@prisma/client'
import { assignFreeStudioPlan } from '../lib/subscription-helpers'

const prisma = new PrismaClient()

/**
 * Script to assign a free Studio plan to a specific seller
 * Usage: npx tsx scripts/assign-free-studio-plan.ts <sellerId>
 */
async function assignFreeStudioToSeller(sellerId: string) {
  try {
    console.log(`🔄 Assigning free Studio plan to seller: ${sellerId}`)

    // Check if seller exists
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      select: {
        id: true,
        shopName: true,
        user: {
          select: {
            email: true,
            username: true
          }
        }
      }
    })

    if (!seller) {
      throw new Error(`Seller with ID ${sellerId} not found`)
    }

    console.log(`📊 Found seller: ${seller.shopName} (${seller.user.email})`)

    // Assign the free Studio plan
    const subscription = await assignFreeStudioPlan(sellerId)

    console.log(`✅ Successfully assigned free Studio plan to ${seller.shopName}`)
    console.log(`📋 Subscription ID: ${subscription.id}`)
    console.log(`📅 Valid until: ${subscription.currentPeriodEnd.toISOString()}`)

  } catch (error) {
    console.error('❌ Failed to assign free Studio plan:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get seller ID from command line arguments
const sellerId = process.argv[2]

if (!sellerId) {
  console.error('❌ Please provide a seller ID as an argument')
  console.log('Usage: npx tsx scripts/assign-free-studio-plan.ts <sellerId>')
  process.exit(1)
}

assignFreeStudioToSeller(sellerId)
