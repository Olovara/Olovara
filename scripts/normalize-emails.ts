/**
 * Migration script to normalize all email addresses to lowercase
 * This fixes case-sensitivity issues where users registered with mixed-case emails
 * but can't login with different casing
 * 
 * Run with: ts-node -r tsconfig-paths/register -P scripts/tsconfig.json scripts/normalize-emails.ts
 */

import { db } from "@/lib/db";

/**
 * Normalize email to lowercase and trim whitespace
 */
function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  return email.trim().toLowerCase();
}

async function normalizeEmails() {
  try {
    console.log("🔄 Starting email normalization migration...\n");

    // Step 1: Find all users with emails
    const allUsers = await db.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
      },
    }).then(users => users.filter(user => user.email !== null));

    console.log(`📊 Found ${allUsers.length} users with emails\n`);

    // Step 2: Check for duplicate emails after normalization
    const emailMap = new Map<string, string[]>(); // normalized email -> array of user IDs
    
    for (const user of allUsers) {
      if (!user.email) continue;
      
      const normalized = normalizeEmail(user.email);
      if (!normalized) continue;
      
      if (!emailMap.has(normalized)) {
        emailMap.set(normalized, []);
      }
      emailMap.get(normalized)!.push(user.id);
    }

    // Find duplicates (same normalized email, different user IDs)
    const duplicates: Array<{ email: string; userIds: string[] }> = [];
    emailMap.forEach((userIds, email) => {
      if (userIds.length > 1) {
        duplicates.push({ email, userIds });
      }
    });

    if (duplicates.length > 0) {
      console.log("⚠️  WARNING: Found duplicate emails (same email with different casing):");
      for (const dup of duplicates) {
        console.log(`   - ${dup.email}: ${dup.userIds.length} users`);
        // Get usernames for these users
        const users = await db.user.findMany({
          where: { id: { in: dup.userIds } },
          select: { id: true, username: true, email: true },
        });
        for (const user of users) {
          console.log(`     • User ID: ${user.id}, Username: ${user.username || 'N/A'}, Email: ${user.email}`);
        }
      }
      console.log("\n❌ Cannot proceed with migration due to duplicate emails.");
      console.log("   Please manually resolve these duplicates first.\n");
      return;
    }

    // Step 3: Update users
    let updatedUsers = 0;
    let skippedUsers = 0;

    for (const user of allUsers) {
      if (!user.email) continue;

      const normalized = normalizeEmail(user.email);
      if (!normalized) continue;

      // Skip if already normalized
      if (user.email === normalized) {
        skippedUsers++;
        continue;
      }

      try {
        await db.user.update({
          where: { id: user.id },
          data: { email: normalized },
        });
        console.log(`✅ Updated user ${user.id} (${user.username || 'N/A'}): "${user.email}" → "${normalized}"`);
        updatedUsers++;
      } catch (error) {
        console.error(`❌ Failed to update user ${user.id}:`, error);
      }
    }

    console.log(`\n📈 User email normalization complete:`);
    console.log(`   - Updated: ${updatedUsers}`);
    console.log(`   - Already normalized: ${skippedUsers}`);

    // Step 4: Update verification tokens
    console.log("\n🔄 Normalizing verification tokens...");
    const verificationTokens = await db.verificationToken.findMany().then(
      tokens => tokens.filter(token => token.email !== null)
    );

    let updatedTokens = 0;
    let skippedTokens = 0;

    for (const token of verificationTokens) {
      if (!token.email) continue;

      const normalized = normalizeEmail(token.email);
      if (!normalized) continue;

      if (token.email === normalized) {
        skippedTokens++;
        continue;
      }

      try {
        await db.verificationToken.update({
          where: { id: token.id },
          data: { email: normalized },
        });
        updatedTokens++;
      } catch (error) {
        console.error(`❌ Failed to update verification token ${token.id}:`, error);
      }
    }

    console.log(`✅ Verification tokens: ${updatedTokens} updated, ${skippedTokens} already normalized`);

    // Step 5: Update password reset tokens
    console.log("\n🔄 Normalizing password reset tokens...");
    const passwordResetTokens = await db.passwordResetToken.findMany().then(
      tokens => tokens.filter(token => token.email !== null)
    );

    let updatedResetTokens = 0;
    let skippedResetTokens = 0;

    for (const token of passwordResetTokens) {
      if (!token.email) continue;

      const normalized = normalizeEmail(token.email);
      if (!normalized) continue;

      if (token.email === normalized) {
        skippedResetTokens++;
        continue;
      }

      try {
        await db.passwordResetToken.update({
          where: { id: token.id },
          data: { email: normalized },
        });
        updatedResetTokens++;
      } catch (error) {
        console.error(`❌ Failed to update password reset token ${token.id}:`, error);
      }
    }

    console.log(`✅ Password reset tokens: ${updatedResetTokens} updated, ${skippedResetTokens} already normalized`);

    // Step 6: Update two-factor tokens
    console.log("\n🔄 Normalizing two-factor tokens...");
    const twoFactorTokens = await db.twoFactorToken.findMany().then(
      tokens => tokens.filter(token => token.email !== null)
    );

    let updated2FATokens = 0;
    let skipped2FATokens = 0;

    for (const token of twoFactorTokens) {
      if (!token.email) continue;

      const normalized = normalizeEmail(token.email);
      if (!normalized) continue;

      if (token.email === normalized) {
        skipped2FATokens++;
        continue;
      }

      try {
        await db.twoFactorToken.update({
          where: { id: token.id },
          data: { email: normalized },
        });
        updated2FATokens++;
      } catch (error) {
        console.error(`❌ Failed to update two-factor token ${token.id}:`, error);
      }
    }

    console.log(`✅ Two-factor tokens: ${updated2FATokens} updated, ${skipped2FATokens} already normalized`);

    // Summary
    console.log("\n✨ Migration completed successfully!");
    console.log(`\n📊 Summary:`);
    console.log(`   - Users: ${updatedUsers} updated, ${skippedUsers} skipped`);
    console.log(`   - Verification tokens: ${updatedTokens} updated, ${skippedTokens} skipped`);
    console.log(`   - Password reset tokens: ${updatedResetTokens} updated, ${skippedResetTokens} skipped`);
    console.log(`   - Two-factor tokens: ${updated2FATokens} updated, ${skipped2FATokens} skipped`);

  } catch (error) {
    console.error("❌ Error during migration:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Run the migration
normalizeEmails();

