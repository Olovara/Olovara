/**
 * Migration script to convert shop value boolean fields to array
 * 
 * This script:
 * 1. Reads all sellers using raw query to access old boolean fields (if they exist in DB)
 * 2. Converts boolean fields (where true) to shopValues array format
 * 3. Updates the database with the new array
 * 
 * NOTE: This script uses raw queries to read old boolean fields even if they're
 * removed from the Prisma schema. If the fields don't exist in the database,
 * it will just initialize shopValues as empty arrays.
 * 
 * Run with: npx tsx scripts/migrate-shop-values.ts
 */

import { db } from "@/lib/db";
import { validShopValueIds, ShopValueId } from "@/data/shop-values";

async function migrateShopValues() {
    console.log("Starting shop values migration...");

    try {
        // Use raw query to read old boolean fields (if they still exist in database)
        // This works even if fields are removed from Prisma schema
        // For MongoDB, we use findRaw
        const sellersRaw = await db.seller.findRaw({
            filter: {},
        });
        
        // Type the results properly
        const sellers = (sellersRaw as unknown as Array<{
            _id: { $oid: string } | string;
            isWomanOwned?: boolean;
            isMinorityOwned?: boolean;
            isLGBTQOwned?: boolean;
            isVeteranOwned?: boolean;
            isSustainable?: boolean;
            isCharitable?: boolean;
            shopValues?: string[];
        }>);

        console.log(`Found ${sellers.length} sellers to process`);

        let migrated = 0;
        let skipped = 0;
        let errors = 0;

        for (const seller of sellers) {
            try {
                // Extract MongoDB ObjectId (can be string or { $oid: string })
                let sellerId: string;
                if (typeof seller._id === 'string') {
                    sellerId = seller._id;
                } else if (typeof seller._id === 'object' && seller._id !== null && '$oid' in seller._id) {
                    sellerId = (seller._id as { $oid: string }).$oid;
                } else {
                    sellerId = String(seller._id);
                }
                
                // Get existing shopValues or start with empty array
                const existingValues = (seller.shopValues || []) as string[];
                
                // Build array from boolean fields (only add if true)
                const shopValues: ShopValueId[] = [...existingValues.filter((v): v is ShopValueId => 
                    validShopValueIds.includes(v as ShopValueId)
                )];

                // Add values from boolean fields if they're true
                if (seller.isWomanOwned && !shopValues.includes("isWomanOwned")) {
                    shopValues.push("isWomanOwned");
                }
                if (seller.isMinorityOwned && !shopValues.includes("isMinorityOwned")) {
                    shopValues.push("isMinorityOwned");
                }
                if (seller.isLGBTQOwned && !shopValues.includes("isLGBTQOwned")) {
                    shopValues.push("isLGBTQOwned");
                }
                if (seller.isVeteranOwned && !shopValues.includes("isVeteranOwned")) {
                    shopValues.push("isVeteranOwned");
                }
                if (seller.isSustainable && !shopValues.includes("isSustainable")) {
                    shopValues.push("isSustainable");
                }
                if (seller.isCharitable && !shopValues.includes("isCharitable")) {
                    shopValues.push("isCharitable");
                }

                // Check if we need to update (values changed or need initialization)
                const valuesChanged = 
                    shopValues.length !== existingValues.length ||
                    !shopValues.every(v => existingValues.includes(v));

                if (!valuesChanged && existingValues.length > 0) {
                    skipped++;
                    continue;
                }

                // Update seller with new array format
                await db.seller.update({
                    where: { id: sellerId },
                    data: {
                        shopValues: shopValues,
                    },
                });

                const addedCount = shopValues.length - existingValues.length;
                if (addedCount > 0) {
                    console.log(`✓ Migrated seller ${sellerId}: added ${addedCount} values from boolean fields (total: ${shopValues.length})`);
                } else if (existingValues.length === 0 && shopValues.length === 0) {
                    console.log(`✓ Initialized seller ${sellerId}: set empty array`);
                } else {
                    console.log(`✓ Updated seller ${sellerId}: ${shopValues.length} values`);
                }
                
                migrated++;
            } catch (error) {
                errors++;
                console.error(`✗ Error migrating seller ${seller._id}:`, error);
            }
        }

        console.log("\n=== Migration Summary ===");
        console.log(`Total sellers: ${sellers.length}`);
        console.log(`Migrated: ${migrated}`);
        console.log(`Skipped: ${skipped}`);
        console.log(`Errors: ${errors}`);
        console.log("\nMigration completed!");
    } catch (error) {
        console.error("Fatal error during migration:", error);
        process.exit(1);
    } finally {
        await db.$disconnect();
    }
}

// Run migration
migrateShopValues();

