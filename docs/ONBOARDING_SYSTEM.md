# Onboarding System Documentation

## Overview

The onboarding system has been overhauled to use a flexible `OnboardingStep` table instead of rigid boolean fields. This provides better analytics, flexibility to change steps, and future-proofs the system.

## Key Changes

### Before (Old System)
- Used boolean fields in the `Seller` model: `shopProfileComplete`, `shippingProfileCreated`
- `isFullyActivated` was manually toggled
- Rigid and hard to modify

### After (New System)
- Uses `OnboardingStep` table with flexible step tracking
- `isFullyActivated` is calculated automatically based on completed steps
- Easy to add, remove, or modify steps
- Better analytics and tracking
- **Aligned with existing SellerOnboardingDashboard flow**

## Database Schema

### OnboardingStep Model
```prisma
model OnboardingStep {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  sellerId    String
  stepKey     String   // e.g., "application_submitted"
  completed   Boolean  @default(false)
  completedAt DateTime?
  seller      Seller   @relation(fields: [sellerId], references: [id], onDelete: Cascade)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([sellerId, stepKey]) // Ensure one record per step per seller
  @@index([sellerId])
  @@index([stepKey])
  @@index([completed])
}
```

### Required Steps (Updated)
The system now defines these required steps for full activation, aligned with the existing dashboard:
1. `application_submitted` - Seller application submitted
2. `application_approved` - Application reviewed and approved
3. `shop_preferences` - Shop setup (country, currency, preferences)
4. `shop_naming` - Shop name and branding configured
5. `payment_setup` - Stripe account connected for payments

**Note**: Product creation is no longer a required step since sellers can create products whenever they want.

## Core Functions

### `lib/onboarding.ts`

#### `checkIsFullyActivated(sellerId: string): Promise<boolean>`
Checks if all required onboarding steps are completed.

#### `updateOnboardingStep(sellerId: string, stepKey: OnboardingStepKey, completed: boolean): Promise<void>`
Updates a specific onboarding step and recalculates `isFullyActivated`.

#### `getSellerOnboardingSteps(sellerId: string): Promise<OnboardingStepData[]>`
Gets all onboarding steps for a seller with their completion status.

#### `getOnboardingProgress(sellerId: string): Promise<number>`
Returns completion percentage (0-100).

#### `getNextOnboardingStep(sellerId: string): Promise<OnboardingStepKey | null>`
Returns the next incomplete step, or null if all steps are complete.

#### `initializeOnboardingSteps(sellerId: string): Promise<void>`
Creates initial onboarding step records for a new seller.

## React Integration

### Hook: `useOnboarding()`
```typescript
const { 
  steps, 
  progress, 
  nextStep, 
  isFullyActivated, 
  isLoading, 
  updateStep, 
  refreshSteps 
} = useOnboarding();
```

### Hook: `useOnboardingProgress()`
```typescript
const { 
  progress, 
  isLoading, 
  getStepStatus, 
  getCompletedStepsCount, 
  getTotalStepsCount 
} = useOnboardingProgress();
```

## API Endpoints

### GET `/api/seller/onboarding`
Returns current onboarding status:
```json
{
  "steps": [
    {
      "stepKey": "application_submitted",
      "completed": true,
      "completedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "progress": 50,
  "nextStep": "payment_setup",
  "isFullyActivated": false
}
```

### POST `/api/seller/onboarding`
Updates an onboarding step:
```json
{
  "stepKey": "payment_setup",
  "completed": true
}
```

## Components

### `OnboardingProgress`
Displays full onboarding progress with step details. Uses the same step configuration as the existing `SellerOnboardingDashboard`.

### `OnboardingProgressCompact`
Compact version for smaller displays.

## Migration

### Prerequisites
Before running the migration, you need to:

1. **Update the database schema**:
   ```bash
   npx prisma db push
   ```

2. **Regenerate the Prisma client**:
   ```bash
   npx prisma generate
   ```

### Running the Migration
```bash
# Run the migration script
npx tsx scripts/migrate-onboarding-steps.ts

# Rollback if needed
npx tsx scripts/migrate-onboarding-steps.ts rollback
```

### What the Migration Does
1. Creates `OnboardingStep` records for all existing sellers
2. Maps existing data to appropriate steps:
   - `applicationAccepted` → `application_approved`
   - `shopName` → `shop_naming`
   - `stripeConnected` → `payment_setup`
   - Application approval → `shop_preferences` (simplified mapping)
3. Recalculates `isFullyActivated` for all sellers

## Usage Examples

### Updating a Step
```typescript
import { updateOnboardingStep } from "@/lib/onboarding";

// When a seller completes payment setup
await updateOnboardingStep(sellerId, "payment_setup", true);
```

### Checking Activation Status
```typescript
import { checkIsFullyActivated } from "@/lib/onboarding";

const isActivated = await checkIsFullyActivated(sellerId);
if (isActivated) {
  // Seller can now sell
}
```

### In React Components
```typescript
import { useOnboarding } from "@/hooks/use-onboarding";

function SellerDashboard() {
  const { progress, nextStep, updateStep } = useOnboarding();
  
  const handlePaymentSetup = async () => {
    await updateStep("payment_setup", true);
  };
  
  return (
    <div>
      <OnboardingProgress />
      {nextStep === "payment_setup" && (
        <button onClick={handlePaymentSetup}>
          Set Up Payments
        </button>
      )}
    </div>
  );
}
```

## Integration with Existing Dashboard

The new system is designed to work alongside the existing `SellerOnboardingDashboard`. The step names and flow are aligned, so you can:

1. **Use the new system for data management** - Track steps in the database
2. **Keep the existing UI** - The dashboard already has the right flow
3. **Gradually migrate** - Update the dashboard to use the new hooks when ready

## Adding New Steps

To add a new onboarding step:

1. **Update the required steps array** in `lib/onboarding.ts`:
```typescript
export const REQUIRED_ONBOARDING_STEPS = [
  "application_submitted",
  "application_approved", 
  "shop_preferences",
  "shop_naming",
  "payment_setup",
  "new_step" // Add your new step
] as const;
```

2. **Add step configuration** in `components/onboarding/OnboardingProgress.tsx`:
```typescript
const STEP_CONFIG: Record<string, { title: string; description: string }> = {
  // ... existing steps
  new_step: {
    title: "New Step",
    description: "Description of the new step"
  }
};
```

3. **Update the API validation** in `app/api/seller/onboarding/route.ts`:
```typescript
const validStepKeys = [
  // ... existing keys
  "new_step"
];
```

## Benefits

1. **Flexibility**: Easy to add, remove, or modify onboarding steps
2. **Analytics**: Track completion times, abandonment rates, etc.
3. **Future-proof**: System can evolve without database migrations
4. **Better UX**: Clear progress indication and next step guidance
5. **Maintainability**: Centralized logic and consistent behavior
6. **Alignment**: Works with existing dashboard flow

## Troubleshooting

### Common Issues

1. **Prisma errors**: Make sure to run `npx prisma generate` after schema changes
2. **Steps not updating**: Ensure you're calling `updateOnboardingStep()` with the correct parameters
3. **Progress not calculating**: Check that all required steps are defined in `REQUIRED_ONBOARDING_STEPS`
4. **API errors**: Verify the step key is included in the `validStepKeys` array

### Debugging

Use the migration script to check current status:
```bash
npx tsx scripts/migrate-onboarding-steps.ts
```

Check individual seller progress:
```typescript
import { getSellerOnboardingSteps } from "@/lib/onboarding";

const steps = await getSellerOnboardingSteps(sellerId);
console.log("Seller steps:", steps);
```
