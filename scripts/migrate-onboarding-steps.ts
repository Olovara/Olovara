import { prisma } from "@/lib/prisma";
import { initializeOnboardingSteps, updateOnboardingStep } from "@/lib/onboarding";

/**
 * Migration script to transition from boolean onboarding fields to OnboardingStep system
 * This script should be run after the database schema has been updated
 */
async function migrateOnboardingSteps() {
  console.log("Starting onboarding steps migration...");

  try {
    // Get all sellers
    const sellers = await prisma.seller.findMany({
      select: {
        id: true,
        userId: true,
        applicationAccepted: true,
        shopName: true,
        stripeConnected: true,
        // Note: shopProfileComplete and shippingProfileCreated are now removed from schema
        // We'll infer these from other data
        products: {
          select: { id: true },
          take: 1 // Just check if they have any products
        },
        shippingProfiles: {
          select: { id: true },
          take: 1 // Just check if they have any shipping profiles
        }
      }
    });

    console.log(`Found ${sellers.length} sellers to migrate`);

    for (const seller of sellers) {
      console.log(`Migrating seller ${seller.id}...`);

      // Initialize onboarding steps for this seller
      await initializeOnboardingSteps(seller.id);

      // Map existing data to onboarding steps - updated to match new flow
      const stepUpdates: Record<string, boolean> = {};

      // Application submitted - if they have a seller record, they submitted an application
      stepUpdates["application_submitted"] = true;

      // Application approved - use the existing applicationAccepted field
      stepUpdates["application_approved"] = seller.applicationAccepted;

      // Shop preferences - infer from shop country and currency (basic setup)
      // This is a simplified mapping - you may want to adjust based on your logic
      stepUpdates["shop_preferences"] = seller.applicationAccepted; // Assume completed if approved

      // Shop naming - if they have a shop name, this step is complete
      stepUpdates["shop_naming"] = !!seller.shopName;

      // Payment setup - use the existing stripeConnected field
      stepUpdates["payment_setup"] = seller.stripeConnected;

      // Update all steps for this seller
      for (const [stepKey, completed] of Object.entries(stepUpdates)) {
        if (completed) {
          await updateOnboardingStep(seller.id, stepKey as any, true);
        }
      }

      console.log(`Completed migration for seller ${seller.id}`);
    }

    console.log("Onboarding steps migration completed successfully!");

    // Print summary statistics
    const totalSellers = await prisma.seller.count();
    const fullyActivatedSellers = await prisma.seller.count({
      where: { isFullyActivated: true }
    });

    console.log(`\nMigration Summary:`);
    console.log(`Total sellers: ${totalSellers}`);
    console.log(`Fully activated sellers: ${fullyActivatedSellers}`);
    console.log(`Activation rate: ${Math.round((fullyActivatedSellers / totalSellers) * 100)}%`);

  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

/**
 * Rollback function to revert the migration (if needed)
 */
async function rollbackOnboardingSteps() {
  console.log("Rolling back onboarding steps migration...");

  try {
    // Delete all onboarding steps
    await prisma.onboardingStep.deleteMany({});
    
    // Reset isFullyActivated to false for all sellers
    await prisma.seller.updateMany({
      data: { isFullyActivated: false }
    });

    console.log("Rollback completed successfully!");
  } catch (error) {
    console.error("Rollback failed:", error);
    throw error;
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  const command = process.argv[2];

  if (command === "rollback") {
    rollbackOnboardingSteps()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(error);
        process.exit(1);
      });
  } else {
    migrateOnboardingSteps()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(error);
        process.exit(1);
      });
  }
}

export { migrateOnboardingSteps, rollbackOnboardingSteps };
