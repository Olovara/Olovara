# Username and Email Potential Issues

## ✅ Fixed Issues

### 1. Email Case Sensitivity
**Status:** ✅ Fixed
- Emails are now normalized to lowercase before storage and lookup
- All email lookups use normalized emails
- Migration script normalizes existing emails

## ⚠️ Potential Issues

### 2. Username Case Sensitivity
**Problem:** Usernames are NOT normalized. The schema allows both uppercase and lowercase (`/^[a-zA-Z0-9_-]+$/`), and `getUserByUsername` doesn't normalize.

**Impact:**
- MongoDB unique constraint IS case-sensitive, so "User" and "user" can't both exist
- However, if someone tries to register with "User" and it's taken as "user", the lookup might not find it correctly
- Users might get confusing "username already taken" errors even when searching with different casing

**Recommendation:** Normalize usernames to lowercase (or enforce lowercase in validation)

### 3. Username Whitespace
**Problem:** Usernames are NOT trimmed before storage or lookup.

**Impact:**
- If someone enters " user " (with spaces), it will be stored with spaces
- This could cause:
  - Username lookup failures
  - Display issues
  - Confusion for users

**Current State:** Schema validation allows spaces in the regex, but they shouldn't be stored

**Recommendation:** Trim usernames before storage and validation

### 4. Email Not Normalized in Profile Lookup
**Problem:** In `app/api/user/profile/route.ts`, the email from `session.user.email` is used directly without normalization.

**Impact:**
- If session email has different casing than stored email, lookup will fail
- User won't be able to view/update their profile

**Location:** `app/api/user/profile/route.ts:41`

**Recommendation:** Normalize email before lookup

### 5. Username Not Normalized in Registration
**Problem:** Username is stored as-is without trimming or case normalization.

**Impact:**
- Inconsistent username storage
- Potential duplicate username issues with different casing
- Whitespace issues

**Location:** `actions/register.ts:336`

**Recommendation:** Normalize username (trim + lowercase) before storage

### 6. OAuth Username Generation
**Problem:** Need to verify how OAuth handles username generation when creating accounts.

**Impact:**
- Potential username conflicts
- Inconsistent username formats

**Status:** ⚠️ Needs investigation

## 🔍 Recommendations

1. **Normalize usernames to lowercase** - Similar to emails
2. **Trim whitespace** from usernames before storage
3. **Update profile route** to normalize email before lookup
4. **Add username normalization** to registration
5. **Create migration script** to normalize existing usernames (if needed)

