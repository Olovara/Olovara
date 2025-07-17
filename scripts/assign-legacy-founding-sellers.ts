#!/usr/bin/env tsx

import { db } from "../lib/db";
import { assignLegacyFoundingSellerStatus } from "../lib/founding-seller";

/**
 * Script to assign legacy founding seller status to existing sellers
 * Run this script to give founding seller benefits to existing sellers
 * without counting them against the 50-seller limit
 */

async function assignLegacyFoundingSellers() {
  console.log("🚀 Starting legacy founding seller assignment...");

  try {
    // Get all existing sellers who are not already founding sellers
    const existingSellers = await db.seller.findMany({
      where: {
        isFoundingSeller: false,
        applicationAccepted: true // Only consider approved sellers
      },
      select: {
        userId: true,
        shopName: true,
        createdAt: true,
        totalProducts: true,
        user: {
          select: {
            email: true,
            username: true
          }
        }
      },
      orderBy: { createdAt: 'asc' } // Oldest first
    });

    console.log(`Found ${existingSellers.length} existing sellers who could be assigned legacy founding seller status`);

    if (existingSellers.length === 0) {
      console.log("No existing sellers found to assign legacy status to.");
      return;
    }

    // Display the sellers that will be assigned legacy status
    console.log("\n📋 Sellers to be assigned legacy founding seller status:");
    existingSellers.forEach((seller, index) => {
      console.log(`${index + 1}. ${seller.shopName} (${seller.user.email}) - Created: ${seller.createdAt.toLocaleDateString()} - Products: ${seller.totalProducts}`);
    });

    // Ask for confirmation
    console.log("\n⚠️  This will assign legacy founding seller status to ALL the above sellers.");
    console.log("Legacy founding sellers get benefits but don't count against the 50-seller limit.");
    
    // In a real script, you'd ask for user confirmation here
    // For now, we'll proceed automatically
    console.log("\n✅ Proceeding with assignment...");

    let successCount = 0;
    let errorCount = 0;

    for (const seller of existingSellers) {
      try {
        const result = await assignLegacyFoundingSellerStatus(seller.userId);
        
        if (result.success) {
          console.log(`✅ Successfully assigned legacy status to ${seller.shopName} (${seller.user.email})`);
          successCount++;
        } else {
          console.log(`❌ Failed to assign legacy status to ${seller.shopName}: ${result.error}`);
          errorCount++;
        }
      } catch (error) {
        console.log(`❌ Error assigning legacy status to ${seller.shopName}:`, error);
        errorCount++;
      }
    }

    console.log(`\n🎉 Assignment complete!`);
    console.log(`✅ Successfully assigned: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);

    // Verify the results
    const legacyCount = await db.seller.count({
      where: {
        isFoundingSeller: true,
        foundingSellerType: "LEGACY"
      }
    });

    console.log(`\n📊 Current legacy founding sellers: ${legacyCount}`);

  } catch (error) {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }
}

// Function to assign legacy status to specific sellers by email
async function assignLegacyToSpecificSellers(emails: string[]) {
  console.log(`🚀 Assigning legacy founding seller status to specific sellers: ${emails.join(", ")}`);

  try {
    let successCount = 0;
    let errorCount = 0;

    for (const email of emails) {
      try {
        // Find the user by email
        const user = await db.user.findUnique({
          where: { email },
          select: { id: true }
        });

        if (!user) {
          console.log(`❌ User not found with email: ${email}`);
          errorCount++;
          continue;
        }

        // Check if they're a seller
        const seller = await db.seller.findUnique({
          where: { userId: user.id },
          select: { shopName: true, isFoundingSeller: true }
        });

        if (!seller) {
          console.log(`❌ User ${email} is not a seller`);
          errorCount++;
          continue;
        }

        if (seller.isFoundingSeller) {
          console.log(`⚠️  Seller ${email} already has founding seller status`);
          continue;
        }

        const result = await assignLegacyFoundingSellerStatus(user.id);
        
        if (result.success) {
          console.log(`✅ Successfully assigned legacy status to ${seller.shopName} (${email})`);
          successCount++;
        } else {
          console.log(`❌ Failed to assign legacy status to ${email}: ${result.error}`);
          errorCount++;
        }
      } catch (error) {
        console.log(`❌ Error assigning legacy status to ${email}:`, error);
        errorCount++;
      }
    }

    console.log(`\n🎉 Assignment complete!`);
    console.log(`✅ Successfully assigned: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);

  } catch (error) {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length > 0 && args[0] === '--specific') {
    // Assign to specific sellers by email
    const emails = args.slice(1);
    if (emails.length === 0) {
      console.log("❌ Please provide email addresses after --specific");
      console.log("Usage: tsx scripts/assign-legacy-founding-sellers.ts --specific email1@example.com email2@example.com");
      process.exit(1);
    }
    await assignLegacyToSpecificSellers(emails);
  } else {
    // Assign to all existing sellers
    await assignLegacyFoundingSellers();
  }
}

// Run the script
if (require.main === module) {
  main()
    .then(() => {
      console.log("\n✨ Script completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Script failed:", error);
      process.exit(1);
    });
} 