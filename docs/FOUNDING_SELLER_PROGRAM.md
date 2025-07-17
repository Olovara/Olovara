# Founding Seller Program

## Overview

The Founding Seller Program rewards early adopters with exclusive lifetime benefits. The program is limited to the first 50 sellers who create their first product, plus legacy sellers who are manually assigned.

**Current Status**: Program is **OPEN** - Limited to first 50 sellers who create products

## Program Structure

### Two Types of Founding Sellers

1. **New Founding Sellers**: First 50 sellers who create their first product (numbered 1-50)
2. **Legacy Founding Sellers**: Existing sellers manually assigned by admin (no numbering)

### Automatic Qualification
- Only sellers who **create at least one product** are eligible
- Prevents people from signing up and doing nothing
- First 50 qualifying sellers get automatic founding seller status
- Legacy sellers don't count against the 50-seller limit

## Current Benefits

### 🎯 **Lifetime 8% Commission**
- **Regular sellers**: 10% platform commission
- **Founding sellers**: 8% platform commission (20% reduction)
- **Lifetime benefit** - never expires

### 🚀 **Priority Placement**
- Featured in search results and categories for 1 year
- Higher visibility in marketplace
- Better discoverability for customers

### ⭐ **Showcase Opportunities**
- Featured in blogs, emails, and social media marketing
- Highlighted in promotional campaigns
- Special recognition in marketplace

### 🛠️ **Early Feature Access**
- First access to new platform features
- Beta testing opportunities
- Direct feedback channels to shape the platform

### 🎖️ **Exclusive Badge**
- "Founding Seller" badge displayed on shop profile
- Recognition of early adopter status
- Builds trust with customers

### 📞 **Priority Support**
- Dedicated customer support
- Faster response times
- Direct communication channels

## Seamless Signup Flow

### New User Experience
The signup process has been optimized to eliminate friction and reduce drop-off:

1. **Visit `/sell`** → Landing page with founding seller benefits
2. **Click "Apply Now"** → Auth modal opens (stays on page)
3. **Register/Login** → Seamless modal experience
4. **Email Verification** → Automatic redirect back to `/sell`
5. **Seller Application** → Complete application form
6. **Create First Product** → Automatic founding seller status

### Technical Implementation
- **AuthModal**: Reusable modal with login/register tabs
- **SellPageClient**: Handles auth state and redirects
- **Persistent Intent**: Maintains seller intent throughout process
- **Auto-redirect**: After email verification, returns to seller flow

See [SELLER_SIGNUP_FLOW.md](./SELLER_SIGNUP_FLOW.md) for detailed technical documentation.

## Database Schema

### Seller Model Fields

```prisma
model Seller {
  // ... existing fields ...
  
  // Founding Seller Program
  isFoundingSeller       Boolean @default(false)
  foundingSellerType     String? // "LEGACY" or "NEW"
  foundingSellerNumber   Int? // Position 1-50 for new sellers
  firstProductCreatedAt  DateTime? // When they created first product
  foundingSellerBenefits Json? // Specific benefits granted
}
```

## Implementation Details

### Core Functions (`lib/founding-seller.ts`)

#### `checkFoundingSellerEligibility(sellerId)`
- Checks if seller has created products
- Counts current founding sellers
- Returns eligibility status and current count

#### `assignFoundingSellerStatus(sellerId, firstProductCreatedAt)`
- Assigns founding seller status to new sellers
- Automatically assigns next available number (1-50)
- Sets benefits and timestamps

#### `assignLegacyFoundingSellerStatus(sellerId)`
- Assigns legacy founding seller status
- No number assignment (legacy sellers don't get numbers)
- Same benefit package as new founding sellers

### Product Creation Integration

When a seller creates their first product, the system automatically:

1. Checks if this is their first product
2. If yes, checks founding seller eligibility
3. If eligible, assigns founding seller status
4. Logs the assignment for tracking

### Admin Management

#### Viewing Founding Sellers
- List all new founding sellers (1-50)
- List all legacy founding sellers
- View program statistics and remaining spots

#### Assigning Legacy Status
- Manual assignment to existing sellers
- Script-based bulk assignment
- Individual assignment by email

## Usage Examples

### Assign Legacy Status to Existing Sellers

```bash
# Assign to all existing sellers
tsx scripts/assign-legacy-founding-sellers.ts

# Assign to specific sellers
tsx scripts/assign-legacy-founding-sellers.ts --specific seller1@example.com seller2@example.com
```

### Check Program Status

```typescript
import { isFoundingSellerProgramOpen, getAllFoundingSellers } from '@/lib/founding-seller';

// Check if program is still open
const programOpen = await isFoundingSellerProgramOpen();

// Get all founding sellers
const { newFoundingSellers, legacyFoundingSellers, totalCount } = await getAllFoundingSellers();
```

### Display Status to Sellers

```tsx
import FoundingSellerStatus from '@/components/seller/FoundingSellerStatus';

// In seller dashboard
<FoundingSellerStatus />
```

## Benefits Configuration

### Current Benefits (All Founding Sellers)
```typescript
{
  reducedPlatformFee: 8, // 8% instead of 10% (20% reduction)
  priorityPlacement: true, // Priority placement in search results for 1 year
  prioritySupport: true, // Priority customer support
  earlyAccessFeatures: true, // Early access to new features
  featuredInMarketing: true, // Listing showcased in blogs, emails, social, etc.
  customBadge: "Founding Seller", // Exclusive "Founding Seller" badge
  lifetimeBenefits: true, // These benefits are lifetime
}
```

## Admin Dashboard Integration

### Required Permissions
- `VIEW_FOUNDING_SELLERS`: View founding seller data
- `MANAGE_FOUNDING_SELLERS`: Assign legacy status

### Available Actions
- View all founding sellers
- Assign legacy status to existing sellers
- View program statistics
- Monitor remaining spots

## Monitoring and Analytics

### Key Metrics
- Total founding sellers (new + legacy)
- Spots remaining in program (50 - new sellers)
- Program status (open/closed)
- First product creation dates

### Logging
- All founding seller assignments are logged
- Eligibility checks are logged
- Admin actions are tracked

## Marketing Materials

### Landing Page Copy
- "Join Yarnnu as one of our first 50 founding sellers"
- "Lifetime 8% commission (vs 10% for regular sellers)"
- "Priority placement, early feature access, showcase opportunities"
- "Built by artisans, for artisans"

### Benefits Highlighted
1. **Lifetime 8% Commission** - Lock in 2% savings forever
2. **Priority Placement** - Featured in search for 1 year
3. **Showcase Opportunities** - Featured in marketing campaigns
4. **Early Access** - First to try new features
5. **Exclusive Badge** - Recognition of founding status

## Future Enhancements

### Potential Features
- Founding seller badges on product listings
- Special founding seller events
- Exclusive founding seller marketplace
- Founding seller mentorship program
- Founding seller referral bonuses

### Benefit Expansions
- Custom founding seller themes
- Advanced analytics access
- Priority listing in search results
- Reduced transaction fees
- Early access to new features

## Troubleshooting

### Common Issues

1. **Prisma Client Not Updated**
   - Run `npx prisma generate` after schema changes
   - Restart development server

2. **Permission Errors**
   - Ensure admin has `MANAGE_FOUNDING_SELLERS` permission
   - Check user authentication status

3. **Script Execution Issues**
   - Ensure database connection is working
   - Check that seller emails exist in database

### Debug Commands

```bash
# Check current founding seller count
npx prisma studio

# View founding seller data
SELECT * FROM Seller WHERE isFoundingSeller = true;

# Check program status
node -e "require('./lib/founding-seller').isFoundingSellerProgramOpen().then(console.log)"
```

## Security Considerations

- Founding seller status is stored in database
- Benefits are applied server-side
- Admin actions require proper permissions
- All assignments are logged for audit trail
- No client-side manipulation possible

## Performance Notes

- Founding seller checks happen on product creation
- Status is cached in seller record
- Benefits are stored as JSON for flexibility
- Database indexes on founding seller fields
- Minimal impact on existing product creation flow

## Program Timeline

### Phase 1: Launch (Current)
- First 50 sellers get founding status
- Legacy sellers assigned manually
- Basic benefits package

### Phase 2: Growth
- Program closes when 50 spots filled
- Enhanced benefits for existing founding sellers
- Marketing campaigns featuring founding sellers

### Phase 3: Maturity
- Founding seller community events
- Advanced features and tools
- Long-term loyalty programs 