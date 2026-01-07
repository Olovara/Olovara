import { db } from "@/lib/db";

/**
 * Normalize email for consistent lookups (case-insensitive)
 * Emails should always be stored and looked up in lowercase
 */
function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  return email.trim().toLowerCase();
}

export const getUserByEmail = async (email: string) => {
  try {
    // Normalize email to lowercase for case-insensitive lookup
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return null;
    
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });
    return user;
  } catch {
    return null;
  }
};

export const getUserById = async (id: string) => {
  try {
    const user = await db.user.findUnique({
      where: { id },
    });
    return user;
  } catch {
    return null;
  }
};

/**
 * Normalize username for consistent lookups (case-insensitive, trimmed)
 * This creates a lowercase, trimmed version for database lookups
 * while preserving the original username for display
 */
export function normalizeUsername(username: string | null | undefined): string | null {
  if (!username) return null;
  return username.trim().toLowerCase();
}

export const getUserByUsername = async (username: string) => {
  try {
    // Use normalizedUsername field for case-insensitive lookup
    // This allows users to have "User123" displayed but searched as "user123"
    const normalizedUsername = normalizeUsername(username);
    if (!normalizedUsername) return null;
    
    // Try normalizedUsername first (new field)
    let user = await db.user.findUnique({
      where: { normalizedUsername },
    });
    
    // Fallback: if not found and user might not have normalizedUsername yet (pre-migration),
    // try searching by normalized value in the old username field
    // This handles users created before the migration runs
    if (!user) {
      user = await db.user.findFirst({
        where: {
          username: normalizedUsername, // Search by normalized value in old field
          normalizedUsername: null, // Only if normalizedUsername not set yet
        },
      });
    }
    
    return user;
  } catch {
    return null;
  }
};