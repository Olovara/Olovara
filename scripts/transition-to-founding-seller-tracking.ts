#!/usr/bin/env tsx

/**
 * Script to transition from temporary legacy founding seller assignment
 * to proper founding seller tracking based on first product creation.
 * 
 * Run this script when you're ready to start tracking founding sellers
 * based on their first product creation date.
 */

import { db } from "@/lib/db";
import { checkFoundingSellerEligibility, assignFoundingSellerStatus } from "@/lib/founding-seller";

async function transitionToFoundingSellerTracking() {
  console.log("🚀 Starting transition to proper founding seller tracking...");
  
  try {
    // Step 1: Get all legacy founding sellers
    const legacySellers = await db.seller.findMany({
      where: {
        isFoundingSeller: true,
        foundingSellerType: "LEGACY"
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        products: {
          select: {
            id: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'asc'
          },
          take: 1 // Get only the first product
        }
      }
    });

    console.log(`📊 Found ${legacySellers.length} legacy founding sellers`);

    // Step 2: Process each legacy seller
    let processedCount = 0;
    let eligibleCount = 0;
    let ineligibleCount = 0;

    for (const seller of legacySellers) {
      console.log(`\n👤 Processing seller: ${seller.user.username} (${seller.user.email})`);
      
      // Check if they have created any products
      if (seller.products.length === 0) {
        console.log(`   ❌ No products created - keeping as legacy`);
        ineligibleCount++;
        continue;
      }

      const firstProduct = seller.products[0];
      console.log(`   ✅ Has products - first product created: ${firstProduct.createdAt}`);

      // Check eligibility for new founding seller status
      const eligibility = await checkFoundingSellerEligibility(seller.userId);
      
      if (eligibility.eligible) {
        console.log(`   🎉 Eligible for new founding seller status (position ${eligibility.currentCount + 1})`);
        
        // Assign new founding seller status
        const result = await assignFoundingSellerStatus(seller.userId, firstProduct.createdAt);
        
        if (result.success) {
          console.log(`   ✅ Successfully assigned new founding seller status`);
          eligibleCount++;
        } else {
          console.log(`   ❌ Failed to assign status: ${result.error}`);
        }
      } else {
        console.log(`   ❌ Not eligible: ${eligibility.reason}`);
        ineligibleCount++;
      }

      processedCount++;
    }

    // Step 3: Summary
    console.log(`\n📈 Transition Summary:`);
    console.log(`   Total processed: ${processedCount}`);
    console.log(`   Eligible for new status: ${eligibleCount}`);
    console.log(`   Kept as legacy: ${ineligibleCount}`);

    // Step 4: Update the seller application action
    console.log(`\n🔧 Next Steps:`);
    console.log(`1. Update actions/seller-application.ts to remove temporary legacy assignment`);
    console.log(`2. Implement proper founding seller logic in product creation`);
    console.log(`3. Test the new flow with a few new sellers`);

  } catch (error) {
    console.error("❌ Error during transition:", error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  transitionToFoundingSellerTracking()
    .then(() => {
      console.log("\n✅ Transition completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Transition failed:", error);
      process.exit(1);
    });
}

export { transitionToFoundingSellerTracking }; 