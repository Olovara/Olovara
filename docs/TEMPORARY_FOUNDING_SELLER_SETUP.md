# Temporary Founding Seller Setup

## Current Status: TEMPORARY LEGACY ASSIGNMENT

**Date**: December 2024  
**Status**: All new sellers are automatically assigned as legacy founding sellers  
**Reason**: Preparing for campaign launch, not ready to track signups yet

## What's Happening Now

### Seller Application Process
When a user submits a seller application, they are automatically assigned:
- `isFoundingSeller: true`
- `foundingSellerType: "LEGACY"`
- `foundingSellerNumber: null`
- `foundingSellerBenefits: FOUNDING_SELLER_BENEFITS`

### Location in Code
```typescript
// actions/seller-application.ts (lines ~100-110)
// Founding Seller Program - TEMPORARY: Mark all new sellers as legacy
// TODO: Remove this after campaign launch and implement proper founding seller logic
// When ready to track signups: remove these lines and implement checkFoundingSellerEligibility
isFoundingSeller: true,
foundingSellerType: "LEGACY",
foundingSellerNumber: null, // Legacy sellers don't get numbers
foundingSellerBenefits: FOUNDING_SELLER_BENEFITS,
```

## Transition Plan

### Phase 1: Campaign Preparation (Current)
- ✅ All new sellers get legacy founding seller status
- ✅ Benefits are applied immediately
- ✅ No tracking of signup order
- ✅ No limit on legacy sellers

### Phase 2: Campaign Launch
**When**: After campaign launch, when ready to track signups

**Actions**:
1. Run transition script: `tsx scripts/transition-to-founding-seller-tracking.ts`
2. Update `actions/seller-application.ts` to remove temporary assignment
3. Implement proper founding seller logic in product creation
4. Test with new sellers

### Phase 3: Proper Tracking
**Implementation**:
- Remove temporary legacy assignment from seller application
- Add founding seller check when first product is created
- Track signup order (1-50) for new founding sellers
- Maintain legacy status for existing sellers

## Benefits During Temporary Period

All sellers (legacy and future new) receive:
- **8% commission** (vs 10% for regular sellers)
- **Priority placement** in search results
- **Showcase opportunities** in marketing
- **Early feature access**
- **Exclusive "Founding Seller" badge**
- **Priority support**

## Migration Script

The transition script (`scripts/transition-to-founding-seller-tracking.ts`) will:

1. **Find all legacy sellers** who have created products
2. **Check eligibility** for new founding seller status
3. **Assign proper numbers** (1-50) to eligible sellers
4. **Keep ineligible sellers** as legacy
5. **Provide summary** of the transition

## When to Transition

**Ready to transition when**:
- Campaign is launched
- Want to start tracking signup order
- Ready to limit to first 50 sellers
- Have tested the founding seller logic

**Not ready if**:
- Still in campaign preparation
- Want all sellers to get founding benefits
- Haven't tested the new flow

## Rollback Plan

If issues arise during transition:
1. **Database backup** before running transition script
2. **Manual reassignment** of legacy status if needed
3. **Revert code changes** in seller application action

## Testing

### Before Transition
- Test seller application flow
- Verify legacy benefits are applied
- Confirm seamless signup experience

### After Transition
- Test new seller signup flow
- Verify founding seller assignment on first product
- Confirm benefits are properly applied
- Test transition script on staging data

## Notes

- **Legacy sellers don't count** against the 50-seller limit
- **Benefits are identical** for legacy and new founding sellers
- **Transition is one-way** - legacy sellers can become new founding sellers
- **No impact on existing functionality** during temporary period 