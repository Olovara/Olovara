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
import {
  Categories,
  findCategoryById,
} from "@/data/categories";
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
  },
  shipping?: {
    freeShipping?: boolean;
    shippingOptionId?: string;
    handlingFee?: number;
  },
  sellerPreferredCurrency?: string,
  sourcePlatform?: string
): any {
  const normalized: any = {};

  // Fields to auto-skip for Wix (not needed for product creation)
  const WIX_SKIP_FIELDS = [
    "ribbon",
    "surcharge",
    "visible",
    "discountMode",
    "discountValue",
    "cost",
    "brand",
  ];
  // Also skip productOptionType1-6 (we use productOptionName and productOptionDescription instead)
  // Skip additionalInfoTitle1-6 (Wix additional info fields)
  for (let i = 1; i <= 6; i++) {
    WIX_SKIP_FIELDS.push(`productOptionType${i}`);
    WIX_SKIP_FIELDS.push(`additionalInfoTitle${i}`);
    WIX_SKIP_FIELDS.push(`additionalInfo${i}`);
  }

  // Apply mapping
  for (const [csvHeader, productField] of Object.entries(mapping)) {
    // Auto-skip Wix fields that aren't needed
    if (sourcePlatform === "Wix") {
      const headerLower = csvHeader.toLowerCase().trim();
      if (WIX_SKIP_FIELDS.some((skipField) => headerLower === skipField.toLowerCase())) {
        continue; // Skip this field
      }
    }

    const csvValue = csvRow[csvHeader];

    if (csvValue === undefined || csvValue === null || csvValue === "") {
      continue; // Skip empty values
    }

    // Handle array fields (tags, materialTags, images, keywords)
    if (productField.endsWith("[]")) {
      const fieldName = productField.slice(0, -2); // Remove "[]"
      if (!normalized[fieldName]) {
        normalized[fieldName] = [];
      }

      // Handle comma-separated values or multiple columns (IMAGE1, IMAGE2, etc.)
      if (Array.isArray(csvValue)) {
        normalized[fieldName].push(...csvValue.filter((v) => v && v.trim()));
      } else if (typeof csvValue === "string") {
        // Split by comma and clean up
        const values = csvValue
          .split(",")
          .map((v) => v.trim())
          .filter((v) => v);
        normalized[fieldName].push(...values);
      } else {
        normalized[fieldName].push(String(csvValue));
      }
    } else {
      // Handle single value fields with type conversion
      if (productField === "stock" || productField === "price") {
        // Convert to number
        const numValue =
          typeof csvValue === "string"
            ? parseFloat(csvValue.replace(/[^0-9.-]/g, "")) // Remove currency symbols, commas, etc.
            : Number(csvValue);
        normalized[productField] = isNaN(numValue) ? undefined : numValue;
      } else if (
        productField === "itemWeight" ||
        productField === "itemLength" ||
        productField === "itemWidth" ||
        productField === "itemHeight"
      ) {
        // Convert dimension/weight fields to number
        const numValue =
          typeof csvValue === "string"
            ? parseFloat(csvValue.replace(/[^0-9.-]/g, ""))
            : Number(csvValue);
        // Only set if valid number and greater than 0 (schema requires > 0 if provided)
        if (!isNaN(numValue) && numValue > 0) {
          normalized[productField] = numValue;
        }
        // If invalid or <= 0, don't set it (will be undefined, which schema allows)
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
          imageFields.push(...value.filter((v) => v && String(v).trim()));
      } else if (typeof value === "string") {
        // Wix uses semicolons, other platforms use commas
        const separator = sourcePlatform === "Wix" ? ";" : ",";
        const urls = value
          .split(separator)
          .map((v) => v.trim())
          .filter((v) => v);
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

  // Handle Wix image filenames - construct full URLs if needed
  // Wix CSVs may contain just filenames like "c557f8_065b65d1859d482ba8dcefbc07f1ba2c~mv2.jpg"
  // Full URL format: https://static.wixstatic.com/media/<MEDIA_ID>
  if (sourcePlatform === "Wix" && imageFields.length > 0) {
    imageFields.forEach((imageValue, index) => {
      // Trim whitespace and check if it's already a URL
      const trimmedValue = imageValue.trim();
      if (!trimmedValue) {
        // Empty value after trimming - remove it
        imageFields[index] = "";
        return;
      }

      // Check if it's already a URL (starts with http/https)
      if (
        !trimmedValue.startsWith("http://") &&
        !trimmedValue.startsWith("https://")
      ) {
        // It's a filename, construct the full Wix URL
        // Ensure no leading/trailing slashes in the filename
        const cleanFilename = trimmedValue.replace(/^\/+|\/+$/g, "");
        const wixImageUrl = `https://static.wixstatic.com/media/${cleanFilename}`;
        imageFields[index] = wixImageUrl;
        console.log(
          `[BULK IMPORT] Row ${rowNumber}: Constructed Wix image URL from filename "${cleanFilename}" -> ${wixImageUrl}`
        );
      } else {
        // Already a URL - log for debugging
        console.log(
          `[BULK IMPORT] Row ${rowNumber}: Image already has full URL: ${trimmedValue}`
        );
      }
    });

    // Filter out any empty values that were created
    const filteredImages = imageFields.filter((img) => img && img.trim());
    if (filteredImages.length !== imageFields.length) {
      console.warn(
        `[BULK IMPORT] Row ${rowNumber}: Filtered out ${imageFields.length - filteredImages.length} empty image(s)`
      );
    }
    // Update imageFields array in place
    imageFields.length = 0;
    imageFields.push(...filteredImages);
  }

  // If we found image fields, add them to images array
  // Limit to 10 images - take only first 10
  if (imageFields.length > 0) {
    normalized.images = imageFields.slice(0, 10);
    if (imageFields.length > 10) {
      console.warn(
        `[BULK IMPORT] Row ${rowNumber} has ${imageFields.length} images, only using first 10`
      );
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
  const validCurrency = SUPPORTED_CURRENCIES.find(
    (c) => c.code === normalized.currency
  );
  if (!validCurrency) {
    // Fallback to USD if invalid currency
    console.warn(
      `[BULK IMPORT] Invalid currency code "${normalized.currency}", defaulting to USD`
    );
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
  let primaryCategory =
    categories?.primaryCategory || normalized.primaryCategory;
  let secondaryCategory =
    categories?.secondaryCategory || normalized.secondaryCategory;
  let tertiaryCategory =
    categories?.tertiaryCategory || normalized.tertiaryCategory;

  // Normalize category IDs to uppercase
  if (primaryCategory)
    primaryCategory = String(primaryCategory).toUpperCase().trim();
  if (secondaryCategory)
    secondaryCategory = String(secondaryCategory).toUpperCase().trim();
  if (tertiaryCategory)
    tertiaryCategory = String(tertiaryCategory).toUpperCase().trim();

  // Validate primary category exists
  const primaryCategoryObj = Categories.find((c) => c.id === primaryCategory);
  if (!primaryCategoryObj) {
    // If seller provided category is invalid (shouldn't happen), use first available
    const firstPrimary = Categories[0];
    if (firstPrimary) {
      console.warn(
        `[BULK IMPORT] Row ${rowNumber}: Invalid primary category "${primaryCategory}", using "${firstPrimary.id}"`
      );
      primaryCategory = firstPrimary.id;
    } else {
      throw new Error(
        `Invalid primary category "${primaryCategory}". No valid categories available.`
      );
    }
  }

  // Validate secondary category exists and belongs to primary
  if (primaryCategory && secondaryCategory) {
    const primary = Categories.find((c) => c.id === primaryCategory);
    const secondary = primary?.children.find((c) => c.id === secondaryCategory);
    if (!secondary) {
      // Secondary doesn't belong to primary, use first available secondary
      if (primary && primary.children.length > 0) {
        console.warn(
          `[BULK IMPORT] Row ${rowNumber}: Secondary category "${secondaryCategory}" doesn't belong to primary "${primaryCategory}", using "${primary.children[0].id}"`
        );
        secondaryCategory = primary.children[0].id;
      } else {
        throw new Error(
          `Primary category "${primaryCategory}" has no secondary categories available.`
        );
      }
    }
  } else if (primaryCategory && !secondaryCategory) {
    // No secondary provided, use first available
    const primary = Categories.find((c) => c.id === primaryCategory);
    if (primary && primary.children.length > 0) {
      secondaryCategory = primary.children[0].id;
    } else {
      throw new Error(
        `Primary category "${primaryCategory}" has no secondary categories available.`
      );
    }
  }

  // Set validated categories
  normalized.primaryCategory = primaryCategory;
  normalized.secondaryCategory = secondaryCategory;

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
    // Note: Wix's "inventory" field is "InStock" status, not a quantity
    // So for Wix, stock will be set later based on whether variations exist
    if (
      normalized.stock !== undefined &&
      typeof normalized.stock === "string"
    ) {
      // Check if it's a status string like "InStock" (Wix) vs a number
      if (normalized.stock.toLowerCase() === "instock" || normalized.stock.toLowerCase() === "outofstock") {
        // It's a status, not a quantity - will be handled below
        normalized.stock = undefined;
      } else {
        // Try to parse as number
        const stockNum = parseFloat(normalized.stock);
        normalized.stock = isNaN(stockNum) ? undefined : Math.floor(stockNum);
      }
    }
  }

  // Ensure price is a number if provided
  if (normalized.price !== undefined && typeof normalized.price === "string") {
    const priceNum = parseFloat(normalized.price.replace(/[^0-9.-]/g, ""));
    normalized.price = isNaN(priceNum) ? undefined : priceNum;
  }

  // Ensure seller ID is set
  normalized.userId = normalized.userId || csvRow.sellerId;

  // Parse variation columns
  // Etsy CSV format: VARIATION 1 TYPE, VARIATION 1 NAME, VARIATION 1 VALUES, VARIATION 2 TYPE, VARIATION 2 NAME, VARIATION 2 VALUES
  // Wix CSV format: productOptionName1-6, productOptionType1-6, productOptionDescription1-6 (semicolon-separated values)
  const options: Array<{
    label: string;
    values: Array<{ name: string; price: number; stock: number }>;
  }> = [];

  // Helper function to find column by case-insensitive match or mapping
  const findColumn = (
    pattern: string,
    mappedField?: string
  ): string | undefined => {
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

  // Check for variations - Etsy supports up to 2, Wix supports up to 6
  const maxVariations = sourcePlatform === "Wix" ? 6 : 2;
  for (let i = 1; i <= maxVariations; i++) {
    // Try to find columns via mapping first, then by column name pattern
    const typeKey = findColumn(`VARIATION ${i} TYPE`, `variation${i}Type`);
    const nameKey = findColumn(`VARIATION ${i} NAME`, `variation${i}Name`);
    const valuesKey = findColumn(
      `VARIATION ${i} VALUES`,
      `variation${i}Values`
    );

    const variationType = typeKey
      ? csvRow[typeKey]?.toString().trim()
      : undefined;
    const variationName = nameKey
      ? csvRow[nameKey]?.toString().trim()
      : undefined;
    const variationValues = valuesKey
      ? csvRow[valuesKey]?.toString().trim()
      : undefined;

    // If we have all three fields, we have a valid variation
    if (variationType && variationName && variationValues) {
      // Parse values - Wix uses semicolons, Etsy uses commas
      const separator = sourcePlatform === "Wix" ? ";" : ",";
      const values = variationValues
        .split(separator)
        .map((v: string) => v.trim())
        .filter((v: string) => v);

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
            const variationPriceInLowestDenomination = Math.round(
              variationPriceInCurrencyUnits * multiplier
            );

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
    // For Wix, inventory is "InStock" status (not a quantity), so default to 0
    // Seller will need to set actual stock quantity
    if (normalized.stock === undefined || normalized.stock === null) {
      if (sourcePlatform === "Wix") {
        // Wix doesn't provide quantity, just "InStock" status
        // Set to 0 so seller must review and set actual stock
        normalized.stock = 0;
        normalized.needsInventoryReview = true; // Flag for review since we don't have actual quantity
      } else {
        normalized.stock = 0; // Default to 0 if not provided
      }
    }
  }

  return normalized;
}

/**
 * Process image URLs - fetch and upload to storage
 */
async function processImages(imageUrls: string[]): Promise<{
  uploadedUrls: string[];
  failedUrls: Array<{ url: string; error: string }>;
}> {
  const storage = getStorage();
  const uploadedUrls: string[] = [];
  const failedUrls: Array<{ url: string; error: string }> = [];

  console.log(
    `[BULK IMPORT] Processing ${imageUrls.length} image URL(s):`,
    imageUrls
  );

  for (const url of imageUrls) {
    try {
      // Validate URL
      if (!url || typeof url !== "string" || !url.startsWith("http")) {
        failedUrls.push({
          url,
          error: "Invalid URL format (must start with http:// or https://)",
        });
        console.warn(
          `[BULK IMPORT] Invalid image URL format: "${url}" (type: ${typeof url})`
        );
        continue;
      }

      console.log(`[BULK IMPORT] Attempting to fetch and upload: ${url}`);

      // Upload image from URL
      const storedUrl = await storage.uploadFromUrl(url);
      uploadedUrls.push(storedUrl);
      console.log(
        `[BULK IMPORT] Successfully uploaded image: ${url} -> ${storedUrl}`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      failedUrls.push({ url, error: errorMessage });
      console.error(
        `[BULK IMPORT] Failed to process image ${url}:`,
        errorMessage,
        error instanceof Error ? error.stack : ""
      );
      // Continue processing other images even if one fails
      // We'll validate that at least one image exists later
    }
  }

  console.log(
    `[BULK IMPORT] Image processing complete: ${uploadedUrls.length} succeeded, ${failedUrls.length} failed`
  );

  return { uploadedUrls, failedUrls };
}

/**
 * Process a Wix product group (product row + variant rows)
 * Builds variations from variant rows instead of parsing semicolon-separated values
 */
async function processWixProductGroup(
  productRow: any,
  variantRows: any[],
  mapping: Record<string, string>,
  rowNumber: number,
  sellerId: string,
  categories?: {
    primaryCategory?: string;
    secondaryCategory?: string;
  },
  shipping?: {
    freeShipping?: boolean;
    shippingOptionId?: string;
    handlingFee?: number;
  },
  sellerPreferredCurrency?: string
): Promise<ProcessedRow> {
  try {
    // Normalize product row data (without processing images yet)
    const normalized = normalizeRow(
      productRow,
      mapping,
      rowNumber,
      categories,
      shipping,
      sellerPreferredCurrency,
      "Wix"
    );

    // Set seller ID
    normalized.userId = sellerId;

    // Build variations from variant rows
    // Wix variant rows contain the actual variation values
    const options: Array<{
      label: string;
      values: Array<{ name: string; price: number; stock: number }>;
    }> = [];

    // Helper to get value from row
    const getValue = (row: any, field: string): string | undefined => {
      // Try direct access first
      if (row[field] !== undefined) return row[field]?.toString().trim();
      // Try case-insensitive
      for (const key of Object.keys(row)) {
        if (key.toLowerCase() === field.toLowerCase()) {
          return row[key]?.toString().trim();
        }
      }
      return undefined;
    };

    // Check for variation options in product row (productOptionName1-6)
    // Note: productOptionType is auto-skipped, we only need the name
    for (let i = 1; i <= 6; i++) {
      const optionName = getValue(productRow, `productOptionName${i}`);

      if (optionName) {
        // Found a variation option - collect values from variant rows
        const variantValues: string[] = [];
        
        // If we have variant rows, collect values from them
        if (variantRows.length > 0) {
          variantRows.forEach((variantRow) => {
            const variantValue = getValue(variantRow, `productOptionDescription${i}`);
            if (variantValue && variantValue.trim()) {
              variantValues.push(variantValue.trim());
            }
          });
        } else {
          // No variant rows - try to parse semicolon-separated values from product row
          const productOptionDesc = getValue(productRow, `productOptionDescription${i}`);
          if (productOptionDesc && productOptionDesc.trim()) {
            // Wix uses semicolons to separate values in productOptionDescription
            const values = productOptionDesc
              .split(";")
              .map((v: string) => v.trim())
              .filter((v: string) => v.length > 0);
            variantValues.push(...values);
          }
        }

        // Deduplicate variant values to prevent duplicate variation names
        const uniqueVariantValues = Array.from(new Set(variantValues));

        // If we have variant values, create the option
        if (uniqueVariantValues.length > 0) {
          // Get currency for price conversion
          const currency = normalized.currency || "USD";
          const currencyDecimals = getCurrencyDecimals(currency);
          const multiplier = Math.pow(10, currencyDecimals);

          options.push({
            label: optionName,
            values: uniqueVariantValues.map((valueName: string) => {
              // Variation prices default to 0 (no additional price)
              const variationPriceInCurrencyUnits = 0;
              const variationPriceInLowestDenomination = Math.round(
                variationPriceInCurrencyUnits * multiplier
              );

              return {
                name: valueName,
                price: variationPriceInLowestDenomination,
                stock: 0, // Set to 0 - seller needs to review inventory
              };
            }),
          });
        }
      }
    }

    // If variations exist, set up product for inventory review
    if (options.length > 0) {
      normalized.options = options;
      normalized.status = "DRAFT";
      normalized.needsInventoryReview = true;
      normalized.stock = 0;
    } else {
      // No variations - Wix doesn't provide quantity, so set to 0 and flag for review
      normalized.stock = 0;
      normalized.needsInventoryReview = true;
    }

    // Continue with normal processing (shipping, validation, images, etc.)
    // This is the same as processRow but we've already built the variations
    return await processRowWithNormalizedData(
      normalized,
      productRow,
      rowNumber,
      sellerId,
      categories,
      shipping
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`[BULK IMPORT] Row ${rowNumber} failed:`, errorMessage);

    return {
      rowNumber,
      success: false,
      error: errorMessage,
      rowData: productRow,
    };
  }
}

/**
 * Process normalized data (shared logic for processRow and processWixProductGroup)
 */
async function processRowWithNormalizedData(
  normalized: any,
  csvRow: any,
  rowNumber: number,
  sellerId: string,
  categories?: {
    primaryCategory?: string;
    secondaryCategory?: string;
  },
  shipping?: {
    freeShipping?: boolean;
    shippingOptionId?: string;
    handlingFee?: number;
  }
): Promise<ProcessedRow> {
  try {
    // If shipping option is provided and free shipping is not enabled, fetch it and set shippingCost
    const isFreeShipping =
      shipping?.freeShipping || normalized.freeShipping || false;

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
          // Ensure shippingOptionId is set
          normalized.shippingOptionId = shipping.shippingOptionId;

          // Use defaultShipping if available
          let defaultShippingCostInLowestDenomination = 0;

          if (
            shippingOption.defaultShipping !== null &&
            shippingOption.defaultShipping !== undefined
          ) {
            defaultShippingCostInLowestDenomination =
              shippingOption.defaultShipping;
          } else if (shippingOption.rates && shippingOption.rates.length > 0) {
            defaultShippingCostInLowestDenomination =
              shippingOption.rates[0].price;
          }

          if (defaultShippingCostInLowestDenomination > 0) {
            const productCurrency = normalized.currency || "USD";
            const shippingOptionCurrency =
              shippingOption.defaultShippingCurrency || "USD";

            const shippingOptionDecimals = getCurrencyDecimals(
              shippingOptionCurrency
            );
            const multiplier = Math.pow(10, shippingOptionDecimals);
            const shippingCostInCurrencyUnits =
              defaultShippingCostInLowestDenomination / multiplier;

            normalized.shippingCost = shippingCostInCurrencyUnits;
          } else {
            console.warn(
              `[BULK IMPORT] Shipping option ${shipping.shippingOptionId} has no defaultShipping or rates, using minimal value`
            );
            normalized.shippingCost = 0.01;
          }
        } else {
          console.warn(
            `[BULK IMPORT] Shipping option ${shipping.shippingOptionId} not found, using minimal value`
          );
          normalized.shippingCost = 0.01;
        }
      } catch (error) {
        console.error(
          `[BULK IMPORT] Failed to fetch shipping option ${shipping.shippingOptionId}:`,
          error
        );
        normalized.shippingCost = 0.01;
      }
    } else if (!isFreeShipping && !normalized.shippingOptionId) {
      if (!normalized.shippingCost || normalized.shippingCost <= 0) {
        normalized.shippingCost = 0.01;
      }
    }

    // Convert description to JSON format if it's a string
    if (normalized.description && typeof normalized.description === "string") {
      normalized.description = {
        html: normalized.description,
        text: normalized.description.replace(/<[^>]*>/g, ""),
      };
    }

    // Validate optional fields separately and exclude invalid ones
    // This prevents optional field errors from failing the entire row
    const optionalFieldsToValidate = [
      "metaTitle",
      "metaDescription",
      "ogTitle",
      "ogDescription",
      "ogImage",
      "safetyWarnings",
      "materialsComposition",
      "safeUseInstructions",
      "ageRestriction",
      "chemicalWarnings",
      "careInstructions",
      "itemWeight",
      "itemWeightUnit",
      "itemLength",
      "itemWidth",
      "itemHeight",
      "itemDimensionUnit",
      "shippingNotes",
      "howItsMade",
    ];

    // Create a copy of normalized data for validation
    const dataForValidation = { ...normalized };
    const invalidOptionalFields: string[] = [];

    // Validate optional fields using safeParse approach
    // Try full validation first, and if it fails, remove problematic optional fields
    let validationResult = ProductSchema.safeParse(dataForValidation);
    
    if (!validationResult.success) {
      // Check if errors are only in optional fields
      const errorPaths = validationResult.error.errors.map((e) => e.path.join("."));
      const optionalFieldErrors = errorPaths.filter((path) =>
        optionalFieldsToValidate.includes(path)
      );

      // If all errors are in optional fields, remove them and retry
      if (optionalFieldErrors.length === errorPaths.length) {
        for (const field of optionalFieldErrors) {
          console.warn(
            `[BULK IMPORT] Row ${rowNumber}: Optional field "${field}" validation failed, excluding from product data`
          );
          invalidOptionalFields.push(field);
          delete dataForValidation[field];
        }
        // Retry validation after removing invalid optional fields
        validationResult = ProductSchema.safeParse(dataForValidation);
      } else {
        // Some required fields have errors - this will fail the row
        throw validationResult.error;
      }
    }

    // Log if any optional fields were excluded
    if (invalidOptionalFields.length > 0) {
      console.log(
        `[BULK IMPORT] Row ${rowNumber}: Excluded ${invalidOptionalFields.length} invalid optional field(s): ${invalidOptionalFields.join(", ")}`
      );
    }

    // If validation still failed after removing optional fields, throw error
    if (!validationResult.success) {
      throw validationResult.error;
    }

    // Validate with Zod schema FIRST (before uploading images)
    // Use validated data from safeParse
    const validated = validationResult.data;

    // Only process images AFTER validation passes
    const originalImageUrls =
      normalized.images && Array.isArray(normalized.images)
        ? normalized.images
        : [];

    if (originalImageUrls.length === 0) {
      throw new Error("No images provided");
    }

    // Process and upload images (only for validated products)
    const imageResult = await processImages(originalImageUrls);
    if (imageResult.uploadedUrls.length === 0) {
      // Provide detailed error message about which images failed
      const errorDetails = imageResult.failedUrls
        .map((f) => `${f.url}: ${f.error}`)
        .join("; ");
      throw new Error(
        `No valid images could be processed. Failed images: ${errorDetails}`
      );
    }

    // Log warnings if some images failed but at least one succeeded
    if (imageResult.failedUrls.length > 0) {
      console.warn(
        `[BULK IMPORT] Row ${rowNumber}: ${imageResult.failedUrls.length} image(s) failed, but ${imageResult.uploadedUrls.length} succeeded`
      );
    }

    // Update validated data with processed image URLs
    validated.images = imageResult.uploadedUrls;

    // Build product data
    const productData: any = {
      ...validated,
      shortDescription: validated.shortDescription || "",
      userId: sellerId,
    };

    // Explicitly set shippingOptionId
    if (normalized.shippingOptionId) {
      productData.shippingOptionId = normalized.shippingOptionId;
    }

    // Remove undefined values and convert to null
    const cleanedProductData: any = {};
    for (const [key, value] of Object.entries(productData)) {
      cleanedProductData[key] = value === undefined ? null : value;
    }

    // Handle SKU
    let finalSku = cleanedProductData.sku;

    if (!finalSku || finalSku.trim() === "") {
      try {
        finalSku = await generateUniqueSKU(validated.name, sellerId);
        console.log(
          `[BULK IMPORT] Row ${rowNumber}: Generated SKU "${finalSku}" for product "${validated.name}"`
        );
      } catch (error) {
        console.error(
          `[BULK IMPORT] Row ${rowNumber}: Failed to generate SKU:`,
          error
        );
        finalSku = undefined;
      }
    } else {
      const existingProduct = await db.product.findFirst({
        where: {
          sku: finalSku,
          userId: sellerId,
        },
        select: { id: true, name: true },
      });

      if (existingProduct) {
        console.warn(
          `[BULK IMPORT] Row ${rowNumber}: SKU "${finalSku}" already exists for product "${existingProduct.name}", generating new SKU`
        );
        try {
          finalSku = await generateUniqueSKU(validated.name, sellerId);
          console.log(
            `[BULK IMPORT] Row ${rowNumber}: Generated new SKU "${finalSku}" for product "${validated.name}"`
          );
        } catch (error) {
          console.error(
            `[BULK IMPORT] Row ${rowNumber}: Failed to generate replacement SKU:`,
            error
          );
          finalSku = undefined;
        }
      }
    }

    cleanedProductData.sku = finalSku;

    // Create product in database
    const product = await db.product.create({
      data: cleanedProductData,
    });

    const needsReview = normalized.needsInventoryReview === true;

    return {
      rowNumber,
      success: true,
      productId: product.id,
      needsInventoryReview: needsReview,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
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
  },
  shipping?: {
    freeShipping?: boolean;
    shippingOptionId?: string;
    handlingFee?: number;
  },
  sellerPreferredCurrency?: string,
  sourcePlatform?: string
): Promise<ProcessedRow> {
  try {
    // Normalize row data (without processing images yet)
    const normalized = normalizeRow(
      csvRow,
      mapping,
      rowNumber,
      categories,
      shipping,
      sellerPreferredCurrency,
      sourcePlatform
    );

    // Set seller ID
    normalized.userId = sellerId;
    
    // Use shared processing logic
    return await processRowWithNormalizedData(
      normalized,
      csvRow,
      rowNumber,
      sellerId,
      categories,
      shipping
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
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
    sourcePlatform,
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

  // Pre-process Wix CSV: group product rows with their variant rows
  // Wix has separate rows for products and variants - we need to group them by handleId
  let rowsToProcess: any[] = csvData.slice(0, MAX_ROWS);
  let groupedRows: Array<{ productRow: any; variantRows: any[]; originalRowNumbers: number[] }> = [];
  
  if (sourcePlatform === "Wix") {
    // Group rows by handleId - product row followed by variant rows
    const rowsByHandleId = new Map<string, { productRow: any; variantRows: any[]; originalRowNumbers: number[] }>();
    
    rowsToProcess.forEach((row, index) => {
      const handleId = row.handleId || row["handleId"];
      const fieldType = row.fieldType || row["fieldType"];
      
      if (!handleId) {
        // Skip rows without handleId
        return;
      }
      
      if (fieldType === "Product") {
        // This is a product row - create new group or update existing
        if (!rowsByHandleId.has(handleId)) {
          rowsByHandleId.set(handleId, {
            productRow: row,
            variantRows: [],
            originalRowNumbers: [index + 1], // Row numbers start at 1
          });
        } else {
          // Product row already exists - this shouldn't happen, but update it
          const group = rowsByHandleId.get(handleId)!;
          group.productRow = row;
          group.originalRowNumbers.push(index + 1);
        }
      } else if (fieldType === "Variant") {
        // This is a variant row - add to the product group
        if (!rowsByHandleId.has(handleId)) {
          // Variant without product - create a placeholder (shouldn't happen in valid CSV)
          console.warn(`[BULK IMPORT] Variant row found without product row for handleId: ${handleId}`);
          rowsByHandleId.set(handleId, {
            productRow: null,
            variantRows: [row],
            originalRowNumbers: [index + 1],
          });
        } else {
          const group = rowsByHandleId.get(handleId)!;
          group.variantRows.push(row);
          group.originalRowNumbers.push(index + 1);
        }
      }
    });
    
    // Convert map to array, filtering out groups without product rows
    groupedRows = Array.from(rowsByHandleId.values()).filter(
      (group) => group.productRow !== null
    );
    
    console.log(
      `[BULK IMPORT] Grouped Wix CSV: ${rowsToProcess.length} total rows, ${groupedRows.length} product groups`
    );
    
    // For non-Wix platforms, create single-row groups
  } else {
    groupedRows = rowsToProcess.map((row, index) => ({
      productRow: row,
      variantRows: [],
      originalRowNumbers: [index + 1],
    }));
  }

  const totalRows = groupedRows.length;

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
  const failedRows: Array<{ rowNumber: number; error: string; rowData?: any }> =
    [];
  let lastProgressUpdate = 0; // Track when we last updated progress

  // Process in batches of BATCH_SIZE
  for (let i = 0; i < groupedRows.length; i += BATCH_SIZE) {
    const batch = groupedRows.slice(i, i + BATCH_SIZE);

    // Process batch (can be parallelized if needed)
    const batchResults = await Promise.allSettled(
      batch.map((group, index) => {
        const rowNumber = i + index + 1; // Row numbers start at 1
        
        // For Wix, use processWixProductGroup to handle product + variants
        if (sourcePlatform === "Wix") {
          return processWixProductGroup(
            group.productRow,
            group.variantRows,
            mapping,
            rowNumber,
            sellerId,
            categories,
            shipping,
            sellerPreferredCurrency
          );
        } else {
          // For other platforms, use regular processRow
          return processRow(
            group.productRow,
            mapping,
            rowNumber,
            sellerId,
            categories,
            shipping,
            sellerPreferredCurrency,
            sourcePlatform
          );
        }
      })
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
      if (
        processed - lastProgressUpdate >= PROGRESS_UPDATE_INTERVAL ||
        processed === totalRows
      ) {
        await db.bulkImportJob.update({
          where: { jobId },
          data: {
            processed,
            successCount,
            failedRows: failedRows.map((fr) => ({
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
      failedRows: failedRows.map((fr) => ({
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
