# Centralized Product Filtering System

This document explains the centralized product filtering system that handles both test product filtering and location-based filtering in one place.

## Overview

The centralized filtering system eliminates the need to manually implement filtering logic in every component. Instead, you use a single function that handles all filtering automatically.

## Key Benefits

- **Single Source of Truth**: All filtering logic is in one place
- **Consistency**: Same filtering applied everywhere
- **Maintainability**: Changes to filtering logic only need to be made in one file
- **Reduced Errors**: No risk of forgetting to add filtering to new pages
- **Performance**: Optimized database queries

## How to Use

### Basic Usage

```typescript
import { createProductFilterWhereClause, getProductFilterConfig } from "@/lib/product-filtering";

// Get user's country code
const userCountryCode = await getUserCountryCode();

// Get centralized filter configuration
const filterConfig = await getProductFilterConfig(userCountryCode);

// Build your additional filters
const additionalFilters = {
  primaryCategory: "CROCHET",
  price: { gte: 1000, lte: 5000 }
};

// Create the complete where clause
const where = await createProductFilterWhereClause(additionalFilters, filterConfig);

// Use in your database query
const products = await db.product.findMany({ where });
```

### For Admin/Seller Dashboards

If you want to show ALL products (including test products) in admin/seller dashboards:

```typescript
const filterConfig = await getProductFilterConfig(userCountryCode, true); // includeTestProducts = true
const where = await createProductFilterWhereClause(additionalFilters, filterConfig);
```

### Manual Configuration

You can also manually specify the configuration:

```typescript
const filterConfig = {
  userCountryCode: "US",
  canAccessTest: true,
  includeTestProducts: false
};

const where = await createProductFilterWhereClause(additionalFilters, filterConfig);
```

## What Gets Filtered Automatically

1. **Test Products**: Only visible to users with test environment access
2. **Inactive Products**: Only `status: "ACTIVE"` products are shown
3. **Suspended Sellers**: Products from sellers with `SUSPENDED` or `VACATION` status are hidden
4. **Location Filtering**: Products from sellers who don't ship to user's country (when implemented)

## Migration Guide

### Before (Manual Filtering)
```typescript
// Get user's country code for location-based filtering
const userCountryCode = await getUserCountryCode();

// Check if user has test environment access
const session = await auth();
const canAccessTest = session?.user?.id 
  ? await canUserAccessTestEnvironment(session.user.id)
  : false;

// Build where clause
const where: Prisma.ProductWhereInput = {
  AND: [
    {
      status: "ACTIVE", // Only show active products
    },
    // Filter out test products unless user has test environment access
    ...(canAccessTest ? [] : [{ isTestProduct: false }]),
    // Filter out products from suspended sellers
    {
      seller: {
        user: {
          status: "ACTIVE"
        }
      }
    },
    // Add location-based filtering
    createLocationFilterWhereClause(userCountryCode || ""),
    // Your additional filters...
    { primaryCategory: "CROCHET" },
  ],
};
```

### After (Centralized Filtering)
```typescript
// Get user's country code for location-based filtering
const userCountryCode = await getUserCountryCode();

// Get centralized filter configuration
const filterConfig = await getProductFilterConfig(userCountryCode);

// Build additional filters
const additionalFilters = {
  primaryCategory: "CROCHET"
};

// Use centralized filtering
const where = await createProductFilterWhereClause(additionalFilters, filterConfig);
```

## Files That Need Migration

The following files have been updated to use the centralized system:

- ✅ `app/(site)/products/page.tsx`
- ⏳ `app/(site)/categories/[primaryCategoryId]/page.tsx`
- ⏳ `app/(site)/categories/[primaryCategoryId]/[secondaryCategoryId]/page.tsx`
- ⏳ `app/(site)/categories/[primaryCategoryId]/[secondaryCategoryId]/[tertiaryCategoryId]/page.tsx`
- ⏳ `app/(site)/shops/[shopNameSlug]/page.tsx`
- ⏳ `app/(site)/shops/page.tsx`
- ⏳ `components/ProductRow.tsx`
- ⏳ `actions/getPriceRange.ts`

## Testing

The centralized filtering system is tested in `__tests__/test-product-filtering.test.ts`.

## Future Enhancements

- Add more filter types (e.g., price range, category, etc.)
- Add caching for filter configurations
- Add performance monitoring
- Add more granular permissions 