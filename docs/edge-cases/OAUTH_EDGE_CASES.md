# OAuth Edge Cases & Error Handling

This document outlines potential edge cases and errors in the OAuth authentication system and how they're handled.

## Fixed Issues ✅

### 1. OAuth-Only User Tries Email/Password Login
**Problem:** User signs up with Google OAuth (no password), then tries to log in with email/password.

**Solution:** Added detection in `actions/login.ts` that checks if user exists but has no password. Returns helpful error message directing them to use Google sign-in.

**Status:** ✅ Fixed

### 2. Generic Error Messages
**Problem:** Error page showed generic message for all OAuth errors.

**Solution:** Updated `components/auth/error-card.tsx` to show specific error messages based on error type:
- `OAuthAccountNotLinked`: Email already registered with different method
- `OAuthCallback`: Google sign-in error
- `AccessDenied`: User cancelled sign-in
- `Configuration`: Auth config error
- `Verification`: Email verification failed

**Status:** ✅ Fixed

## Known Edge Cases ⚠️

### 3. Email/Password User Tries Google Sign-In
**Scenario:** User has account with email/password, then tries to sign in with Google using same email.

**Current Behavior:** 
- NextAuth throws `OAuthAccountNotLinked` error
- User sees error message: "Email already in use with a different provider!"
- User must use their original email/password login method

**Why This Is Secure:**
- Prevents account takeover attacks
- If someone knows your email, they can't create a Google account and take over your account
- Forces users to use their original authentication method

**Potential Improvement:** Could add account linking feature (requires password verification for security).

**Status:** ⚠️ Working as designed (secure by default)

### 4. Google OAuth Provider Failure
**Scenario:** Google API is down or returns error during OAuth flow.

**Current Behavior:**
- Error is caught by NextAuth
- User redirected to `/error` page
- Generic error message shown (now improved with specific messages)

**Potential Issues:**
- No retry logic
- No fallback mechanism
- User might not understand what happened

**Recommendation:** Add retry logic and better error logging.

**Status:** ⚠️ Partially handled

### 5. Missing Environment Variables
**Scenario:** `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` not set.

**Current Behavior:**
- App will fail to start or OAuth will fail silently
- No validation on startup

**Recommendation:** Add startup validation to check required env vars.

**Status:** ⚠️ Not handled

### 6. Email Change on Google Account
**Scenario:** User changes email on their Google account after signing up.

**Current Behavior:**
- User's email in database remains the old email
- OAuth will still work (uses Google account ID, not email)
- But user's email in your system won't match their Google email

**Potential Issues:**
- Email notifications might go to wrong address
- User confusion about which email is associated
- Data inconsistency

**Recommendation:** 
- Update user email in database when OAuth sign-in detects email change
- Or prompt user to update email if mismatch detected

**Status:** ⚠️ Not handled

### 7. Session Expiration During OAuth Flow
**Scenario:** User starts OAuth flow, session expires before callback completes.

**Current Behavior:**
- OAuth callback might fail
- User redirected to error page

**Recommendation:** OAuth flow should be stateless (uses OAuth state parameter, not session).

**Status:** ⚠️ Should be handled by NextAuth (verify)

### 8. CSRF Token Issues
**Scenario:** CSRF token missing or invalid during OAuth flow.

**Current Behavior:**
- NextAuth validates CSRF tokens
- If invalid, redirects to error page
- `trustHost: true` is set (required for production behind proxy)

**Status:** ✅ Handled

### 9. Network Timeouts
**Scenario:** Network timeout during OAuth callback.

**Current Behavior:**
- Request fails
- User sees error page

**Recommendation:** Add timeout handling and retry logic.

**Status:** ⚠️ Not specifically handled

### 10. Invalid Callback URLs
**Scenario:** OAuth callback URL is malformed or doesn't match configured redirect URI.

**Current Behavior:**
- Google rejects the callback
- User sees error

**Status:** ⚠️ Handled by Google (rejects invalid callbacks)

### 11. Email Verification for OAuth Users
**Scenario:** OAuth users are auto-verified via `linkAccount` event.

**Current Behavior:**
- ✅ OAuth users are automatically email verified
- ✅ `emailVerified` is set when account is linked

**Status:** ✅ Working correctly

### 12. Multiple OAuth Providers
**Scenario:** User signs up with Google, then tries to add another OAuth provider.

**Current Behavior:**
- NextAuth supports multiple providers
- Each provider creates separate Account record
- All linked to same User record

**Status:** ✅ Supported (if multiple providers added)

## Recommendations for Future Improvements

1. **Add Account Linking Feature**
   - Allow users to link Google account to existing email/password account
   - Require password verification for security
   - Update UI to show linked accounts

2. **Add Environment Variable Validation**
   - Check on app startup
   - Fail fast with clear error message

3. **Improve Error Logging**
   - Log all OAuth errors with context
   - Track error rates
   - Alert on repeated failures

4. **Handle Email Changes**
   - Detect email mismatch on OAuth sign-in
   - Prompt user to update email
   - Or auto-update if email verified by Google

5. **Add Retry Logic**
   - Retry failed OAuth requests
   - Exponential backoff
   - Max retry limit

6. **Better User Guidance**
   - Show which login methods are available for user
   - Guide users to correct login method
   - Clear error messages (already improved)

## Testing Checklist

- [x] OAuth-only user tries email/password login
- [ ] Email/password user tries OAuth with same email
- [ ] Google API failure simulation
- [ ] Missing env vars
- [ ] Email change on Google account
- [ ] Session expiration during OAuth
- [ ] Network timeout
- [ ] Invalid callback URL
- [ ] Multiple OAuth providers

## Related Files

- `actions/login.ts` - Email/password login logic
- `auth.config.ts` - OAuth configuration
- `auth.ts` - NextAuth setup
- `components/auth/error-card.tsx` - Error page
- `components/auth/login-form.tsx` - Login form
- `components/auth/social.tsx` - OAuth buttons

