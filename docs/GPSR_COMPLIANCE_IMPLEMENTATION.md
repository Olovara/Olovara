# GPSR (General Product Safety Regulation) Compliance Implementation

## Overview

This document outlines the implementation of GPSR compliance features for the marketplace to help sellers meet EU General Product Safety Regulation requirements.

## What is GPSR?

The General Product Safety Regulation (GPSR) is an EU regulation that ensures products sold in the EU market are safe for consumers. It requires sellers to provide comprehensive safety information about their products.

## Implementation Details

### 1. Database Schema Changes

#### Prisma Schema (`prisma/schema.prisma`)
Added the following fields to the Product model:

```prisma
// GPSR (General Product Safety Regulation) compliance fields
safetyWarnings    String? // Product safety warnings and precautions
materialsComposition String? // Materials and composition details
safeUseInstructions String? // Instructions for safe use
ageRestriction    String? // Age restrictions if applicable
chokingHazard     Boolean @default(false) // Whether product poses choking hazard
smallPartsWarning Boolean @default(false) // Whether product contains small parts
chemicalWarnings  String? // Chemical-related warnings
careInstructions  String? // Care and maintenance instructions
```

### 2. Validation Schema (`schemas/ProductSchema.ts`)

Added GPSR field validation to both `ProductSchema` and `ProductDraftSchema`:

```typescript
// GPSR compliance fields
safetyWarnings: z.string().max(1000, "Safety warnings must be 1000 characters or less").optional(),
materialsComposition: z.string().max(1000, "Materials composition must be 1000 characters or less").optional(),
safeUseInstructions: z.string().max(1000, "Safe use instructions must be 1000 characters or less").optional(),
ageRestriction: z.string().max(200, "Age restriction must be 200 characters or less").optional(),
chokingHazard: z.boolean().default(false),
smallPartsWarning: z.boolean().default(false),
chemicalWarnings: z.string().max(500, "Chemical warnings must be 500 characters or less").optional(),
careInstructions: z.string().max(1000, "Care instructions must be 1000 characters or less").optional(),
```

### 3. Components

#### GPSRComplianceForm (`components/product/GPSRComplianceForm.tsx`)
A comprehensive form component for sellers to input GPSR compliance information:

- **Safety Warnings**: Text area for safety warnings and precautions
- **Materials & Composition**: Detailed materials information
- **Safe Use Instructions**: Instructions for safe product usage
- **Age Restrictions**: Age-specific warnings
- **Safety Checkboxes**: Choking hazard and small parts warnings
- **Chemical Warnings**: Chemical-related safety information
- **Care Instructions**: Maintenance and care guidelines
- **Help Section**: Expandable help with GPSR requirements

#### GPSRComplianceDisplay (`components/product/GPSRComplianceDisplay.tsx`)
Component to display GPSR information on product pages:

- **Prominent Safety Warnings**: Alert-style display for critical safety information
- **Detailed Information Card**: Comprehensive safety information display
- **Compact Badge**: Minimal display for product cards
- **Visual Indicators**: Icons and badges for different types of warnings

### 4. Utility Functions (`lib/gpsr-compliance.ts`)

#### EU Country Detection
```typescript
export const EU_MEMBER_STATES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
  'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
  'SI', 'ES', 'SE'
];

export const NORTHERN_IRELAND_CODE = 'NI';
export const GPSR_REQUIRED_COUNTRIES = [...EEA_COUNTRIES, NORTHERN_IRELAND_CODE];
```

#### Key Functions
- `isGPSRComplianceRequired()`: Determines if GPSR compliance is required based on shipping destinations
- `validateGPSRCompliance()`: Validates GPSR data completeness
- `getGPSRComplianceSummary()`: Generates compliance summary for display
- `formatBusinessAddress()`: Formats business address for display
- `hasCompleteBusinessAddress()`: Checks if business address is complete

### 5. Enhanced ExcludedCountries Component

Updated `components/shop/ExcludedCountries.tsx` to include EU compliance information:

- **EU Compliant Seller Badge**: Shows when seller has provided EU compliance info
- **Business Address Display**: Shows seller's address for EU compliance
- **Visual Indicators**: Clear indication of EU compliance status

### 6. Enhanced Country Exclusions Form

Created `components/forms/EnhancedCountryExclusionsForm.tsx` that includes:

- **Dynamic Address Fields**: Address fields appear when shipping to EEA countries or Northern Ireland
- **Northern Ireland Support**: Handles Northern Ireland as a separate exclusion option
- **EU Compliance Alerts**: Clear indication when EU compliance is required
- **Business Address Collection**: Uses existing Address model with `isBusinessAddress` flag

### 7. Business Address Actions

Created `actions/businessAddressActions.ts` to handle business address operations:

- **Address Creation/Update**: Creates or updates business addresses using the existing Address model
- **Encryption**: Properly encrypts address data using the existing encryption system
- **Validation**: Validates address data before saving
- **Integration**: Works with the existing Address model structure

## Usage

### For Sellers

1. **Product Creation/Editing**: Include the `GPSRComplianceForm` component in product forms
2. **EU Sales**: If shipping to EU countries, GPSR compliance becomes required
3. **Address Requirement**: Sellers must provide business address for EU compliance

### For Developers

1. **Form Integration**: Add GPSR form to product creation/editing flows
2. **Display Integration**: Add GPSR display to product pages
3. **Validation**: Use GPSR validation functions to ensure compliance
4. **Database Migration**: Run the migration script to add fields to existing products

## Compliance Requirements

### Required for EU Sales
- Safety warnings
- Materials composition
- Safe use instructions
- Business address (for seller)

### Recommended for All Products
- Age restrictions (if applicable)
- Choking hazard warnings
- Small parts warnings
- Chemical warnings
- Care instructions

## Migration

To add GPSR fields to existing products:

```bash
# Run the migration script
npx ts-node scripts/add-gpsr-fields.ts

# Or run Prisma migration
npx prisma db push
```

**Note**: Business addresses are handled by the existing Address model with the `isBusinessAddress` flag. No additional database migration is needed for business addresses.

## Testing

### Unit Tests
- Test GPSR validation functions
- Test compliance requirement detection
- Test form component functionality

### Integration Tests
- Test form submission with GPSR data
- Test display component rendering
- Test EU compliance detection

## Future Enhancements

1. **Automated Compliance Checking**: AI-powered suggestions for safety warnings
2. **Compliance Dashboard**: Seller dashboard showing compliance status
3. **Regulatory Updates**: Easy updates for new regulatory requirements
4. **Multi-language Support**: GPSR information in multiple languages
5. **Compliance Reports**: Generate compliance reports for sellers

## Legal Considerations

- This implementation helps sellers meet GPSR requirements but does not guarantee compliance
- Sellers remain responsible for ensuring their products meet all applicable regulations
- The platform provides tools and guidance but does not provide legal advice
- Sellers should consult with legal professionals for specific compliance questions

## Support

For questions about GPSR compliance implementation:
1. Check this documentation
2. Review the component examples
3. Test with the provided utility functions
4. Consult EU regulatory resources for specific requirements
