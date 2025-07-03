# Shop Policies Setup Guide

## Overview
This feature allows sellers to set and display their shop policies including processing times, returns/exchanges, damages/issues, exceptions/non-returnable items, and refund policies.

## Components Created

### 1. Database Schema Updates
- **File**: `prisma/schema.prisma`
- **Changes**: Added 7 new fields to the Seller model:
  - `processingTime` (String?)
  - `returnsPolicy` (String?)
  - `exchangesPolicy` (String?)
  - `damagesPolicy` (String?)
  - `nonReturnableItems` (String?)
  - `refundPolicy` (String?)
  - `careInstructions` (String?)

### 2. Validation Schema
- **File**: `schemas/ShopPoliciesSchema.ts`
- **Purpose**: Validates shop policy form data with appropriate length limits

### 3. Server Actions
- **File**: `actions/shopPoliciesActions.ts`
- **Functions**:
  - `updateShopPolicies()` - Updates seller's shop policies
  - `getShopPolicies()` - Retrieves seller's current policies

### 4. Form Component
- **File**: `components/forms/ShopPoliciesForm.tsx`
- **Features**:
  - Processing time dropdown with common options
  - Text areas for detailed policy descriptions
  - Form validation and error handling
  - Loading states and success notifications

### 5. Display Component
- **File**: `components/shop/ShopPolicies.tsx`
- **Features**:
  - Clean, organized display of policies
  - Icons for each policy type
  - Conditional rendering (only shows if policies exist)
  - Responsive design

### 6. Settings Integration
- **File**: `app/(dashboards)/seller/dashboard/settings/page.tsx`
- **Changes**: Added "Policies" tab to seller settings

### 7. Shop Page Integration
- **File**: `app/(site)/shops/[shopNameSlug]/page.tsx`
- **Changes**: Added ShopPolicies component to shop sidebar

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
The shop page has been updated to include all policy fields and display components.

### Step 4: Test the Feature
1. Navigate to seller settings → Policies tab
2. Fill out the shop policies form
3. Save the policies
4. Visit the seller's shop page to see the policies displayed

## Features

### For Sellers
- Set processing times from predefined options
- Write detailed policies for returns, exchanges, damages, etc.
- Policies are displayed on their shop page
- Easy to update policies from settings

### For Customers
- Clear visibility of seller policies before purchase
- Organized display with icons and clear sections
- Policies only show if they've been set by the seller

## Policy Types

1. **Processing Time**: How long it takes to process and ship orders
2. **Returns Policy**: Conditions and timeframes for returns
3. **Exchanges Policy**: Rules for exchanging items
4. **Damages Policy**: How damaged items are handled
5. **Non-Returnable Items**: Items that cannot be returned
6. **Refund Policy**: Refund process and methods
7. **Care Instructions**: Care and maintenance instructions for products

## Technical Notes

- All policy fields are optional in the database
- Form validation ensures required fields are filled
- Policies are displayed conditionally (only if set)
- Uses existing permission system (`MANAGE_SELLER_SETTINGS`)
- Integrates with existing toast notification system
- Responsive design works on all screen sizes 