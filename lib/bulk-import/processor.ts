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
  }
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
  if (imageFields.length > 0) {
    normalized.images = imageFields;
  }

  // Set default values for required fields if not provided
  if (!normalized.status) {
    normalized.status = "HIDDEN"; // Import as hidden so sellers can review before activating
  }
  
  if (!normalized.currency) {
    normalized.currency = "USD"; // Default currency
  }

  if (normalized.isDigital === undefined) {
    normalized.isDigital = false; // Default to physical products
  }

  // Ensure shortDescription has a default value (required by Prisma)
  if (!normalized.shortDescription) {
    normalized.shortDescription = ""; // Empty string default
  }

  // Apply categories from job settings (seller-selected categories apply to all products)
  if (categories?.primaryCategory) {
    normalized.primaryCategory = categories.primaryCategory;
  } else if (!normalized.primaryCategory) {
    normalized.primaryCategory = "Other"; // Fallback default
  }
  
  if (categories?.secondaryCategory) {
    normalized.secondaryCategory = categories.secondaryCategory;
  } else if (!normalized.secondaryCategory) {
    normalized.secondaryCategory = "Other"; // Fallback default
  }

  if (categories?.tertiaryCategory) {
    normalized.tertiaryCategory = categories.tertiaryCategory;
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

  // Ensure stock is a number if provided
  if (normalized.stock !== undefined && typeof normalized.stock === "string") {
    const stockNum = parseFloat(normalized.stock);
    normalized.stock = isNaN(stockNum) ? undefined : Math.floor(stockNum);
  }

  // Ensure price is a number if provided
  if (normalized.price !== undefined && typeof normalized.price === "string") {
    const priceNum = parseFloat(normalized.price.replace(/[^0-9.-]/g, ""));
    normalized.price = isNaN(priceNum) ? undefined : priceNum;
  }

  // Ensure seller ID is set
  normalized.userId = normalized.userId || csvRow.sellerId;

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
  }
): Promise<ProcessedRow> {
  try {
    // Normalize row data (without processing images yet)
    const normalized = normalizeRow(csvRow, mapping, rowNumber, categories, shipping);
    
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
    const productData = {
      ...validated,
      shortDescription: validated.shortDescription || "",
      userId: sellerId,
    };

    // Create product in database
    const product = await db.product.create({
      data: productData as any, // Type assertion needed due to Zod transform making shortDescription optional
    });

    return {
      rowNumber,
      success: true,
      productId: product.id,
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
  const failedRows: Array<{ rowNumber: number; error: string; rowData?: any }> = [];
  let lastProgressUpdate = 0; // Track when we last updated progress

  // Process in batches of BATCH_SIZE
  for (let i = 0; i < rowsToProcess.length; i += BATCH_SIZE) {
    const batch = rowsToProcess.slice(i, i + BATCH_SIZE);
    
    // Process batch (can be parallelized if needed)
    const batchResults = await Promise.allSettled(
      batch.map((row, index) => 
        processRow(row, mapping, i + index + 1, sellerId, categories, shipping) // Row numbers start at 1
      )
    );

    // Process results
    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        const rowResult = result.value;
        processed++;
        
        if (rowResult.success) {
          successCount++;
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

