# ProductForm Comprehensive Review Checklist

## 1. VALIDATION ISSUES

### Schema Validation
- [ ] **Draft vs Active Schema Switching**
  - Verify form switches between `ProductDraftSchema` and `ProductSchema` correctly based on status
  - Check that draft products allow partial data (only name required)
  - Verify active products require all fields
  - Test switching from DRAFT to ACTIVE status triggers full validation

- [ ] **Field-Level Validation**
  - Name: Required, min 1 character
  - Description: Required for active, optional for draft (check HTML stripping logic)
  - Price: Must be positive, currency-specific minimums
  - Images: At least 1 for active products, optional for drafts
  - Categories: Primary and secondary required for active
  - Stock: Required for physical products, must be >= 1
  - Shipping fields: Required for physical products unless freeShipping or isDigital
  - ShippingOptionId: Required when freeShipping is false and isDigital is false
  - ProductFile: Required for digital products
  - GPSR fields: Required when shipping to EU/EEA (safetyWarnings, materialsComposition, safeUseInstructions)

- [ ] **Conditional Validation**
  - Digital products: Skip shipping fields, require productFile
  - Free shipping: Skip shippingOptionId validation, set shippingCost to 0
  - On sale: Require discount, saleEndDate, saleEndTime
  - Product drop: Require dropDate and dropTime
  - Tax category: Must match product type (DIGITAL_GOODS for digital, PHYSICAL_GOODS for physical)

- [ ] **Currency & Monetary Validation**
  - Price conversion to cents based on currency decimals
  - Shipping cost and handling fee conversion
  - Minimum price validation per currency
  - Verify no floating point errors in conversions

- [ ] **Options/Variants Validation**
  - Option label required
  - At least one value per option
  - Value name required
  - Price must be non-negative (in cents)
  - Stock must be non-negative integer

### Client-Side Validation
- [ ] Form validation triggers on status change (DRAFT → ACTIVE)
- [ ] Real-time validation feedback in UI
- [ ] Error messages display correctly for each field
- [ ] Card-level error indicators work (red borders on sections with errors)
- [ ] Description HTML stripping works correctly (empty tags detection)

### Server-Side Validation
- [ ] API route validates against same schemas
- [ ] Server returns detailed Zod error messages
- [ ] Client properly handles and displays server validation errors

---

## 2. ERROR REPORTING

### Toast Notifications
- [ ] **Success Messages**
  - Draft saved: "Product draft saved successfully! Complete all required fields to make it active."
  - Product created: "Product created"
  - Product updated: "Product updated"
  - Image upload: "Uploading images..." (loading), then dismiss
  - File upload: "Uploading product file..." (loading), then dismiss

- [ ] **Error Messages**
  - Validation errors: Show specific field errors or generic message
  - Image upload failure: "Failed to upload images. Please try again."
  - File upload failure: "Failed to upload product file. Please try again."
  - API errors: Show server error message or generic "Failed to save product"
  - Onboarding incomplete: "Please complete your seller onboarding before activating products"
  - Approval required: "Your seller application must be approved..."
  - GPSR compliance: "GPSR compliance required: Please fill in [fields]"

- [ ] **Error Handling**
  - Multiple validation errors shown correctly (first 3, then "...")
  - Unique error deduplication works
  - Loading toasts dismissed on error
  - No duplicate toasts for same error

### Console Logging
- [ ] **Debug Logs**
  - Initial data logged: `[DEBUG] ProductForm - Initial data:`
  - Form submission logged: `[DEBUG] onSubmit function called!`
  - Form data logged before API call
  - Image state updates logged

- [ ] **Error Logs**
  - All errors logged with `[PRODUCT FORM ERROR]` prefix
  - Error objects include: name, message, stack, productId, timestamp
  - Form data included in error logs for debugging
  - Image upload errors logged with image count
  - File upload errors logged with file details

- [ ] **API Error Logs**
  - Server errors logged with full context
  - Response status and data logged
  - Zod validation errors logged with details array

### Form Error Display
- [ ] Field-level errors show below inputs
- [ ] Card section errors show in header (red banner)
- [ ] Errors clear when switching back to DRAFT
- [ ] Errors trigger when status changes to non-DRAFT
- [ ] Shipping field errors only show when relevant (not free shipping, not digital)

---

## 3. SUBMISSION ISSUES

### Form Submission Flow
- [ ] **Loading States**
  - `isLoading` prevents multiple submissions
  - Submit button shows loading state
  - Form disabled during submission
  - No navigation during submission

- [ ] **Data Transformation**
  - Price converted to cents before submission
  - Shipping cost converted to cents
  - Handling fee converted to cents
  - Options converted from dropdown format to schema format
  - Tax code: empty string converted to null
  - Sale dates: Date objects serialized correctly
  - Description: HTML and text versions included

- [ ] **Image Handling**
  - Existing images preserved (HTTP URLs)
  - New processed images uploaded before submission
  - Blob URLs replaced with uploaded URLs
  - Image state synced with form state
  - No duplicate images in final array

- [ ] **File Handling**
  - Existing file URL preserved if HTTP URL
  - New processed file uploaded before submission
  - Blob URLs cleaned up after upload
  - Invalid blob URLs cleared before submission

- [ ] **Status Handling**
  - Draft status preserved when saving as draft
  - Status validated before submission
  - Status change triggers appropriate validation

### API Request
- [ ] **Request Format**
  - Correct endpoint: `/api/products/create-product` (POST) or `/api/products/${id}` (PATCH)
  - Content-Type: application/json
  - Body contains all required fields
  - Monetary values in cents
  - Dates serialized correctly

- [ ] **Response Handling**
  - Success: Extract product ID, show success message, navigate
  - Error: Parse error response, show appropriate message
  - Onboarding incomplete: Handle special error flag
  - Validation errors: Extract and display Zod error details

### Navigation
- [ ] Navigate to `/seller/dashboard/products` on success
- [ ] Router refresh called after navigation
- [ ] No navigation on error
- [ ] Cancel button works correctly

---

## 4. RACE CONDITIONS

### Multiple Submissions
- [ ] `isLoading` flag prevents double submission
- [ ] Form submission disabled while `isLoading` is true
- [ ] No concurrent API calls for same product
- [ ] Submit button disabled during submission

### Image Upload Race Conditions
- [ ] Only one image upload batch at a time
- [ ] `isUploading` flag prevents concurrent uploads
- [ ] Existing images preserved during new upload
- [ ] No image state conflicts during upload

### File Upload Race Conditions
- [ ] Only one file upload at a time
- [ ] File upload doesn't conflict with image upload
- [ ] Processed file cleared after successful upload

### State Updates
- [ ] No race conditions between form state and local state
- [ ] Description state synced with form state correctly
- [ ] Images state synced with form state correctly
- [ ] Options state converted correctly before submission

### API Calls
- [ ] Seller preferences fetch doesn't block form initialization
- [ ] Excluded countries fetch doesn't block form initialization
- [ ] GPSR requirement check doesn't block form initialization
- [ ] No race condition between multiple useEffect hooks

---

## 5. DATA FETCHING

### Initial Data Loading
- [ ] **Edit Mode**
  - Product data fetched correctly
  - All fields populated from initialData
  - Images array populated
  - Options converted from schema to dropdown format
  - Sale dates parsed correctly (string to Date)
  - Price converted from cents to currency units
  - Shipping costs converted from cents

- [ ] **Create Mode**
  - Form initializes with empty defaults
  - Seller preferences applied (currency, weight unit, dimension unit)
  - No errors with null initialData

### Seller Preferences
- [ ] Fetched on mount: `/api/seller/preferences`
- [ ] Retry logic works (3 attempts with exponential backoff)
- [ ] Fallback to defaults if fetch fails
- [ ] Currency set from preferences for new products
- [ ] Weight and dimension units set from preferences

### Excluded Countries & GPSR
- [ ] Excluded countries fetched: `getCountryExclusions()`
- [ ] GPSR requirement calculated: `isGPSRComplianceRequired()`
- [ ] GPSR section shows/hides correctly
- [ ] GPSR fields validated only when required
- [ ] Error handling if fetch fails (defaults to showing GPSR fields)

### Seller Approval Check
- [ ] Approval status checked: `checkSellerApproval()`
- [ ] Approval status stored in state
- [ ] Used to determine if product can be activated
- [ ] Error handling if check fails

---

## 6. API ROUTE ISSUES

### Authentication
- [ ] Session validated: `await auth()`
- [ ] User ID exists: `session?.user?.id`
- [ ] Returns 401 if unauthorized
- [ ] Error logged if auth fails

### Authorization
- [ ] Seller profile exists for user
- [ ] Returns 404 if seller not found
- [ ] Application approval checked for ACTIVE products
- [ ] Onboarding completion checked for ACTIVE products
- [ ] Returns 403 with appropriate error message

### Validation
- [ ] Request body parsed correctly
- [ ] Draft vs Active validation applied
- [ ] Required fields validated
- [ ] Zod schema validation on server
- [ ] Server returns detailed validation errors

### SKU Generation
- [ ] SKU generated if not provided
- [ ] SKU generation errors handled
- [ ] Returns 500 if SKU generation fails
- [ ] Generated SKU is unique

### Product Creation
- [ ] All fields saved correctly
- [ ] Monetary values in cents
- [ ] Dates serialized correctly
- [ ] Options saved correctly
- [ ] Images array saved
- [ ] ProductFile URL saved
- [ ] GPSR fields saved
- [ ] Tax fields saved correctly (taxCode null if empty)

### Batch Number Generation
- [ ] Batch number generated for physical products
- [ ] Generation failure doesn't fail entire request
- [ ] Error logged if generation fails

### Error Handling
- [ ] All errors caught and logged
- [ ] Appropriate HTTP status codes returned
- [ ] Error messages in response
- [ ] Zod errors returned with details array
- [ ] Stack traces only in development

---

## 7. PERMISSION ISSUES

### Seller Approval
- [ ] **Check Seller Approval**
  - `checkSellerApproval()` called on mount
  - Status stored in `isSellerApproved` state
  - Used to determine if product can be activated

- [ ] **API Route Checks**
  - `applicationAccepted` checked for ACTIVE products
  - Returns 403 with approval required message
  - Draft products allowed without approval

### Onboarding Completion
- [ ] **Client-Side Check**
  - Onboarding status checked (implicitly via API)
  - Error shown if trying to activate without completion

- [ ] **API Route Checks**
  - `isFullyActivated` checked for ACTIVE products
  - Returns 403 with onboarding incomplete message
  - Includes onboarding status in response
  - Draft products allowed without completion

### Test Environment Access
- [ ] `useTestEnvironment()` hook works
- [ ] Test product checkbox only shows if `canAccessTest` is true
- [ ] Test products marked correctly
- [ ] No errors if test access check fails

---

## 8. IMAGE & FILE UPLOAD ISSUES

### Image Upload
- [ ] **Processed Images**
  - Processed images stored in state before upload
  - Blob URLs created for preview
  - File objects preserved for upload

- [ ] **Upload Process**
  - Only new images uploaded (blob URLs)
  - Existing images (HTTP URLs) preserved
  - Upload progress tracked
  - Loading toast shown during upload
  - Error handling if upload fails
  - Uploaded URLs replace blob URLs

- [ ] **State Management**
  - Images state updated after upload
  - Form state synced with images state
  - No duplicate images
  - Images array order preserved

- [ ] **Cleanup**
  - Temporary uploads cleaned up after successful submission
  - Cleanup called with product ID
  - Blob URLs revoked to prevent memory leaks
  - Error handling if cleanup fails

### File Upload
- [ ] **Processed File**
  - Processed file stored in state before upload
  - Blob URL created for preview
  - File object preserved for upload

- [ ] **Upload Process**
  - File uploaded if new (blob URL)
  - Existing file URL preserved if HTTP URL
  - Loading toast shown during upload
  - Error handling if upload fails
  - Uploaded URL replaces blob URL

- [ ] **State Management**
  - Processed file cleared after successful upload
  - Blob URL revoked after upload
  - Form state updated with file URL
  - Invalid blob URLs cleared before submission

- [ ] **Cleanup**
  - Blob URLs cleaned up on unmount
  - Memory leaks prevented

---

## 9. FORM STATE MANAGEMENT

### React Hook Form
- [ ] Form initialized with correct default values
- [ ] Schema resolver switches correctly (Draft vs Active)
- [ ] Form mode set to "onChange" for real-time validation
- [ ] Form state synced with local state (description, images)
- [ ] Form errors cleared when switching to DRAFT
- [ ] Form validation triggered when switching from DRAFT

### Local State
- [ ] Description state synced with form
- [ ] Images state synced with form
- [ ] Options state converted correctly
- [ ] SEO fields stored in local state
- [ ] Tags and material tags in local state
- [ ] No state conflicts between form and local state

### State Updates
- [ ] Initial data updates state correctly
- [ ] State updates don't cause infinite loops
- [ ] useEffect dependencies correct
- [ ] No unnecessary re-renders

---

## 10. UI/UX ISSUES

### Form Sections
- [ ] All sections render correctly
- [ ] Card error indicators show when fields have errors
- [ ] Sections hide/show based on product type (digital vs physical)
- [ ] Shipping section hidden for digital products
- [ ] Inventory section hidden for digital products
- [ ] GPSR section shows/hides based on requirements

### Field Visibility
- [ ] Shipping fields hidden when freeShipping is true
- [ ] ShippingOptionId hidden when freeShipping is true
- [ ] ShippingOptionId hidden when isDigital is true
- [ ] GPSR fields hidden for digital products
- [ ] Test product checkbox only shows with test access

### Loading States
- [ ] Spinner shows while `!isClient`
- [ ] Submit button shows loading state
- [ ] Form disabled during submission
- [ ] No flickering during state updates

### Error Display
- [ ] Field errors show below inputs
- [ ] Section errors show in card headers
- [ ] Error messages are user-friendly
- [ ] Errors clear when fixed

---

## 11. EDGE CASES

### Empty States
- [ ] Form works with no initial data
- [ ] Form works with partial initial data
- [ ] Empty arrays handled correctly
- [ ] Null/undefined values handled correctly

### Data Type Conversions
- [ ] Price: currency units ↔ cents
- [ ] Shipping costs: currency units ↔ cents
- [ ] Dates: string ↔ Date objects
- [ ] Options: dropdown format ↔ schema format
- [ ] Description: HTML ↔ text

### Boundary Conditions
- [ ] Maximum image count (10) enforced
- [ ] Maximum file size (4MB) enforced
- [ ] Maximum description length (2000 chars)
- [ ] Maximum SEO field lengths enforced
- [ ] Minimum price per currency enforced

### Network Issues
- [ ] Retry logic for seller preferences fetch
- [ ] Error handling for failed API calls
- [ ] Timeout handling
- [ ] Offline detection (if applicable)

### Browser Issues
- [ ] Beforeunload warning shows for unsaved changes
- [ ] Blob URLs cleaned up on unmount
- [ ] Memory leaks prevented
- [ ] Form works in different browsers

---

## 12. INTEGRATION ISSUES

### Component Integration
- [ ] ProductInfoSection receives correct props
- [ ] ProductPhotosSection receives correct props
- [ ] ProductOptionsSection receives correct props
- [ ] ProductShippingSection receives correct props
- [ ] ProductPromotionsSection receives correct props
- [ ] ProductInventorySection receives correct props
- [ ] ProductHowItsMadeSection receives correct props
- [ ] ProductSEOSection receives correct props
- [ ] GPSRComplianceForm receives correct props
- [ ] ProductFileSection receives correct props

### Action Integration
- [ ] `cleanupTempUploads` called correctly
- [ ] `checkSellerApproval` called correctly
- [ ] `getCountryExclusions` called correctly
- [ ] All actions handle errors correctly

### Hook Integration
- [ ] `useIsClient` works correctly
- [ ] `useTestEnvironment` works correctly
- [ ] `useRouter` works correctly
- [ ] `usePathname` works correctly (if used)

---

## 13. TESTING SCENARIOS

### Create Product (Draft)
- [ ] Can create draft with only name
- [ ] Can save draft with partial data
- [ ] Draft saved successfully
- [ ] Navigation works after save

### Create Product (Active)
- [ ] Requires all fields
- [ ] Validates all required fields
- [ ] Shows errors for missing fields
- [ ] Can't activate without approval
- [ ] Can't activate without onboarding
- [ ] Creates successfully when all conditions met

### Edit Product
- [ ] Loads existing product data
- [ ] All fields populated correctly
- [ ] Can update and save
- [ ] Changes persist correctly

### Digital Product
- [ ] Shipping fields hidden
- [ ] Inventory fields hidden
- [ ] ProductFile required
- [ ] GPSR fields hidden
- [ ] Tax category must be DIGITAL_GOODS

### Physical Product
- [ ] Shipping fields required (unless free shipping)
- [ ] Inventory fields required
- [ ] Dimensions required
- [ ] Weight required
- [ ] GPSR fields required if shipping to EU/EEA

### Image Upload
- [ ] Can upload multiple images
- [ ] Existing images preserved
- [ ] New images uploaded correctly
- [ ] Upload errors handled
- [ ] Images cleaned up after submission

### File Upload
- [ ] Can upload product file
- [ ] Existing file preserved
- [ ] New file uploaded correctly
- [ ] Upload errors handled
- [ ] File cleaned up after submission

### Status Changes
- [ ] Can switch from DRAFT to ACTIVE
- [ ] Validation triggers on status change
- [ ] Errors clear when switching to DRAFT
- [ ] Can hide active product

### Sale/Promotion
- [ ] Can enable sale
- [ ] Requires discount when on sale
- [ ] Requires sale end date/time
- [ ] Validates sale dates correctly

### Product Drop
- [ ] Can enable product drop
- [ ] Requires drop date and time
- [ ] Validates drop date/time correctly

---

## 14. PERFORMANCE ISSUES

### Rendering
- [ ] No unnecessary re-renders
- [ ] Large forms render efficiently
- [ ] Image previews don't cause lag
- [ ] Form validation doesn't block UI

### Network
- [ ] API calls optimized
- [ ] No duplicate API calls
- [ ] Retry logic doesn't cause excessive requests
- [ ] Image uploads don't block form submission

### Memory
- [ ] Blob URLs cleaned up
- [ ] No memory leaks
- [ ] Large images don't cause issues
- [ ] Form state doesn't grow unbounded

---

## 15. SECURITY ISSUES

### Input Validation
- [ ] All inputs validated
- [ ] XSS prevention (HTML sanitization)
- [ ] SQL injection prevention (Prisma)
- [ ] File upload validation

### Authorization
- [ ] User authenticated
- [ ] Seller profile exists
- [ ] User owns the product (for edits)
- [ ] Permissions checked

### Data Sanitization
- [ ] User input sanitized
- [ ] File names sanitized
- [ ] URLs validated
- [ ] No sensitive data in logs (production)

---

## QUICK REFERENCE: COMMON ISSUES TO CHECK

1. **Validation not triggering**: Check schema resolver, form mode, status changes
2. **Images not uploading**: Check blob URL detection, upload function, error handling
3. **Form not submitting**: Check isLoading flag, validation errors, API errors
4. **State not syncing**: Check useEffect dependencies, form.setValue calls
5. **Errors not showing**: Check error display logic, toast notifications, console logs
6. **Navigation issues**: Check router calls, success conditions, error handling
7. **Memory leaks**: Check blob URL cleanup, useEffect cleanup functions
8. **Race conditions**: Check loading flags, concurrent operations, state updates
9. **Permission errors**: Check approval status, onboarding completion, API responses
10. **Data conversion errors**: Check cents conversion, date parsing, option format conversion
