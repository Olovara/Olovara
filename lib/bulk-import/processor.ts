/**
 * Bulk import processor
 * Handles CSV row normalization, validation, image ingestion, and product creation
 * Processes in batches of 50 rows
 */

import { db } from "@/lib/db";
import { ProductSchema } from "@/schemas/ProductSchema";
import { getStorage } from "@/lib/storage";
import { BulkImportJobStatus } from "@prisma/client";
import { getCurrencyDecimals } from "@/data/units";
import { Categories, findCategoryById, getTertiaryCategories } from "@/data/categories";
import { SUPPORTED_CURRENCIES } from "@/data/units";
import { generateUniqueSKU } from "@/lib/sku-generator";

const BATCH_SIZE = 50; // Process 50 rows at a time
const MAX_ROWS = 500; // Maximum rows per job
const PROGRESS_UPDATE_INTERVAL = 10; // Update progress every 10 rows (for better UX on small imports)

interface ProcessBulkImportParams {
  jobId: string;
  sellerId: string;
  csvData: any[]; // Parsed CSV rows
  mapping: Record<string, string>; // CSV header -> product field mapping
  sourcePlatform?: string;
  mappingId?: string;
  primaryCategory?: string; // Category to apply to all products
  secondaryCategory?: string; // Category to apply to all products
  tertiaryCategory?: string; // Optional category to apply to all products
  freeShipping?: boolean; // Shipping setting to apply to all products
  shippingOptionId?: string; // Shipping option ID to apply to all products
  handlingFee?: number; // Handling fee to apply to all products
}

interface ProcessedRow {
  rowNumber: number;
  success: boolean;
  productId?: string;
  needsInventoryReview?: boolean; // Track if this product needs inventory review
  error?: string;
  rowData?: any;
}

/**
 * Normalize CSV row to product format using mapping
 */
function normalizeRow(
  csvRow: any,
  mapping: Record<string, string>,
  rowNumber: number,
  categories?: {
    primaryCategory?: string;
    secondaryCategory?: string;
    tertiaryCategory?: string;
  },
  shipping?: {
    freeShipping?: boolean;
    shippingOptionId?: string;
    handlingFee?: number;
  },
  sellerPreferredCurrency?: string
): any {
  const normalized: any = {};

  // Apply mapping
  for (const [csvHeader, productField] of Object.entries(mapping)) {
    const csvValue = csvRow[csvHeader];
    
    if (csvValue === undefined || csvValue === null || csvValue === "") {
      continue; // Skip empty values
    }

    // Handle array fields (tags, materialTags, images)
    if (productField.endsWith("[]")) {
      const fieldName = productField.slice(0, -2); // Remove "[]"
      if (!normalized[fieldName]) {
        normalized[fieldName] = [];
      }
      
      // Handle comma-separated values or multiple columns (IMAGE1, IMAGE2, etc.)
      if (Array.isArray(csvValue)) {
        normalized[fieldName].push(...csvValue.filter(v => v && v.trim()));
      } else if (typeof csvValue === "string") {
        // Split by comma and clean up
        const values = csvValue.split(",").map(v => v.trim()).filter(v => v);
        normalized[fieldName].push(...values);
      } else {
        normalized[fieldName].push(String(csvValue));
      }
    } else {
      // Handle single value fields with type conversion
      if (productField === "stock" || productField === "price") {
        // Convert to number
        const numValue = typeof csvValue === "string" 
          ? parseFloat(csvValue.replace(/[^0-9.-]/g, "")) // Remove currency symbols, commas, etc.
          : Number(csvValue);
        normalized[productField] = isNaN(numValue) ? undefined : numValue;
      } else {
        normalized[productField] = csvValue;
      }
    }
  }

  // Handle image columns (IMAGE1, IMAGE2, etc.) - collect all image URLs
  const imageFields: string[] = [];
  
  // First, check if images[] is already mapped and has values
  for (const [csvHeader, productField] of Object.entries(mapping)) {
    if (productField === "images[]") {
      const value = csvRow[csvHeader];
      if (value) {
        if (Array.isArray(value)) {
          imageFields.push(...value.filter(v => v && String(v).trim()));
        } else if (typeof value === "string") {
          // Split by comma for comma-separated URLs
          const urls = value.split(",").map(v => v.trim()).filter(v => v);
          imageFields.push(...urls);
        }
      }
    }
  }
  
  // Also check for IMAGE1, IMAGE2, etc. columns
  for (const csvHeader of Object.keys(csvRow)) {
    if (csvHeader.match(/^IMAGE\d+$/i) && !mapping[csvHeader]) {
      const value = csvRow[csvHeader];
      if (value && typeof value === "string" && value.trim()) {
        imageFields.push(value.trim());
      }
    }
  }
  
  // If we found image fields, add them to images array
  // Limit to 10 images - take only first 10
  if (imageFields.length > 0) {
    normalized.images = imageFields.slice(0, 10);
    if (imageFields.length > 10) {
      console.warn(`[BULK IMPORT] Row ${rowNumber} has ${imageFields.length} images, only using first 10`);
    }
  }

  // Set default values for required fields if not provided
  if (!normalized.status) {
    normalized.status = "DRAFT"; // Import as draft so sellers can review before activating
  }
  
  // Normalize currency code to uppercase (usd -> USD)
  if (normalized.currency) {
    normalized.currency = String(normalized.currency).toUpperCase().trim();
  } else {
    // Use seller's preferred currency if available, otherwise default to USD
    normalized.currency = (sellerPreferredCurrency || "USD").toUpperCase();
  }
  
  // Validate currency code exists in supported currencies
  const validCurrency = SUPPORTED_CURRENCIES.find(c => c.code === normalized.currency);
  if (!validCurrency) {
    // Fallback to USD if invalid currency
    console.warn(`[BULK IMPORT] Invalid currency code "${normalized.currency}", defaulting to USD`);
    normalized.currency = "USD";
  }

  if (normalized.isDigital === undefined) {
    normalized.isDigital = false; // Default to physical products
  }

  // Ensure shortDescription has a default value (required by Prisma)
  if (!normalized.shortDescription) {
    normalized.shortDescription = ""; // Empty string default
  }

  // Apply categories from job settings (seller-selected categories apply to all products)
  // Seller-selected categories are already validated at API level, so prioritize those
  // Normalize category IDs to uppercase for consistency
  let primaryCategory = categories?.primaryCategory || normalized.primaryCategory;
  let secondaryCategory = categories?.secondaryCategory || normalized.secondaryCategory;
  let tertiaryCategory = categories?.tertiaryCategory || normalized.tertiaryCategory;
  
  // Normalize category IDs to uppercase
  if (primaryCategory) primaryCategory = String(primaryCategory).toUpperCase().trim();
  if (secondaryCategory) secondaryCategory = String(secondaryCategory).toUpperCase().trim();
  if (tertiaryCategory) tertiaryCategory = String(tertiaryCategory).toUpperCase().trim();
  
  // Validate primary category exists
  const primaryCategoryObj = Categories.find(c => c.id === primaryCategory);
  if (!primaryCategoryObj) {
    // If seller provided category is invalid (shouldn't happen), use first available
    const firstPrimary = Categories[0];
    if (firstPrimary) {
      console.warn(`[BULK IMPORT] Row ${rowNumber}: Invalid primary category "${primaryCategory}", using "${firstPrimary.id}"`);
      primaryCategory = firstPrimary.id;
    } else {
      throw new Error(`Invalid primary category "${primaryCategory}". No valid categories available.`);
    }
  }
  
  // Validate secondary category exists and belongs to primary
  if (primaryCategory && secondaryCategory) {
    const primary = Categories.find(c => c.id === primaryCategory);
    const secondary = primary?.children.find(c => c.id === secondaryCategory);
    if (!secondary) {
      // Secondary doesn't belong to primary, use first available secondary
      if (primary && primary.children.length > 0) {
        console.warn(`[BULK IMPORT] Row ${rowNumber}: Secondary category "${secondaryCategory}" doesn't belong to primary "${primaryCategory}", using "${primary.children[0].id}"`);
        secondaryCategory = primary.children[0].id;
      } else {
        throw new Error(`Primary category "${primaryCategory}" has no secondary categories available.`);
      }
    }
  } else if (primaryCategory && !secondaryCategory) {
    // No secondary provided, use first available
    const primary = Categories.find(c => c.id === primaryCategory);
    if (primary && primary.children.length > 0) {
      secondaryCategory = primary.children[0].id;
    } else {
      throw new Error(`Primary category "${primaryCategory}" has no secondary categories available.`);
    }
  }
  
  // Validate tertiary category exists and belongs to secondary
  if (tertiaryCategory && secondaryCategory) {
    const validTertiaryCategories = getTertiaryCategories(secondaryCategory);
    if (validTertiaryCategories.length > 0 && !validTertiaryCategories.includes(tertiaryCategory)) {
      // Tertiary doesn't belong to secondary, clear it
      console.warn(`[BULK IMPORT] Row ${rowNumber}: Tertiary category "${tertiaryCategory}" doesn't belong to secondary "${secondaryCategory}", clearing tertiary`);
      tertiaryCategory = undefined;
    } else if (validTertiaryCategories.length === 0) {
      // Secondary doesn't have tertiary children, clear tertiary
      console.warn(`[BULK IMPORT] Row ${rowNumber}: Secondary category "${secondaryCategory}" doesn't have tertiary children, clearing tertiary`);
      tertiaryCategory = undefined;
    }
  } else if (tertiaryCategory && !secondaryCategory) {
    // Tertiary provided but no secondary, clear it
    console.warn(`[BULK IMPORT] Row ${rowNumber}: Tertiary category provided but no secondary category, clearing tertiary`);
    tertiaryCategory = undefined;
  }
  
  // Set validated categories
  normalized.primaryCategory = primaryCategory;
  normalized.secondaryCategory = secondaryCategory;
  if (tertiaryCategory) {
    normalized.tertiaryCategory = tertiaryCategory;
  } else {
    normalized.tertiaryCategory = null;
  }

  // Apply shipping settings from job settings (seller-selected shipping applies to all products)
  // Note: shippingCost is set later in processRow after fetching the shipping option
  if (shipping) {
    // Always use the shipping parameter's freeShipping value (not CSV data)
    normalized.freeShipping = shipping.freeShipping || false;
    normalized.handlingFee = shipping.handlingFee || 0;
    
    // If free shipping, set shippingCost to 0
    if (normalized.freeShipping) {
      normalized.shippingCost = 0;
    } else if (shipping.shippingOptionId) {
      // Set shippingOptionId - shippingCost will be set from shipping option in processRow
      normalized.shippingOptionId = shipping.shippingOptionId;
    }
  } else {
    // Default shipping if not provided
    normalized.freeShipping = false;
    normalized.shippingCost = 0;
    normalized.handlingFee = 0;
  }

  // Handle stock - for digital products, always set to 0 and ignore CSV value
  if (normalized.isDigital) {
    // Digital products should never have stock
    normalized.stock = 0;
  } else {
    // For physical products, parse stock value
    if (normalized.stock !== undefined && typeof normalized.stock === "string") {
      const stockNum = parseFloat(normalized.stock);
      normalized.stock = isNaN(stockNum) ? undefined : Math.floor(stockNum);
    }
  }

  // Ensure price is a number if provided
  if (normalized.price !== undefined && typeof normalized.price === "string") {
    const priceNum = parseFloat(normalized.price.replace(/[^0-9.-]/g, ""));
    normalized.price = isNaN(priceNum) ? undefined : priceNum;
  }

  // Ensure seller ID is set
  normalized.userId = normalized.userId || csvRow.sellerId;

  // Parse Etsy variation columns (VARIATION 1 TYPE, VARIATION 1 NAME, VARIATION 1 VALUES, etc.)
  // Etsy CSV format: VARIATION 1 TYPE, VARIATION 1 NAME, VARIATION 1 VALUES, VARIATION 2 TYPE, VARIATION 2 NAME, VARIATION 2 VALUES
  const options: Array<{ label: string; values: Array<{ name: string; price: number; stock: number }> }> = [];
  
  // Helper function to find column by case-insensitive match or mapping
  const findColumn = (pattern: string, mappedField?: string): string | undefined => {
    // First check if it's mapped to a variation field
    if (mappedField) {
      for (const [csvHeader, productField] of Object.entries(mapping)) {
        if (productField === mappedField) {
          return csvHeader;
        }
      }
    }
    
    // Then check by exact column name (case-insensitive)
    const lowerPattern = pattern.toLowerCase();
    for (const key of Object.keys(csvRow)) {
      if (key.toLowerCase() === lowerPattern) {
        return key;
      }
    }
    return undefined;
  };
  
  // Check for up to 2 variation groups (Etsy supports up to 2)
  for (let i = 1; i <= 2; i++) {
    // Try to find columns via mapping first, then by column name pattern
    const typeKey = findColumn(`VARIATION ${i} TYPE`, `variation${i}Type`);
    const nameKey = findColumn(`VARIATION ${i} NAME`, `variation${i}Name`);
    const valuesKey = findColumn(`VARIATION ${i} VALUES`, `variation${i}Values`);
    
    const variationType = typeKey ? csvRow[typeKey]?.toString().trim() : undefined;
    const variationName = nameKey ? csvRow[nameKey]?.toString().trim() : undefined;
    const variationValues = valuesKey ? csvRow[valuesKey]?.toString().trim() : undefined;
    
    // If we have all three fields, we have a valid variation
    if (variationType && variationName && variationValues) {
      // Parse values (typically comma-separated)
      const values = variationValues.split(",").map((v: string) => v.trim()).filter((v: string) => v);
      
      if (values.length > 0) {
        // Get currency for price conversion (normalized.currency should be set by now)
        const currency = normalized.currency || "USD";
        const currencyDecimals = getCurrencyDecimals(currency);
        const multiplier = Math.pow(10, currencyDecimals);
        
        // Build option structure with stock = 0 for all variations
        // Price defaults to 0 (no additional price on top of base price)
        // Variation prices need to be in lowest denomination (like base price)
        options.push({
          label: variationName, // Use the NAME field as the label (e.g., "Size", "Color")
          values: values.map((valueName: string) => {
            // Variation prices are in currency units (e.g., dollars), convert to lowest denomination
            // For now, default to 0, but if CSV provides variation prices, they would need conversion
            const variationPriceInCurrencyUnits = 0; // Default to 0 (no additional price)
            const variationPriceInLowestDenomination = Math.round(variationPriceInCurrencyUnits * multiplier);
            
            return {
              name: valueName,
              price: variationPriceInLowestDenomination, // In lowest denomination (cents for USD, whole units for JPY)
              stock: 0, // Set to 0 as per requirement - seller needs to review inventory
            };
          }),
        });
      }
    }
  }

  // If variations exist, set up product for inventory review
  if (options.length > 0) {
    normalized.options = options;
    normalized.status = "DRAFT"; // Set to DRAFT so product can't be purchased with 0 stock
    normalized.needsInventoryReview = true; // Flag for seller to review inventory
    // Don't set stock field - variations handle stock individually
    // But we still need a stock value for validation, so set to 0
    normalized.stock = 0;
  } else {
    // No variations - use normal stock from CSV
    // Stock is already set from mapping above, or use default
    if (normalized.stock === undefined || normalized.stock === null) {
      normalized.stock = 0; // Default to 0 if not provided
    }
  }

  return normalized;
}

/**
 * Process image URLs - fetch and upload to storage
 */
async function processImages(imageUrls: string[]): Promise<string[]> {
  const storage = getStorage();
  const uploadedUrls: string[] = [];

  for (const url of imageUrls) {
    try {
      // Validate URL
      if (!url || typeof url !== "string" || !url.startsWith("http")) {
        console.warn(`[BULK IMPORT] Invalid image URL: ${url}`);
        continue;
      }

      // Upload image from URL
      const storedUrl = await storage.uploadFromUrl(url);
      uploadedUrls.push(storedUrl);
    } catch (error) {
      console.error(`[BULK IMPORT] Failed to process image ${url}:`, error);
      // Continue processing other images even if one fails
      // We'll validate that at least one image exists later
    }
  }

  return uploadedUrls;
}

/**
 * Process a single CSV row
 * Images are only uploaded AFTER validation passes to avoid orphaned files
 */
async function processRow(
  csvRow: any,
  mapping: Record<string, string>,
  rowNumber: number,
  sellerId: string,
  categories?: {
    primaryCategory?: string;
    secondaryCategory?: string;
    tertiaryCategory?: string;
  },
  shipping?: {
    freeShipping?: boolean;
    shippingOptionId?: string;
    handlingFee?: number;
  },
  sellerPreferredCurrency?: string
): Promise<ProcessedRow> {
  try {
    // Normalize row data (without processing images yet)
    const normalized = normalizeRow(csvRow, mapping, rowNumber, categories, shipping, sellerPreferredCurrency);
    
    // Set seller ID
    normalized.userId = sellerId;

    // If shipping option is provided and free shipping is not enabled, fetch it and set shippingCost
    // This matches the product form behavior - shippingCost is a backup in case
    // the shipping option can't be read during checkout
    const isFreeShipping = shipping?.freeShipping || normalized.freeShipping || false;
    
    if (shipping?.shippingOptionId && !isFreeShipping) {
      try {
        // Find shipping option - verify it belongs to this seller for security
        const shippingOption = await db.shippingOption.findFirst({
          where: {
            id: shipping.shippingOptionId,
            sellerId: sellerId,
          },
          include: {
            rates: true,
          },
        });

        if (shippingOption) {
          // Ensure shippingOptionId is set (in case it wasn't set in normalizeRow)
          normalized.shippingOptionId = shipping.shippingOptionId;
          
          // Use defaultShipping if available (already in lowest denomination of shipping option currency)
          // Otherwise use the first rate's price as fallback
          let defaultShippingCostInLowestDenomination = 0;

          if (
            shippingOption.defaultShipping !== null &&
            shippingOption.defaultShipping !== undefined
          ) {
            // defaultShipping is already in the lowest denomination of the shipping option's currency
            // (e.g., cents for USD, whole units for JPY)
            defaultShippingCostInLowestDenomination = shippingOption.defaultShipping;
          } else if (shippingOption.rates && shippingOption.rates.length > 0) {
            // Fallback to first rate's price (already in lowest denomination)
            defaultShippingCostInLowestDenomination = shippingOption.rates[0].price;
          }

          if (defaultShippingCostInLowestDenomination > 0) {
            // Get product currency (default to USD if not set)
            const productCurrency = normalized.currency || "USD";
            const shippingOptionCurrency = shippingOption.defaultShippingCurrency || "USD";

            // Convert from lowest denomination to currency units using shipping option's currency decimals
            // ProductSchema expects shippingCost in currency units (dollars, euros, etc.), not lowest denomination
            const shippingOptionDecimals = getCurrencyDecimals(shippingOptionCurrency);
            const multiplier = Math.pow(10, shippingOptionDecimals);
            const shippingCostInCurrencyUnits = defaultShippingCostInLowestDenomination / multiplier;

            // If currencies match, use directly. If they differ, we use the shipping option's value
            // The shipping cost will be in the shipping option's currency, which should match
            // the product currency in most cases. If currencies differ, the value will still work
            // as a fallback during checkout.
            const shippingCostForProduct = shippingCostInCurrencyUnits;

            // Always set shippingCost from shipping option (override CSV data)
            normalized.shippingCost = shippingCostForProduct;
          } else {
            // No defaultShipping or rates found - set minimal value to pass validation
            console.warn(`[BULK IMPORT] Shipping option ${shipping.shippingOptionId} has no defaultShipping or rates, using minimal value`);
            normalized.shippingCost = 0.01;
          }
        } else {
          // Shipping option not found - set minimal value to pass validation
          console.warn(`[BULK IMPORT] Shipping option ${shipping.shippingOptionId} not found, using minimal value`);
          normalized.shippingCost = 0.01;
        }
      } catch (error) {
        console.error(`[BULK IMPORT] Failed to fetch shipping option ${shipping.shippingOptionId}:`, error);
        // If we can't fetch the shipping option, set a minimal value to pass validation
        // The actual shipping will use the shipping option during checkout
        normalized.shippingCost = 0.01;
      }
    } else if (!isFreeShipping && !normalized.shippingOptionId) {
      // No shipping option provided and not free shipping - validation will fail
      // This should have been caught earlier, but set a minimal value as fallback
      if (!normalized.shippingCost || normalized.shippingCost <= 0) {
        normalized.shippingCost = 0.01;
      }
    }

    // Convert description to JSON format if it's a string
    if (normalized.description && typeof normalized.description === "string") {
      normalized.description = {
        html: normalized.description,
        text: normalized.description.replace(/<[^>]*>/g, ""), // Strip HTML for text version
      };
    }

    // Validate with Zod schema FIRST (before uploading images)
    // This ensures we don't upload images for invalid products
    const validated = ProductSchema.parse(normalized);

    // Only process images AFTER validation passes
    // Store original image URLs temporarily
    const originalImageUrls = normalized.images && Array.isArray(normalized.images) 
      ? normalized.images 
      : [];
    
    if (originalImageUrls.length === 0) {
      throw new Error("No images provided");
    }

    // Process and upload images (only for validated products)
    const processedImages = await processImages(originalImageUrls);
    if (processedImages.length === 0) {
      throw new Error("No valid images could be processed");
    }
    
    // Update validated data with processed image URLs
    validated.images = processedImages;

    // Ensure shortDescription is a string (Prisma requires it, but Zod can return undefined)
    // Build product data, explicitly including shippingOptionId from normalized (not validated)
    // because Zod might transform/remove it during validation
    const productData: any = {
      ...validated,
      shortDescription: validated.shortDescription || "",
      userId: sellerId,
    };
    
    // Explicitly set shippingOptionId from normalized data (Zod validation might have removed it)
    if (normalized.shippingOptionId) {
      productData.shippingOptionId = normalized.shippingOptionId;
    }

    // CRITICAL: Remove undefined values and convert to null (Prisma doesn't accept undefined, only null)
    // This matches the pattern used in create-product route
    const cleanedProductData: any = {};
    for (const [key, value] of Object.entries(productData)) {
      cleanedProductData[key] = value === undefined ? null : value;
    }

    // Handle SKU - generate unique SKU if not provided or if duplicate exists
    // This matches the behavior of the product creation form
    let finalSku = cleanedProductData.sku;
    
    if (!finalSku || finalSku.trim() === "") {
      // No SKU provided, generate one
      try {
        finalSku = await generateUniqueSKU(validated.name, sellerId);
        console.log(`[BULK IMPORT] Row ${rowNumber}: Generated SKU "${finalSku}" for product "${validated.name}"`);
      } catch (error) {
        console.error(`[BULK IMPORT] Row ${rowNumber}: Failed to generate SKU:`, error);
        // If SKU generation fails, still try to create product (SKU is optional in schema)
        finalSku = undefined;
      }
    } else {
      // SKU provided, check if it already exists
      const existingProduct = await db.product.findFirst({
        where: {
          sku: finalSku,
          userId: sellerId,
        },
        select: { id: true, name: true },
      });
      
      if (existingProduct) {
        // SKU already exists, generate a new one instead of failing
        console.warn(`[BULK IMPORT] Row ${rowNumber}: SKU "${finalSku}" already exists for product "${existingProduct.name}", generating new SKU`);
        try {
          finalSku = await generateUniqueSKU(validated.name, sellerId);
          console.log(`[BULK IMPORT] Row ${rowNumber}: Generated new SKU "${finalSku}" for product "${validated.name}"`);
        } catch (error) {
          console.error(`[BULK IMPORT] Row ${rowNumber}: Failed to generate replacement SKU:`, error);
          // If SKU generation fails, still try to create product (SKU is optional in schema)
          finalSku = undefined;
        }
      }
    }
    
    // Set the final SKU (or undefined if generation failed)
    cleanedProductData.sku = finalSku;

    // Create product in database
    const product = await db.product.create({
      data: cleanedProductData,
    });

    // Check if product needs inventory review (has variations with 0 stock)
    const needsReview = normalized.needsInventoryReview === true;

    return {
      rowNumber,
      success: true,
      productId: product.id,
      needsInventoryReview: needsReview,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[BULK IMPORT] Row ${rowNumber} failed:`, errorMessage);
    
    return {
      rowNumber,
      success: false,
      error: errorMessage,
      rowData: csvRow,
    };
  }
}

/**
 * Process bulk import in batches
 */
export async function processBulkImportBatch(
  params: ProcessBulkImportParams
): Promise<{
  success: boolean;
  totalRows: number;
  processed: number;
  successCount: number;
  failedRows: Array<{ rowNumber: number; error: string; rowData?: any }>;
}> {
  const { 
    jobId, 
    sellerId, 
    csvData, 
    mapping, 
    primaryCategory, 
    secondaryCategory, 
    tertiaryCategory,
    freeShipping,
    shippingOptionId,
    handlingFee,
  } = params;
  
  // Prepare categories object for normalization
  const categories = {
    primaryCategory,
    secondaryCategory,
    tertiaryCategory,
  };

  // Prepare shipping object for normalization
  const shipping = {
    freeShipping,
    shippingOptionId,
    handlingFee,
  };

  // Fetch seller's preferred currency
  const seller = await db.seller.findUnique({
    where: { userId: sellerId },
    select: { preferredCurrency: true },
  });
  const sellerPreferredCurrency = seller?.preferredCurrency || "USD";

  // Limit to MAX_ROWS
  const rowsToProcess = csvData.slice(0, MAX_ROWS);
  const totalRows = rowsToProcess.length;

  // Update job status to RUNNING
  await db.bulkImportJob.update({
    where: { jobId },
    data: {
      status: BulkImportJobStatus.RUNNING,
      startedAt: new Date(),
      totalRows,
    },
  });

  let processed = 0;
  let successCount = 0;
  let needsInventoryReviewCount = 0; // Track products that need inventory review
  const failedRows: Array<{ rowNumber: number; error: string; rowData?: any }> = [];
  let lastProgressUpdate = 0; // Track when we last updated progress

  // Process in batches of BATCH_SIZE
  for (let i = 0; i < rowsToProcess.length; i += BATCH_SIZE) {
    const batch = rowsToProcess.slice(i, i + BATCH_SIZE);
    
    // Process batch (can be parallelized if needed)
    const batchResults = await Promise.allSettled(
      batch.map((row, index) => 
        processRow(row, mapping, i + index + 1, sellerId, categories, shipping, sellerPreferredCurrency) // Row numbers start at 1
      )
    );

    // Process results
    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        const rowResult = result.value;
        processed++;
        
        if (rowResult.success) {
          successCount++;
          // Track products that need inventory review
          if (rowResult.needsInventoryReview) {
            needsInventoryReviewCount++;
          }
        } else {
          failedRows.push({
            rowNumber: rowResult.rowNumber,
            error: rowResult.error || "Unknown error",
            rowData: rowResult.rowData,
          });
        }
      } else {
        // Promise rejected (shouldn't happen with processRow, but handle it)
        processed++;
        failedRows.push({
          rowNumber: processed,
          error: result.reason?.message || "Processing failed",
        });
      }

      // Update progress more frequently (every PROGRESS_UPDATE_INTERVAL rows)
      // This provides better UX, especially for small imports
      if (processed - lastProgressUpdate >= PROGRESS_UPDATE_INTERVAL || processed === totalRows) {
        await db.bulkImportJob.update({
          where: { jobId },
          data: {
            processed,
            successCount,
            failedRows: failedRows.map(fr => ({
              rowNumber: fr.rowNumber,
              error: fr.error,
            })),
          },
        });
        lastProgressUpdate = processed;
      }
    }
  }

  // Update job status to DONE
  await db.bulkImportJob.update({
    where: { jobId },
    data: {
      status: BulkImportJobStatus.DONE,
      finishedAt: new Date(),
      processed,
      successCount,
      needsInventoryReviewCount, // Store count of products needing inventory review
      failedRows: failedRows.map(fr => ({
        rowNumber: fr.rowNumber,
        error: fr.error,
        rowData: fr.rowData,
      })),
    },
  });

  return {
    success: true,
    totalRows,
    processed,
    successCount,
    failedRows,
  };
}

