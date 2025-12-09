/**
 * Migration script to update existing orders with userId: "guest" to userId: null
 * This supports the schema change where userId is now optional for guest checkouts
 * 
 * Run this script after running: npx prisma migrate dev
 */

import { db } from "@/lib/db";

async function migrateGuestOrders() {
  try {
    console.log("🔄 Starting migration of guest orders...");

    // Update orders with userId: "guest" to userId: null
    const result = await db.order.updateMany({
      where: {
        userId: "guest",
      },
      data: {
        userId: null,
      },
    });

    console.log(`✅ Updated ${result.count} orders from "guest" to null`);

    // Also update DiscountCodeUsage records
    const discountResult = await db.discountCodeUsage.updateMany({
      where: {
        userId: "guest",
      },
      data: {
        userId: null,
      },
    });

    console.log(`✅ Updated ${discountResult.count} discount code usages from "guest" to null`);

    console.log("✨ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Error during migration:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Run the migration
migrateGuestOrders();

