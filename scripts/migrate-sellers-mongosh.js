// MongoDB shell script to migrate legacy sellers to STARTER subscription
// Run this in MongoDB Compass's mongosh console

// Step 1: Get the STARTER subscription plan
const starterPlan = db.SubscriptionPlan.findOne({ name: "STARTER" });

if (!starterPlan) {
  print("❌ ERROR: STARTER subscription plan not found!");
  print("Please seed subscription plans first.");
  throw new Error("STARTER plan not found");
}

print("✅ Found STARTER plan: " + starterPlan._id);
print("📋 Plan details: " + starterPlan.displayName);

// Step 2: Find all sellers that don't have a subscription
// Get all seller IDs that have subscriptions
const sellersWithSubscriptions = db.SellerSubscription.distinct("sellerId");

// Find sellers without subscriptions
const sellersWithoutSubscriptions = db.Seller.find({
  _id: { $nin: sellersWithSubscriptions }
}).toArray();

print("\n📊 Found " + sellersWithoutSubscriptions.length + " sellers without subscription records");

if (sellersWithoutSubscriptions.length === 0) {
  print("✅ All sellers already have subscription records!");
} else {
  // Step 3: Create subscription records for each seller
  let successCount = 0;
  let errorCount = 0;

  sellersWithoutSubscriptions.forEach((seller) => {
    try {
      // Create subscription document
      const subscription = {
        sellerId: seller._id,
        planId: starterPlan._id,
        status: "ACTIVE",
        currentPeriodStart: seller.createdAt || new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        stripeSubscriptionId: "free_" + seller._id.toString(), // Unique placeholder for free plans
        websiteSlug: "no_website_" + seller._id.toString(), // Unique placeholder for non-STUDIO plans
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Insert the subscription
      db.SellerSubscription.insertOne(subscription);

      successCount++;
      print("✅ Created subscription for seller: " + seller.shopName + " (" + seller._id + ")");
    } catch (error) {
      errorCount++;
      print("❌ Failed to create subscription for seller " + seller.shopName + ": " + error.message);
    }
  });

  print("\n🎉 Migration completed!");
  print("✅ Successfully migrated: " + successCount + " sellers");
  print("❌ Failed migrations: " + errorCount + " sellers");

  if (errorCount > 0) {
    print("\n⚠️  Some sellers failed to migrate. Please check the errors above.");
  }
}
