# Username Normalization - Potential Issues & Solutions

## ⚠️ Critical Issues to Address

### 1. OAuth User Creation
**Problem:** OAuth users created via PrismaAdapter don't automatically get `normalizedUsername` set.

**Impact:** 
- OAuth users won't have `normalizedUsername` populated
- `getUserByUsername()` will fail for OAuth users
- If OAuth users later get a username, it won't be normalized

**Solution:** Add a callback in `auth.ts` to set `normalizedUsername` when OAuth users are created or when username is set.

**Status:** ⚠️ Needs Fix

### 2. Existing Users Without normalizedUsername
**Problem:** After schema migration, existing users won't have `normalizedUsername` until data migration runs.

**Impact:**
- `getUserByUsername()` will return `null` for existing users
- Username lookups will fail until migration completes

**Solution:** 
- Run data migration immediately after schema migration
- Or make `getUserByUsername()` handle missing `normalizedUsername` gracefully (fallback to old behavior)

**Status:** ⚠️ Needs Migration Order

### 3. Migration Order Dependency
**Problem:** Must run migrations in correct order:
1. Schema migration (adds `normalizedUsername` field)
2. Data migration (populates `normalizedUsername` for existing users)

**Impact:** If order is wrong, lookups will fail.

**Solution:** Document migration steps clearly.

**Status:** ⚠️ Needs Documentation

### 4. Duplicate Usernames with Different Casing
**Problem:** If existing users have "User" and "user", migration will detect and stop.

**Impact:** Migration will fail, need manual resolution.

**Solution:** Migration script already handles this - it will stop and report duplicates.

**Status:** ✅ Handled

## ✅ Safe Areas

### 1. Display Components
**Status:** ✅ Safe
- All display components use `user.username` (original field)
- No changes needed

### 2. Username Lookups
**Status:** ✅ Safe
- All lookups go through `getUserByUsername()` 
- No direct queries found using `where: { username }`

### 3. Registration Flow
**Status:** ✅ Safe
- New registrations set both `username` and `normalizedUsername`
- Already implemented

## 🔧 Required Fixes

### Fix 1: OAuth User Creation Hook
Add to `auth.ts` to handle OAuth user creation:

```typescript
events: {
  async signIn({ user, account, profile, isNewUser }) {
    // ... existing code ...
    
    // If new OAuth user, ensure normalizedUsername is set if username exists
    if (isNewUser && user.username) {
      const normalized = user.username.trim().toLowerCase();
      await db.user.update({
        where: { id: user.id },
        data: { normalizedUsername: normalized },
      });
    }
  },
}
```

### Fix 2: Graceful Fallback in getUserByUsername
Update `data/user.ts` to handle missing `normalizedUsername`:

```typescript
export const getUserByUsername = async (username: string) => {
  try {
    const normalizedUsername = normalizeUsername(username);
    if (!normalizedUsername) return null;
    
    // Try normalizedUsername first
    let user = await db.user.findUnique({
      where: { normalizedUsername },
    });
    
    // Fallback: if not found and normalizedUsername is null, try old username field
    // This handles users created before migration
    if (!user) {
      user = await db.user.findFirst({
        where: {
          username: normalizedUsername, // Search by normalized value in old field
          normalizedUsername: null, // Only if normalizedUsername not set
        },
      });
    }
    
    return user;
  } catch {
    return null;
  }
};
```

### Fix 3: Migration Steps Documentation
Create clear migration instructions:

1. **Backup database**
2. **Run schema migration:** `npx prisma migrate dev --name add_normalized_username`
3. **Run data migration:** `yarn migrate:normalize-usernames`
4. **Verify:** Check that all users have `normalizedUsername` set
5. **Deploy**

## 📋 Pre-Migration Checklist

- [ ] Backup database
- [ ] Check for duplicate usernames (different casing)
- [ ] Plan downtime if needed (migration should be fast)
- [ ] Test migration on staging first
- [ ] Verify OAuth user creation works after migration

## 🚨 Post-Migration Verification

- [ ] All existing users have `normalizedUsername` set
- [ ] OAuth signups work correctly
- [ ] Username lookups work for all users
- [ ] Display still shows original usernames
- [ ] No duplicate normalized usernames

