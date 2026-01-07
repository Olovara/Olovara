/**
 * Migration script to add normalizedUsername field to all existing users
 * This creates a lowercase, trimmed version of usernames for case-insensitive lookups
 * while preserving the original username for display
 * 
 * Run with: ts-node -r tsconfig-paths/register -P scripts/tsconfig.json scripts/normalize-usernames.ts
 * 
 * NOTE: You must run `npx prisma migrate dev` first to add the normalizedUsername field to the schema
 */

import { db } from "@/lib/db";
import { normalizeUsername } from "@/data/user";

async function normalizeUsernames() {
  try {
    console.log("🔄 Starting username normalization migration...\n");

    // Step 1: Find all users with usernames
    const allUsers = await db.user.findMany({
      select: {
        id: true,
        username: true,
        normalizedUsername: true,
      },
    }).then(users => users.filter(user => user.username !== null));

    console.log(`📊 Found ${allUsers.length} users with usernames\n`);

    // Step 2: Check for duplicate normalized usernames
    const normalizedMap = new Map<string, string[]>(); // normalized username -> array of user IDs
    
    for (const user of allUsers) {
      if (!user.username) continue;
      
      const normalized = normalizeUsername(user.username);
      if (!normalized) continue;
      
      if (!normalizedMap.has(normalized)) {
        normalizedMap.set(normalized, []);
      }
      normalizedMap.get(normalized)!.push(user.id);
    }

    // Find duplicates (same normalized username, different user IDs)
    const duplicates: Array<{ normalized: string; userIds: string[] }> = [];
    normalizedMap.forEach((userIds, normalized) => {
      if (userIds.length > 1) {
        duplicates.push({ normalized, userIds });
      }
    });

    if (duplicates.length > 0) {
      console.log("⚠️  WARNING: Found duplicate normalized usernames:");
      for (const dup of duplicates) {
        console.log(`   - "${dup.normalized}": ${dup.userIds.length} users`);
        // Get usernames for these users
        const users = await db.user.findMany({
          where: { id: { in: dup.userIds } },
          select: { id: true, username: true },
        });
        for (const user of users) {
          console.log(`     • User ID: ${user.id}, Username: ${user.username}`);
        }
      }
      console.log("\n❌ Cannot proceed with migration due to duplicate normalized usernames.");
      console.log("   Please manually resolve these duplicates first.\n");
      return;
    }

    // Step 3: Update users
    let updatedUsers = 0;
    let skippedUsers = 0;
    let errors = 0;

    for (const user of allUsers) {
      if (!user.username) continue;

      const normalized = normalizeUsername(user.username);
      if (!normalized) continue;

      // Skip if already normalized and matches
      if (user.normalizedUsername === normalized) {
        skippedUsers++;
        continue;
      }

      try {
        await db.user.update({
          where: { id: user.id },
          data: { normalizedUsername: normalized },
        });
        console.log(`✅ Updated user ${user.id}: "${user.username}" → normalized: "${normalized}"`);
        updatedUsers++;
      } catch (error) {
        console.error(`❌ Failed to update user ${user.id} (${user.username}):`, error);
        errors++;
      }
    }

    console.log(`\n📈 Username normalization complete:`);
    console.log(`   - Updated: ${updatedUsers}`);
    console.log(`   - Already normalized: ${skippedUsers}`);
    if (errors > 0) {
      console.log(`   - Errors: ${errors}`);
    }

    console.log("\n✨ Migration completed successfully!");

  } catch (error) {
    console.error("❌ Error during migration:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Run the migration
normalizeUsernames();

