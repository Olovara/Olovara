# Bulk Import System - Edge Cases & Failure Points Analysis

## Executive Summary
This document identifies potential failure points and edge cases in the bulk import system that could prevent products from being created or cause data integrity issues.

---

## 1. STOCK AMOUNTS

### ✅ **Handled Cases:**
- Negative stock → Converted to 0 or undefined
- Non-numeric stock → Parsed with `parseFloat()`, defaults to 0
- Missing stock → Defaults to 0
- Stock for digital products → Should be 0 (not validated currently)
- Stock for products with variations → Set to 0 when variations exist

### ⚠️ **Potential Issues:**

#### 1.1 **Very Large Stock Numbers**
- **Issue**: Stock is stored as `Int` in Prisma, but JavaScript `Number` has limits
- **Risk**: Stock values > 2^53 could lose precision
- **Current Behavior**: No explicit validation
- **Recommendation**: Add max stock validation (e.g., 1,000,000)

#### 1.2 **Decimal Stock Values**
- **Issue**: Stock is parsed with `parseFloat()` but should be integer
- **Current Behavior**: `Math.floor()` is applied, but only if stock is string
- **Risk**: If CSV has `"12.5"`, it becomes `12` (silent truncation)
- **Recommendation**: Validate stock is integer, show warning for decimals

#### 1.3 **Stock for Digital Products**
- **Issue**: Digital products shouldn't have stock > 0
- **Current Behavior**: No validation that digital products have stock = 0
- **Risk**: Digital products with stock could confuse inventory tracking
- **Recommendation**: Force `stock = 0` for digital products

#### 1.4 **Stock Validation Timing**
- **Issue**: Stock validation happens in Zod schema AFTER normalization
- **Current Behavior**: If stock is invalid, product fails validation
- **Risk**: Error message might not clearly indicate which row failed
- **Recommendation**: Add pre-validation with clearer error messages

---

## 2. PRICE & CURRENCY

### ✅ **Handled Cases:**
- Currency symbols in price → Stripped with regex
- Comma separators → Removed during parsing
- Missing currency → Defaults to seller's preferred currency, then USD
- Currency decimal validation → Validated in ProductSchema
- Price conversion → Converted to smallest unit (cents) based on currency decimals

### ⚠️ **Potential Issues:**

#### 2.1 **Price with Currency Mismatch**
- **Issue**: CSV might have `PRICE: "$10.99"` but `CURRENCY_CODE: "EUR"`
- **Current Behavior**: Currency symbol is stripped, but currency code is used
- **Risk**: Price might be interpreted incorrectly
- **Recommendation**: Validate price format matches currency, or auto-detect from symbol

#### 2.2 **Zero or Negative Prices**
- **Issue**: Price of 0 or negative might be valid for free products or errors
- **Current Behavior**: `min(0)` validation allows 0, but might not be intended
- **Risk**: Products with $0 price could be created
- **Recommendation**: Add explicit validation for minimum price (e.g., $0.01 for USD)

#### 2.3 **Price Precision for 0-Decimal Currencies**
- **Issue**: JPY, HUF, IDR, XOF don't use decimals, but CSV might have "1000.50"
- **Current Behavior**: `parseFloat()` accepts decimals, conversion happens later
- **Risk**: `1000.50` JPY becomes `1000` (silent truncation)
- **Recommendation**: Validate price has no decimals for 0-decimal currencies

#### 2.4 **Very Large Prices**
- **Issue**: Price conversion to cents could overflow for very large values
- **Current Behavior**: No max price validation
- **Risk**: Prices > $999,999.99 could cause issues
- **Recommendation**: Add max price validation (e.g., $1,000,000)

#### 2.5 **Currency Code Case Sensitivity**
- **Issue**: CSV might have "usd" instead of "USD"
- **Current Behavior**: Enum validation will fail if case doesn't match
- **Risk**: Valid currency codes rejected due to case
- **Recommendation**: Normalize currency codes to uppercase before validation

#### 2.6 **Invalid Currency Codes**
- **Issue**: CSV might have unsupported currency codes
- **Current Behavior**: Zod enum validation will reject
- **Risk**: Product fails with unclear error message
- **Recommendation**: Provide helpful error: "Currency 'XXX' not supported. Supported: USD, EUR, ..."

#### 2.7 **Price in Wrong Currency Units**
- **Issue**: CSV might have price in cents (e.g., "1099" for $10.99) but system expects dollars
- **Current Behavior**: System assumes price is in currency units, converts to cents
- **Risk**: If CSV has cents, price will be 100x too high
- **Recommendation**: Document expected format, or auto-detect based on value size

---

## 3. SHIPPING

### ✅ **Handled Cases:**
- Free shipping flag → Applied to all products
- Shipping option validation → Verified belongs to seller
- Missing shipping option → Falls back to minimal value (0.01)
- Shipping cost calculation → Derived from shipping option's defaultShipping

### ⚠️ **Potential Issues:**

#### 3.1 **Shipping Option Currency Mismatch**
- **Issue**: Shipping option currency might differ from product currency
- **Current Behavior**: Uses shipping option's currency for cost calculation
- **Risk**: Product in USD but shipping in EUR could cause confusion
- **Recommendation**: Validate currencies match, or convert between currencies

#### 3.2 **Shipping Option Deleted During Import**
- **Issue**: Shipping option might be deleted while import is running
- **Current Behavior**: Falls back to 0.01 if option not found
- **Risk**: Products created with incorrect shipping cost
- **Recommendation**: Validate shipping option exists before starting import

#### 3.3 **Shipping Option Without Rates**
- **Issue**: Shipping option might have no rates or defaultShipping
- **Current Behavior**: Falls back to 0.01
- **Risk**: Products created with minimal shipping cost that might be incorrect
- **Recommendation**: Require shipping option to have at least one rate or defaultShipping

#### 3.4 **Handling Fee Validation**
- **Issue**: Handling fee might have wrong decimal places for currency
- **Current Behavior**: Validated in ProductSchema, but error might be unclear
- **Risk**: Product fails validation with unclear error
- **Recommendation**: Provide specific error message about handling fee decimals

#### 3.5 **Digital Products with Shipping Info**
- **Issue**: Digital products shouldn't have shipping cost or shipping options
- **Current Behavior**: No explicit validation that digital products don't have shipping
- **Risk**: Digital products with shipping info could confuse checkout
- **Recommendation**: Force `freeShipping = true` and `shippingCost = 0` for digital products

#### 3.6 **Physical Products Without Shipping**
- **Issue**: Physical products must have shipping unless free shipping
- **Current Behavior**: Validated in ProductSchema
- **Risk**: Product fails validation
- **Recommendation**: ✅ Already handled

---

## 4. CATEGORIES

### ✅ **Handled Cases:**
- Missing categories → Defaults to "Other"
- Seller-selected categories → Applied to all products
- Category hierarchy → Primary and secondary required

### ⚠️ **Potential Issues:**

#### 4.1 **Invalid Category IDs**
- **Issue**: CSV or seller might provide category IDs that don't exist
- **Current Behavior**: No validation that category IDs are valid
- **Risk**: Products created with invalid categories
- **Recommendation**: Validate category IDs against `data/categories.ts`

#### 4.2 **Category Hierarchy Violations**
- **Issue**: Tertiary category might not belong to selected secondary category
- **Current Behavior**: No validation of category relationships
- **Risk**: Products with invalid category combinations
- **Recommendation**: Validate tertiary category belongs to secondary category

#### 4.3 **Tertiary Category Without Secondary**
- **Issue**: Tertiary category provided but secondary doesn't have children
- **Current Behavior**: Tertiary is set but might be invalid
- **Risk**: Products with invalid category structure
- **Recommendation**: Validate secondary category has children before allowing tertiary

#### 4.4 **Category Case Sensitivity**
- **Issue**: Category IDs might be case-sensitive
- **Current Behavior**: No normalization
- **Risk**: "ART" vs "art" might be treated differently
- **Recommendation**: Normalize category IDs to uppercase

---

## 5. OPTIONS/VARIATIONS

### ✅ **Handled Cases:**
- Variation parsing → Handles Etsy format (VARIATION 1 TYPE, NAME, VALUES)
- Variation stock → Set to 0 for inventory review
- Variation price → Defaults to 0 (additional on top of base price)
- Duplicate variation names → Validated in ProductSchema

### ⚠️ **Potential Issues:**

#### 5.1 **Variation Price Calculation**
- **Issue**: Variation prices are in currency units, but need to be converted to smallest unit
- **Current Behavior**: Variation prices default to 0, but if provided, might not be converted
- **Risk**: Variation prices might be in wrong format
- **Recommendation**: Convert variation prices to smallest unit like base price

#### 5.2 **Variation Price Decimal Places**
- **Issue**: Variation prices might have wrong decimal places for currency
- **Current Behavior**: No validation of variation price decimals
- **Risk**: Variation prices rejected during validation
- **Recommendation**: Validate variation prices match currency decimals

#### 5.3 **Too Many Variations**
- **Issue**: Etsy supports 2 variation groups, but system might allow more
- **Current Behavior**: Only processes up to 2 variation groups
- **Risk**: ✅ Already limited

#### 5.4 **Empty Variation Values**
- **Issue**: Variation VALUES might be empty string or just commas
- **Current Behavior**: Filters empty values, but might create option with 0 values
- **Risk**: Invalid option structure
- **Recommendation**: Skip variation if no valid values after parsing

#### 5.5 **Variation Name Conflicts**
- **Issue**: Same variation name in different groups (e.g., "Size" in both groups)
- **Current Behavior**: No validation across groups
- **Risk**: Confusing product options
- **Recommendation**: Validate variation labels are unique

#### 5.6 **Variation Stock for Digital Products**
- **Issue**: Digital products shouldn't have variations with stock
- **Current Behavior**: No validation that digital products don't have variations
- **Risk**: Digital products with stock-based variations
- **Recommendation**: Reject variations for digital products, or force stock = 0

---

## 6. DIGITAL VS PHYSICAL

### ✅ **Handled Cases:**
- Default to physical → `isDigital = false` by default
- Digital products require productFile → Validated in ProductSchema

### ⚠️ **Potential Issues:**

#### 6.1 **Digital Products with Physical Attributes**
- **Issue**: Digital products might have weight, dimensions, shipping info
- **Current Behavior**: No validation that digital products don't have physical attributes
- **Risk**: Digital products with invalid shipping calculations
- **Recommendation**: Clear physical attributes for digital products

#### 6.2 **Physical Products Marked as Digital**
- **Issue**: CSV might incorrectly mark physical products as digital
- **Current Behavior**: No validation
- **Risk**: Physical products without shipping info
- **Recommendation**: Validate `isDigital` flag matches product type (has file vs has shipping)

#### 6.3 **Product File URL Validation**
- **Issue**: Digital products require productFile, but URL might be invalid
- **Current Behavior**: Validated in ProductSchema
- **Risk**: Product fails validation
- **Recommendation**: ✅ Already handled

---

## 7. IMAGES

### ✅ **Handled Cases:**
- Multiple image columns → Collected from IMAGE1, IMAGE2, etc.
- Comma-separated URLs → Split and processed
- Image upload → Only after validation passes
- Invalid URLs → Skipped with warning

### ⚠️ **Potential Issues:**

#### 7.1 **Too Many Images**
- **Issue**: Product might have > 10 images (typical limit)
- **Current Behavior**: No limit on number of images
- **Risk**: Performance issues, storage costs
- **Recommendation**: Limit to 10 images, take first 10

#### 7.2 **Image URL Format**
- **Issue**: URLs might be relative paths, data URIs, or invalid formats
- **Current Behavior**: Validates URL starts with "http"
- **Risk**: Invalid URLs cause image processing to fail
- **Recommendation**: Validate URL format more strictly

#### 7.3 **Image Upload Failures**
- **Issue**: Image upload might fail (network, storage quota, invalid format)
- **Current Behavior**: Continues processing other images, but product fails if no images
- **Risk**: Product fails if all images fail to upload
- **Recommendation**: Retry failed uploads, or allow products with 0 images (for drafts)

#### 7.4 **Image File Size**
- **Issue**: Large images might exceed storage limits or timeout
- **Current Behavior**: No size validation
- **Risk**: Timeouts, storage quota exceeded
- **Recommendation**: Validate image size before upload, or resize large images

#### 7.5 **Image URL Accessibility**
- **Issue**: Image URLs might require authentication or be blocked
- **Current Behavior**: Upload fails silently
- **Risk**: Products created without images
- **Recommendation**: Validate image accessibility before processing

---

## 8. DATA INTEGRITY

### ⚠️ **Potential Issues:**

#### 8.1 **SKU Uniqueness**
- **Issue**: SKUs might be duplicated across products or with existing products
- **Current Behavior**: No uniqueness validation
- **Risk**: Duplicate SKUs cause inventory tracking issues
- **Recommendation**: Validate SKU uniqueness within seller's products

#### 8.2 **Product Name Length**
- **Issue**: Product names might exceed database limits
- **Current Behavior**: No explicit length validation
- **Risk**: Database errors if name too long
- **Recommendation**: Validate name length (e.g., max 200 characters)

#### 8.3 **Description Length**
- **Issue**: Descriptions might exceed 2000 character limit
- **Current Behavior**: Validated in ProductSchema (max 2000)
- **Risk**: Product fails validation
- **Recommendation**: ✅ Already handled, but truncate with warning instead of failing

#### 8.4 **Tags/Materials Array Size**
- **Issue**: Too many tags or materials might cause performance issues
- **Current Behavior**: No limit
- **Risk**: Large arrays slow down processing
- **Recommendation**: Limit to 20 tags, 10 materials

#### 8.5 **Special Characters in Fields**
- **Issue**: Special characters might break CSV parsing or database storage
- **Current Behavior**: No sanitization
- **Risk**: Data corruption, injection attacks
- **Recommendation**: Sanitize text fields, escape special characters

---

## 9. SYSTEM LIMITS

### ⚠️ **Potential Issues:**

#### 9.1 **Row Limit**
- **Issue**: MAX_ROWS = 500, but seller might have more
- **Current Behavior**: Only first 500 rows processed, warning shown
- **Risk**: Seller might not notice warning
- **Recommendation**: Show clear error if CSV exceeds limit, or allow pagination

#### 9.2 **Batch Processing**
- **Issue**: BATCH_SIZE = 50, but large batches might timeout
- **Current Behavior**: Processes in batches
- **Risk**: Timeout for very large batches
- **Recommendation**: Reduce batch size for slow operations (image uploads)

#### 9.3 **Concurrent Imports**
- **Issue**: Multiple imports running simultaneously might cause conflicts
- **Current Behavior**: No limit on concurrent imports
- **Risk**: Resource exhaustion, database locks
- **Recommendation**: Limit concurrent imports per seller (e.g., 1 at a time)

#### 9.4 **Memory Usage**
- **Issue**: Large CSVs loaded entirely into memory
- **Current Behavior**: CSV parsed and stored in memory
- **Risk**: Out of memory errors for very large CSVs
- **Recommendation**: Stream CSV processing for large files

---

## 10. ERROR HANDLING

### ⚠️ **Potential Issues:**

#### 10.1 **Unclear Error Messages**
- **Issue**: Validation errors might not indicate which row failed
- **Current Behavior**: Error includes row number, but might be unclear
- **Risk**: Seller can't fix issues
- **Recommendation**: Include row number, field name, and suggested fix in errors

#### 10.2 **Partial Failures**
- **Issue**: Some products succeed, others fail, but seller doesn't know which
- **Current Behavior**: Failed rows stored in `failedRows` array
- **Risk**: Seller might not check failed rows
- **Recommendation**: ✅ Already handled with download CSV feature

#### 10.3 **Silent Failures**
- **Issue**: Some errors might be caught but not reported
- **Current Behavior**: Errors logged to console
- **Risk**: Seller doesn't know why product failed
- **Recommendation**: Ensure all errors are captured in `failedRows`

---

## 11. RECOMMENDED FIXES (Priority Order)

### **High Priority:**
1. ✅ Validate category IDs against category tree
2. ✅ Validate category hierarchy (tertiary belongs to secondary)
3. ✅ Force `stock = 0` for digital products
4. ✅ Validate SKU uniqueness within seller's products
5. ✅ Normalize currency codes to uppercase
6. ✅ Limit number of images to 10
7. ✅ Validate variation prices match currency decimals

### **Medium Priority:**
8. ✅ Add max stock validation (1,000,000)
9. ✅ Add max price validation ($1,000,000)
10. ✅ Validate price has no decimals for 0-decimal currencies
11. ✅ Clear physical attributes for digital products
12. ✅ Limit tags to 20, materials to 10
13. ✅ Validate product name length (max 200)

### **Low Priority:**
14. ✅ Retry failed image uploads
15. ✅ Validate image size before upload
16. ✅ Limit concurrent imports per seller
17. ✅ Stream CSV processing for very large files
18. ✅ Auto-detect currency from price symbol

---

## 12. TESTING RECOMMENDATIONS

### **Test Cases to Add:**
1. CSV with 501 rows (should only process 500)
2. CSV with invalid currency code
3. CSV with price in wrong format (cents vs dollars)
4. CSV with invalid category IDs
5. CSV with tertiary category that doesn't belong to secondary
6. CSV with digital products that have shipping info
7. CSV with variations for digital products
8. CSV with duplicate SKUs
9. CSV with very long product names (> 200 chars)
10. CSV with > 10 images per product
11. CSV with invalid image URLs
12. CSV with stock > 1,000,000
13. CSV with price > $1,000,000
14. CSV with JPY price that has decimals
15. CSV with variation prices that have wrong decimals

---

## Conclusion

The bulk import system handles most common cases well, but there are several edge cases that could cause failures or data integrity issues. The highest priority fixes should focus on:
- Category validation
- Currency/price validation
- Digital vs physical product validation
- SKU uniqueness
- Image limits

Most of these can be fixed with additional validation in the `normalizeRow` function or `ProductSchema`.

