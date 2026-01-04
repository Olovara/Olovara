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
  { field: "materialTags[]", label: "Materials", required: false, isArray: true },
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
    "images[]": ["image", "image_url", "photo", "image1", "image2", "image3", "image4", "image5", "image6", "image7", "image8", "image9", "image10"],
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
};

/**
 * Auto-map CSV headers to product fields using Fuse.js
 */
export function autoMapHeaders(
  csvHeaders: string[],
  sourcePlatform?: string
): Record<string, string> {
  const mapping: Record<string, string> = {};

  // If platform is specified, use platform-specific patterns first
  if (sourcePlatform && PLATFORM_PATTERNS[sourcePlatform]) {
    const platformPatterns = PLATFORM_PATTERNS[sourcePlatform];

    for (const [productField, patterns] of Object.entries(platformPatterns)) {
      // Find matching CSV header
      for (const csvHeader of csvHeaders) {
        const normalizedHeader = csvHeader.toLowerCase().trim();
        
        // Check if header matches any pattern (exact match or contains pattern)
        const matched = patterns.some(pattern => {
          const normalizedPattern = pattern.toLowerCase();
          // Try exact match first, then contains
          return normalizedHeader === normalizedPattern || normalizedHeader.includes(normalizedPattern);
        });
        
        if (matched) {
          mapping[csvHeader] = productField;
          break; // Only map one header per field
        }
      }
    }
  }

  // Use Fuse.js for fuzzy matching on remaining headers
  const remainingHeaders = csvHeaders.filter(
    (h) => !Object.keys(mapping).includes(h)
  );

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

      // Get current remaining headers (may have changed from previous iterations)
      const currentRemainingHeaders = csvHeaders.filter(
        (h) => !Object.keys(mapping).includes(h)
      );

      if (currentRemainingHeaders.length === 0) {
        break; // All headers mapped
      }

      // First, try exact match (case-insensitive)
      const exactMatch = currentRemainingHeaders.find((header) => {
        const normalizedHeader = header.toLowerCase().trim();
        const normalizedField = fieldName.replace("[]", "").toLowerCase();
        const normalizedLabel = productField.label.toLowerCase();
        
        // Check exact matches first
        return normalizedHeader === normalizedField || 
               normalizedHeader === normalizedLabel ||
               (PLATFORM_PATTERNS[sourcePlatform || "Etsy"]?.[fieldName] || []).some(
                 (pattern) => normalizedHeader === pattern.toLowerCase()
               );
      });

      if (exactMatch) {
        mapping[exactMatch] = fieldName;
        continue; // Move to next field
      }

      // If no exact match, use Fuse.js for fuzzy matching
      const searchTerms = [
        productField.label.toLowerCase(),
        fieldName.replace("[]", "").toLowerCase(),
        ...(PLATFORM_PATTERNS[sourcePlatform || "Etsy"]?.[fieldName] || []).map(
          (p) => p.toLowerCase()
        ),
      ];

      // Use Fuse.js to find best match
      const fuse = new Fuse(currentRemainingHeaders, {
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
  const missing = requiredFields.filter((field) => !mappedFields.includes(field));

  return {
    valid: missing.length === 0,
    missing,
  };
}



