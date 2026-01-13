/**
 * CSV header mapping utilities
 * Handles automatic mapping using Fuse.js and manual mapping
 */

import Fuse from "fuse.js";
import type { FuseResult } from "fuse.js";

// Product field definitions for mapping
export const PRODUCT_FIELDS = [
  { field: "name", label: "Product Name", required: true },
  { field: "description", label: "Description", required: true },
  { field: "price", label: "Price", required: true },
  { field: "currency", label: "Currency", required: false },
  { field: "stock", label: "Stock/Quantity", required: false },
  { field: "sku", label: "SKU", required: false },
  { field: "tags[]", label: "Tags", required: false, isArray: true },
  {
    field: "materialTags[]",
    label: "Materials",
    required: false,
    isArray: true,
  },
  { field: "images[]", label: "Images", required: true, isArray: true },
  { field: "shortDescription", label: "Short Description", required: false },
  { field: "primaryCategory", label: "Primary Category", required: false },
  { field: "secondaryCategory", label: "Secondary Category", required: false },
  { field: "tertiaryCategory", label: "Tertiary Category", required: false },
  // Variation fields (auto-detected by column name pattern, but can be mapped manually)
  { field: "variation1Type", label: "Variation 1 Type", required: false },
  { field: "variation1Name", label: "Variation 1 Name", required: false },
  { field: "variation1Values", label: "Variation 1 Values", required: false },
  { field: "variation2Type", label: "Variation 2 Type", required: false },
  { field: "variation2Name", label: "Variation 2 Name", required: false },
  { field: "variation2Values", label: "Variation 2 Values", required: false },
  // SEO fields
  { field: "metaTitle", label: "Meta Title", required: false },
  { field: "metaDescription", label: "Meta Description", required: false },
  { field: "ogTitle", label: "OG Title", required: false },
  { field: "ogDescription", label: "OG Description", required: false },
  { field: "ogImage", label: "OG Image", required: false },
  { field: "keywords[]", label: "Keywords", required: false, isArray: true },
  // Safety fields
  { field: "safetyWarnings", label: "Safety Warnings", required: false },
  { field: "materialsComposition", label: "Materials Composition", required: false },
  { field: "safeUseInstructions", label: "Safe Use Instructions", required: false },
  { field: "ageRestriction", label: "Age Restriction", required: false },
  { field: "chemicalWarnings", label: "Chemical Warnings", required: false },
  { field: "careInstructions", label: "Care Instructions", required: false },
  // Item dimension fields
  { field: "itemWeight", label: "Item Weight", required: false },
  { field: "itemWeightUnit", label: "Item Weight Unit", required: false },
  { field: "itemLength", label: "Item Length", required: false },
  { field: "itemWidth", label: "Item Width", required: false },
  { field: "itemHeight", label: "Item Height", required: false },
  { field: "itemDimensionUnit", label: "Item Dimension Unit", required: false },
  // Additional optional fields
  { field: "shippingNotes", label: "Shipping Notes", required: false },
  { field: "howItsMade", label: "How It's Made", required: false },
];

// Common CSV header patterns for different platforms
export const PLATFORM_PATTERNS: Record<string, Record<string, string[]>> = {
  Etsy: {
    name: ["title", "listing_title", "name", "product_name"],
    description: ["description", "listing_description", "details"],
    price: ["price", "listing_price", "cost"],
    currency: ["currency", "currency_code"],
    stock: ["quantity", "inventory", "stock"],
    sku: ["sku", "product_sku", "item_sku"],
    "tags[]": ["tags", "tag", "categories"],
    "materialTags[]": ["materials", "material", "fabric"],
    "images[]": [
      "image",
      "image_url",
      "photo",
      "image1",
      "image2",
      "image3",
      "image4",
      "image5",
      "image6",
      "image7",
      "image8",
      "image9",
      "image10",
    ],
    variation1Type: ["variation 1 type", "variation1type", "var1type"],
    variation1Name: ["variation 1 name", "variation1name", "var1name"],
    variation1Values: ["variation 1 values", "variation1values", "var1values"],
    variation2Type: ["variation 2 type", "variation2type", "var2type"],
    variation2Name: ["variation 2 name", "variation2name", "var2name"],
    variation2Values: ["variation 2 values", "variation2values", "var2values"],
  },
  Shopify: {
    name: ["title", "name", "product_title"],
    description: ["body_html", "description", "product_description"],
    price: ["price", "variant_price", "cost"],
    currency: ["currency", "currency_code"],
    stock: ["inventory_quantity", "quantity", "stock"],
    sku: ["sku", "variant_sku"],
    "tags[]": ["tags", "tag"],
    "materialTags[]": ["material", "fabric"],
    "images[]": ["image_src", "image", "image_url"],
  },
  WooCommerce: {
    name: ["name", "product_name", "title"],
    description: ["description", "short_description", "product_description"],
    price: ["price", "regular_price", "sale_price"],
    currency: ["currency", "currency_code"],
    stock: ["stock_quantity", "quantity", "stock"],
    sku: ["sku", "product_sku"],
    "tags[]": ["tags", "product_tags"],
    "materialTags[]": ["material", "fabric"],
    "images[]": ["image", "image_url", "product_image"],
  },
  Squarespace: {
    name: ["title", "name", "product_name"],
    description: ["description", "body"],
    price: ["price", "cost"],
    currency: ["currency"],
    stock: ["quantity", "inventory"],
    sku: ["sku", "product_sku"],
    "tags[]": ["tags", "categories"],
    "materialTags[]": ["material"],
    "images[]": ["image", "image_url"],
  },
  Wix: {
    name: ["name"],
    description: ["description"],
    price: ["price"],
    currency: ["currency", "currency_code"], // May not be in CSV, will default to seller's preferred currency
    // Note: inventory is "InStock" status, not a quantity - stock will default to 0 for products with variations
    sku: ["sku"],
    "tags[]": ["collection"], // Note: brand is auto-skipped, removed from tags mapping
    "materialTags[]": [], // Note: brand is auto-skipped
    "images[]": ["productImageUrl"],
    // Wix variations: productOptionName1-6 defines the option name, productOptionDescription1-6 contains semicolon-separated values
    // Variants are separate rows with fieldType="Variant" that reference the product by handleId
    // Note: productOptionType1-6 are auto-skipped (we use productOptionName and productOptionDescription instead)
    // Note: productOptionDescription1-6 are NOT auto-mapped - sellers must manually select them to prevent incorrect mapping
    variation1Name: ["productOptionName1"],
    variation1Values: [], // productOptionDescription1 intentionally NOT auto-mapped - let seller select manually
    variation2Name: ["productOptionName2"],
    variation2Values: [], // productOptionDescription2 intentionally NOT auto-mapped
    variation3Name: ["productOptionName3"],
    variation3Values: [], // productOptionDescription3 intentionally NOT auto-mapped
    variation4Name: ["productOptionName4"],
    variation4Values: [], // productOptionDescription4 intentionally NOT auto-mapped
    variation5Name: ["productOptionName5"],
    variation5Values: [], // productOptionDescription5 intentionally NOT auto-mapped
    variation6Name: ["productOptionName6"],
    variation6Values: [], // productOptionDescription6 intentionally NOT auto-mapped
  },
};

/**
 * Auto-map CSV headers to product fields using Fuse.js
 */
export function autoMapHeaders(
  csvHeaders: string[],
  sourcePlatform?: string
): Record<string, string> {
  const mapping: Record<string, string> = {};

  // For Wix, automatically skip productOptionType1-6 headers (they just indicate field type like "dropdown")
  // Also skip additionalInfoTitle1-6 (Wix additional info fields that aren't needed)
  if (sourcePlatform === "Wix") {
    for (let i = 1; i <= 6; i++) {
      const headerToSkip = `productOptionType${i}`;
      if (csvHeaders.includes(headerToSkip)) {
        mapping[headerToSkip] = "SKIP"; // Mark as skip so it doesn't appear in unmapped columns
      }
      // Also skip additionalInfoTitle fields
      const additionalInfoHeader = `additionalInfoTitle${i}`;
      if (csvHeaders.includes(additionalInfoHeader)) {
        mapping[additionalInfoHeader] = "SKIP";
      }
    }
    
    // CRITICAL: Mark productOptionDescription headers as "DO_NOT_MAP" at the start
    // This prevents them from being matched by any logic
    // We'll remove this marker at the end so they appear in unmapped columns
    for (const header of csvHeaders) {
      if (/^productOptionDescription\d+$/i.test(header)) {
        mapping[header] = "DO_NOT_MAP"; // Temporary marker to prevent any matching
      }
    }
  }

  // If platform is specified, use platform-specific patterns first
  if (sourcePlatform && PLATFORM_PATTERNS[sourcePlatform]) {
    const platformPatterns = PLATFORM_PATTERNS[sourcePlatform];

    // For Wix, prioritize variation fields to prevent productOptionDescription from matching description
    const fieldOrder = sourcePlatform === "Wix" 
      ? Object.keys(platformPatterns).sort((a, b) => {
          // Put variation fields first
          const aIsVariation = a.startsWith("variation");
          const bIsVariation = b.startsWith("variation");
          if (aIsVariation && !bIsVariation) return -1;
          if (!aIsVariation && bIsVariation) return 1;
          return 0;
        })
      : Object.keys(platformPatterns);

    for (const productField of fieldOrder) {
      const patterns = platformPatterns[productField];
      if (!patterns || patterns.length === 0) continue;

      // Find matching CSV header
      for (const csvHeader of csvHeaders) {
        // Skip if already mapped (including "DO_NOT_MAP" marker)
        if (mapping[csvHeader]) continue;

        // For Wix, skip productOptionDescription headers entirely - let sellers map them manually
        // This prevents incorrect auto-mapping to description fields
        if (sourcePlatform === "Wix" && /^productOptionDescription\d+$/i.test(csvHeader)) {
          continue; // Skip auto-mapping - let seller select manually
        }

        const normalizedHeader = csvHeader.toLowerCase().trim();

        // Check if header matches any pattern
        // For Wix variation fields, require exact match to prevent false matches
        const matched = patterns.some((pattern) => {
          const normalizedPattern = pattern.toLowerCase().trim();
          
          // For Wix variation fields, only exact match (case-insensitive)
          // This is critical to prevent productOptionDescription1 from matching description fields
          if (sourcePlatform === "Wix" && productField.startsWith("variation")) {
            // Exact match only - no substring matching
            const isMatch = normalizedHeader === normalizedPattern;
            if (isMatch) {
              console.log(`[AUTO-MAP] Wix: Matched "${csvHeader}" to "${productField}" via platform pattern`);
            }
            return isMatch;
          }
          
          // For other fields, try exact match first, then contains
          return (
            normalizedHeader === normalizedPattern ||
            normalizedHeader.includes(normalizedPattern)
          );
        });

        if (matched) {
          mapping[csvHeader] = productField;
          console.log(`[AUTO-MAP] Mapped "${csvHeader}" → "${productField}"`);
          // For Wix variation fields, break immediately after first match
          // This prevents the header from being considered for other fields
          if (sourcePlatform === "Wix" && productField.startsWith("variation")) {
            break;
          }
          // For other fields, continue to check if multiple headers could match
          break; // Only map one header per field
        }
      }
    }
  }

  // Use Fuse.js for fuzzy matching on remaining headers
  // For Wix, exclude additionalInfoTitle headers from fuzzy matching (but allow productOptionDescription for manual mapping)
  const remainingHeaders = csvHeaders.filter((h) => {
    // Skip already mapped headers
    if (Object.keys(mapping).includes(h)) return false;
    
    // For Wix, exclude additional info headers from fuzzy matching
    // Note: productOptionDescription headers are NOT excluded - they'll appear in unmapped columns for manual selection
    if (sourcePlatform === "Wix") {
      // Exclude additionalInfoTitle1-6 (Wix additional info fields)
      if (/^additionalInfoTitle\d+$/i.test(h)) return false;
      if (/^additionalInfo\d+$/i.test(h)) return false;
    }
    
    return true;
  });

  if (remainingHeaders.length > 0) {
    // Separate required and optional fields - process required fields first
    const requiredFields = PRODUCT_FIELDS.filter((f) => f.required);
    const optionalFields = PRODUCT_FIELDS.filter((f) => !f.required);

    // Process required fields first, then optional fields
    const fieldsToProcess = [...requiredFields, ...optionalFields];

    for (const productField of fieldsToProcess) {
      const fieldName = productField.field;

      // Skip if already mapped
      if (Object.values(mapping).includes(fieldName)) {
        continue;
      }

      // For Wix, skip productOptionDescription headers in fuzzy matching - let sellers map them manually
      // This prevents incorrect auto-mapping to description fields

      // Get current remaining headers (may have changed from previous iterations)
      // Use the filtered remainingHeaders list which already excludes Wix-specific headers
      const currentRemainingHeaders = remainingHeaders.filter(
        (h) => !Object.keys(mapping).includes(h)
      );

      if (currentRemainingHeaders.length === 0) {
        break; // All headers mapped
      }

      // First, try exact match (case-insensitive)
      const exactMatch = currentRemainingHeaders.find((header) => {
        // For Wix, skip productOptionDescription headers in exact matching - let sellers map them manually
        if (sourcePlatform === "Wix" && /^productOptionDescription\d+$/i.test(header)) {
          return false; // Skip - let seller select manually
        }
        
        const normalizedHeader = header.toLowerCase().trim();
        const normalizedField = fieldName.replace("[]", "").toLowerCase();
        const normalizedLabel = productField.label.toLowerCase();

        // Check exact matches first
        return (
          normalizedHeader === normalizedField ||
          normalizedHeader === normalizedLabel ||
          (PLATFORM_PATTERNS[sourcePlatform || "Etsy"]?.[fieldName] || []).some(
            (pattern) => normalizedHeader === pattern.toLowerCase().trim()
          )
        );
      });

      if (exactMatch) {
        mapping[exactMatch] = fieldName;
        continue; // Move to next field
      }

      // If no exact match, use Fuse.js for fuzzy matching
      // For Wix, exclude productOptionDescription and additionalInfoTitle headers from fuzzy matching
      // productOptionDescription headers should only be mapped manually by sellers
      const headersForFuzzyMatch = sourcePlatform === "Wix"
        ? currentRemainingHeaders.filter((h) => {
            // Exclude productOptionDescription headers - let sellers map them manually
            if (/^productOptionDescription\d+$/i.test(h)) return false;
            // Exclude additional info headers
            if (/^additionalInfoTitle\d+$/i.test(h)) return false;
            if (/^additionalInfo\d+$/i.test(h)) return false;
            return true;
          })
        : currentRemainingHeaders;

      if (headersForFuzzyMatch.length === 0) {
        continue; // No headers to match
      }

      const searchTerms = [
        productField.label.toLowerCase(),
        fieldName.replace("[]", "").toLowerCase(),
        ...(PLATFORM_PATTERNS[sourcePlatform || "Etsy"]?.[fieldName] || []).map(
          (p) => p.toLowerCase()
        ),
      ];

      // Use Fuse.js to find best match
      const fuse = new Fuse(headersForFuzzyMatch, {
        threshold: 0.4, // Lower threshold = more strict matching
        includeScore: true,
      });

      // Search for each term
      let bestMatch: FuseResult<string> | null = null;
      for (const term of searchTerms) {
        const results = fuse.search(term);
        if (results.length > 0) {
          const result = results[0];
          if (!bestMatch || (result.score && result.score < bestMatch.score!)) {
            bestMatch = result;
          }
        }
      }

      // If we found a good match, add it to mapping
      // Use stricter threshold for required fields to avoid mismatches
      const threshold = productField.required ? 0.3 : 0.5;
      if (bestMatch && bestMatch.score && bestMatch.score < threshold) {
        mapping[bestMatch.item] = fieldName;
      }
    }
  }

  // Handle image columns (IMAGE1, IMAGE2, etc.)
  for (const header of csvHeaders) {
    if (header.match(/^IMAGE\d+$/i) && !mapping[header]) {
      mapping[header] = "images[]";
    }
  }

  // CRITICAL: For Wix, remove ANY auto-mappings of productOptionDescription headers
  // These should NEVER be auto-mapped - sellers must manually select them
  // This fixes any incorrect mappings that might have occurred despite our safeguards
  // We remove ALL mappings (even to variation fields) to force manual selection
  if (sourcePlatform === "Wix") {
    // Check ALL mapping keys (not just csvHeaders) to catch any case variations
    for (const mappedHeader of Object.keys(mapping)) {
      // Check if this header matches productOptionDescription pattern (case-insensitive)
      if (/^productOptionDescription\d+$/i.test(mappedHeader)) {
        const currentMapping = mapping[mappedHeader];
        // Remove ANY mapping (including "DO_NOT_MAP" marker, variation fields, etc.) - sellers must manually select
        // This prevents any auto-mapping, even if it's technically correct
        if (currentMapping && currentMapping !== "SKIP") {
          console.warn(
            `[AUTO-MAP] Removing auto-mapping for "${mappedHeader}" (was mapped to "${currentMapping}") - requires manual selection`
          );
          delete mapping[mappedHeader]; // Remove the mapping so it appears in unmapped columns
        }
      }
    }
  }

  return mapping;
}

/**
 * Validate mapping completeness
 */
export function validateMapping(
  mapping: Record<string, string>,
  csvHeaders: string[]
): { valid: boolean; missing: string[] } {
  const requiredFields = PRODUCT_FIELDS.filter((f) => f.required).map(
    (f) => f.field
  );
  const mappedFields = Object.values(mapping);
  const missing = requiredFields.filter(
    (field) => !mappedFields.includes(field)
  );

  return {
    valid: missing.length === 0,
    missing,
  };
}
