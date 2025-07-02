# Country Exclusions Setup Guide

## Overview
This feature allows sellers to exclude specific countries from their shipping destinations. This is useful for sellers who want to avoid high shipping costs, customs issues, or other restrictions in certain countries.

## Components Created

### 1. Database Schema Updates
- **File**: `prisma/schema.prisma`
- **Changes**: Added `excludedCountries` field to the Seller model:
  - `excludedCountries` (String[] @default([])) - Array of country codes that seller doesn't ship to

### 2. Validation Schema
- **File**: `schemas/CountryExclusionsSchema.ts`
- **Purpose**: Validates country exclusion form data using supported country codes

### 3. Server Actions
- **File**: `actions/countryExclusionsActions.ts`
- **Functions**:
  - `updateCountryExclusions()` - Updates seller's excluded countries
  - `getCountryExclusions()` - Retrieves seller's current exclusions

### 4. Form Component
- **File**: `components/forms/CountryExclusionsForm.tsx`
- **Features**:
  - Checkbox grid of all available countries
  - Visual display of currently excluded countries with remove buttons
  - Form validation and error handling
  - Loading states and success notifications

### 5. Display Component
- **File**: `components/shop/ExcludedCountries.tsx`
- **Features**:
  - Clean display of excluded countries on shop page
  - Shows "ships worldwide" when no exclusions are set
  - Badge display for excluded countries
  - Responsive design

### 6. Utility Functions
- **File**: `lib/country-exclusions.ts`
- **Functions**:
  - `isCountryExcluded()` - Check if a country is excluded
  - `getExcludedCountryNames()` - Convert country codes to names
  - `doesSellerShipToCountry()` - Check if seller ships to a country

### 7. Settings Integration
- **File**: `app/(dashboards)/seller/dashboard/settings/page.tsx`
- **Changes**: Added "Exclusions" tab to seller settings

### 8. Shop Page Integration
- **File**: `app/(site)/shops/[shopNameSlug]/page.tsx`
- **Changes**: Added ExcludedCountries component to shop sidebar

## Setup Instructions

### Step 1: Update Database Schema
1. Run the Prisma migration:
   ```bash
   npx prisma db push
   ```

2. Generate the Prisma client:
   ```bash
   npx prisma generate
   ```

### Step 2: ✅ Server Actions (Already Configured)
The server actions are already properly configured and ready to use.

### Step 3: ✅ Shop Page Query (Already Updated)
The shop page has been updated to include the excludedCountries field and display component.

### Step 4: Test the Feature
1. Navigate to seller settings → Exclusions tab
2. Select countries to exclude from shipping
3. Save the exclusions
4. Visit the seller's shop page to see the exclusions displayed

## Features

### For Sellers
- Easy-to-use checkbox interface for selecting excluded countries
- Visual feedback showing currently excluded countries
- Ability to quickly remove countries from exclusion list
- Saves time by preventing orders from high-cost shipping destinations

### For Customers
- Clear visibility of shipping restrictions before purchase
- Organized display showing which countries are excluded
- Helps customers understand shipping limitations upfront

## Use Cases

### Common Reasons for Country Exclusions:
1. **High Shipping Costs**: Countries with expensive international shipping
2. **Customs Issues**: Countries with complex import regulations
3. **Delivery Problems**: Countries with unreliable postal services
4. **Legal Restrictions**: Countries with import restrictions on certain items
5. **Business Focus**: Sellers who want to focus on specific regions

## Technical Implementation

### Database Storage
- Uses MongoDB array field to store country codes
- Default empty array means no exclusions
- Country codes follow ISO 3166-1 alpha-2 standard (e.g., "US", "CA", "GB")

### Validation
- Only allows valid country codes from the supported countries list
- Prevents invalid or unsupported country codes from being saved

### Performance
- Efficient array operations for checking exclusions
- Minimal database queries with proper indexing
- Client-side filtering for better user experience

## Integration Points

### Checkout Process
The country exclusions can be integrated into the checkout process to:
- Prevent orders from excluded countries
- Show warning messages to customers
- Redirect to alternative shipping options

### Product Display
Can be used to:
- Hide products from customers in excluded countries
- Show shipping restriction warnings
- Filter product availability by location

### Shipping Profiles
Can work alongside shipping profiles to:
- Automatically exclude countries from shipping rate calculations
- Prevent shipping profile creation for excluded countries
- Show appropriate messaging in shipping settings

## Future Enhancements

### Potential Additions:
1. **Regional Exclusions**: Exclude entire regions (e.g., "All of Europe")
2. **Temporary Exclusions**: Set exclusion dates for seasonal restrictions
3. **Product-Specific Exclusions**: Different exclusions for different product types
4. **Reason Display**: Show reasons why countries are excluded
5. **Alternative Options**: Suggest alternative shipping methods for excluded countries

## Security Considerations

- Uses existing permission system (`MANAGE_SELLER_SETTINGS`)
- Validates all country codes against supported list
- Prevents injection attacks through proper validation
- Maintains data integrity with proper error handling 