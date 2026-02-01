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
  { field: "variation3Type", label: "Variation 3 Type", required: false },
  { field: "variation3Name", label: "Variation 3 Name", required: false },
  { field: "variation3Values", label: "Variation 3 Values", required: false },
  { field: "variation4Type", label: "Variation 4 Type", required: false },
  { field: "variation4Name", label: "Variation 4 Name", required: false },
  { field: "variation4Values", label: "Variation 4 Values", required: false },
  { field: "variation5Type", label: "Variation 5 Type", required: false },
  { field: "variation5Name", label: "Variation 5 Name", required: false },
  { field: "variation5Values", label: "Variation 5 Values", required: false },
  { field: "variation6Type", label: "Variation 6 Type", required: false },
  { field: "variation6Name", label: "Variation 6 Name", required: false },
  { field: "variation6Values", label: "Variation 6 Values", required: false },
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

/**
 * Signature headers that uniquely identify a platform's CSV export.
 * Used to auto-detect source when seller uploads a CSV.
 */
const WIX_SIGNATURE_HEADERS = [
  "handleid",
  "fieldtype",
  "productimageurl",
  "productoptionname1",
  "productoptiontype1",
  "productoptiondescription1",
  "ribbon",
  "surcharge",
  "discountmode",
  "additionalinfotitle1",
  "customtextfield1",
  "additionalinfodescription1",
];

const ETSY_SIGNATURE_HEADERS = [
  "title",
  "description",
  "currency_code",
  "quantity",
  "image1",
  "image2",
  "tags",
  "materials",
  "variation 1 type",
  "variation 1 name",
  "variation 1 values",
  "sku",
];

/**
 * Detect source platform from CSV headers (e.g. Wix or Etsy export).
 * Returns the platform name if detection is confident, otherwise null.
 */
export function detectSourceFromHeaders(
  headers: string[]
): "Wix" | "Etsy" | null {
  if (!headers?.length) return null;

  const normalized = headers.map((h) => h.trim().toLowerCase());

  // Wix: must have several distinctive Wix-only headers
  const wixScore = WIX_SIGNATURE_HEADERS.filter((sig) =>
    normalized.some((h) => h === sig || h.replace(/\s/g, "") === sig.replace(/\s/g, ""))
  ).length;
  const hasWixUniques =
    normalized.includes("handleid") &&
    (normalized.includes("fieldtype") || normalized.includes("productimageurl") || normalized.includes("productoptionname1"));

  // Etsy: TITLE + IMAGE1/IMAGE2 style + CURRENCY_CODE or QUANTITY
  const etsyScore = ETSY_SIGNATURE_HEADERS.filter((sig) =>
    normalized.some((h) => h === sig || h.replace(/\s/g, "") === sig.replace(/\s/g, ""))
  ).length;
  const hasEtsyUniques =
    normalized.includes("title") &&
    (normalized.includes("image1") || normalized.includes("image2")) &&
    (normalized.includes("currency_code") ||
      normalized.includes("quantity") ||
      normalized.includes("tags"));

  if (hasWixUniques && wixScore >= 3 && wixScore >= etsyScore) {
    return "Wix";
  }
  if (hasEtsyUniques && etsyScore >= 4 && etsyScore > wixScore) {
    return "Etsy";
  }
  return null;
}

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
    variation3Type: ["variation 3 type", "variation3type", "var3type"],
    variation3Name: ["variation 3 name", "variation3name", "var3name"],
    variation3Values: ["variation 3 values", "variation3values", "var3values"],
    variation4Type: ["variation 4 type", "variation4type", "var4type"],
    variation4Name: ["variation 4 name", "variation4name", "var4name"],
    variation4Values: ["variation 4 values", "variation4values", "var4values"],
    variation5Type: ["variation 5 type", "variation5type", "var5type"],
    variation5Name: ["variation 5 name", "variation5name", "var5name"],
    variation5Values: ["variation 5 values", "variation5values", "var5values"],
    variation6Type: ["variation 6 type", "variation6type", "var6type"],
    variation6Name: ["variation 6 name", "variation6name", "var6name"],
    variation6Values: ["variation 6 values", "variation6values", "var6values"],
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
    variation1Type: ["option1 name", "variant option1", "option 1 type"],
    variation1Name: ["option1 name", "variant option1", "option 1 name"],
    variation1Values: ["option1 value", "variant option1 value", "option 1 values"],
    variation2Type: ["option2 name", "variant option2", "option 2 type"],
    variation2Name: ["option2 name", "variant option2", "option 2 name"],
    variation2Values: ["option2 value", "variant option2 value", "option 2 values"],
    variation3Type: ["option3 name", "variant option3", "option 3 type"],
    variation3Name: ["option3 name", "variant option3", "option 3 name"],
    variation3Values: ["option3 value", "variant option3 value", "option 3 values"],
    variation4Type: ["option4 name", "variant option4", "option 4 type"],
    variation4Name: ["option4 name", "variant option4", "option 4 name"],
    variation4Values: ["option4 value", "variant option4 value", "option 4 values"],
    variation5Type: ["option5 name", "variant option5", "option 5 type"],
    variation5Name: ["option5 name", "variant option5", "option 5 name"],
    variation5Values: ["option5 value", "variant option5 value", "option 5 values"],
    variation6Type: ["option6 name", "variant option6", "option 6 type"],
    variation6Name: ["option6 name", "variant option6", "option 6 name"],
    variation6Values: ["option6 value", "variant option6 value", "option 6 values"],
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
    variation1Type: ["attribute 1", "attribute_1", "variation 1 type"],
    variation1Name: ["attribute 1 name", "attribute_1_name", "variation 1 name"],
    variation1Values: ["attribute 1 value", "attribute_1_value", "variation 1 values"],
    variation2Type: ["attribute 2", "attribute_2", "variation 2 type"],
    variation2Name: ["attribute 2 name", "attribute_2_name", "variation 2 name"],
    variation2Values: ["attribute 2 value", "attribute_2_value", "variation 2 values"],
    variation3Type: ["attribute 3", "attribute_3", "variation 3 type"],
    variation3Name: ["attribute 3 name", "attribute_3_name", "variation 3 name"],
    variation3Values: ["attribute 3 value", "attribute_3_value", "variation 3 values"],
    variation4Type: ["attribute 4", "attribute_4", "variation 4 type"],
    variation4Name: ["attribute 4 name", "attribute_4_name", "variation 4 name"],
    variation4Values: ["attribute 4 value", "attribute_4_value", "variation 4 values"],
    variation5Type: ["attribute 5", "attribute_5", "variation 5 type"],
    variation5Name: ["attribute 5 name", "attribute_5_name", "variation 5 name"],
    variation5Values: ["attribute 5 value", "attribute_5_value", "variation 5 values"],
    variation6Type: ["attribute 6", "attribute_6", "variation 6 type"],
    variation6Name: ["attribute 6 name", "attribute_6_name", "variation 6 name"],
    variation6Values: ["attribute 6 value", "attribute_6_value", "variation 6 values"],
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
    variation1Type: ["variant option 1", "option 1 type", "variation 1 type"],
    variation1Name: ["variant option 1 name", "option 1 name", "variation 1 name"],
    variation1Values: ["variant option 1 values", "option 1 values", "variation 1 values"],
    variation2Type: ["variant option 2", "option 2 type", "variation 2 type"],
    variation2Name: ["variant option 2 name", "option 2 name", "variation 2 name"],
    variation2Values: ["variant option 2 values", "option 2 values", "variation 2 values"],
    variation3Type: ["variant option 3", "option 3 type", "variation 3 type"],
    variation3Name: ["variant option 3 name", "option 3 name", "variation 3 name"],
    variation3Values: ["variant option 3 values", "option 3 values", "variation 3 values"],
    variation4Type: ["variant option 4", "option 4 type", "variation 4 type"],
    variation4Name: ["variant option 4 name", "option 4 name", "variation 4 name"],
    variation4Values: ["variant option 4 values", "option 4 values", "variation 4 values"],
    variation5Type: ["variant option 5", "option 5 type", "variation 5 type"],
    variation5Name: ["variant option 5 name", "option 5 name", "variation 5 name"],
    variation5Values: ["variant option 5 values", "option 5 values", "variation 5 values"],
    variation6Type: ["variant option 6", "option 6 type", "variation 6 type"],
    variation6Name: ["variant option 6 name", "option 6 name", "variation 6 name"],
    variation6Values: ["variant option 6 values", "option 6 values", "variation 6 values"],
  },
  Wix: {
    name: ["name"],
    description: ["description"],
    price: ["price"],
    currency: ["currency", "currency_code"], // May not be in CSV, will default to seller's preferred currency
    // Note: inventory is "InStock" status, not a quantity - stock will default to 0 for products with variations
    sku: ["sku"],
    "tags[]": [], // Note: collection is not auto-mapped - let seller choose
    "materialTags[]": [], // Note: brand is auto-skipped
    "images[]": ["productImageUrl"],
    // Wix variations: productOptionName1-6 defines the option name, productOptionDescription1-6 contains semicolon-separated values
    // Variants are separate rows with fieldType="Variant" that reference the product by handleId
    // Note: productOptionType1-6 are auto-skipped (we use productOptionName and productOptionDescription instead)
    variation1Name: ["productOptionName1"],
    variation1Values: ["productOptionDescription1"], // Semicolon-separated values
    variation2Name: ["productOptionName2"],
    variation2Values: ["productOptionDescription2"],
    variation3Name: ["productOptionName3"],
    variation3Values: ["productOptionDescription3"],
    variation4Name: ["productOptionName4"],
    variation4Values: ["productOptionDescription4"],
    variation5Name: ["productOptionName5"],
    variation5Values: ["productOptionDescription5"],
    variation6Name: ["productOptionName6"],
    variation6Values: ["productOptionDescription6"],
  },
};

/**
 * Auto-map CSV headers to product fields using Fuse.js
 */
export function autoMapHeaders(
  csvHeaders: string[],
  sourcePlatform?: string
): Record<string, string> {
  console.log(`[AUTO-MAP] autoMapHeaders called - Platform: "${sourcePlatform}", Headers: ${csvHeaders.length}`);
  const mapping: Record<string, string> = {};

  // For Wix, automatically skip productOptionType1-6 headers (they just indicate field type like "dropdown")
  // Also skip additionalInfoTitle1-6 (Wix additional info fields that aren't needed)
  if (sourcePlatform === "Wix") {
    console.log(`[AUTO-MAP] Wix platform detected in autoMapHeaders!`);
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
      // Note: additionalInfoDescription fields are NOT marked as SKIP - they'll appear in unmapped columns
      // but will be prevented from auto-mapping via the safeguards below
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
      if (!patterns || patterns.length === 0) {
        if (sourcePlatform === "Wix" && productField.startsWith("variation")) {
          console.warn(`[AUTO-MAP] Wix: No patterns found for "${productField}"`);
        }
        continue;
      }

      // Find matching CSV header
      for (const csvHeader of csvHeaders) {
        // Skip if already mapped
        if (mapping[csvHeader]) continue;

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
              console.log(`[AUTO-MAP] Wix: Matched "${csvHeader}" to "${productField}" via platform pattern "${pattern}"`);
            } else {
              console.log(`[AUTO-MAP] Wix: No match - "${csvHeader}" (${normalizedHeader}) !== "${pattern}" (${normalizedPattern}) for "${productField}"`);
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
      // Exclude additionalInfoDescription1-6 - let seller choose manually
      if (/^additionalInfoDescription\d+$/i.test(h)) return false;
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
        // CRITICAL: For Wix, prevent productOptionDescription and additionalInfoDescription headers from matching description fields
        if (sourcePlatform === "Wix") {
          // productOptionDescription should ONLY map to variation1Values-6Values via platform patterns
          if (/^productOptionDescription\d+$/i.test(header)) {
            // Only allow matching to variation fields, never to description fields
            if (!fieldName.startsWith("variation")) {
              return false; // Block matching to non-variation fields
            }
          }
          // additionalInfoDescription should NOT be auto-mapped - let seller choose manually
          if (/^additionalInfoDescription\d+$/i.test(header)) {
            return false; // Block ALL auto-matching for additionalInfoDescription
          }
        }
        
        const normalizedHeader = header.toLowerCase().trim();
        const normalizedField = fieldName.replace("[]", "").toLowerCase();
        const normalizedLabel = productField.label.toLowerCase();

        // Check exact matches first
        // BUT: For Wix productOptionDescription headers, NEVER match to description fields
        // This is a critical safeguard
        if (sourcePlatform === "Wix" && /^productOptionDescription\d+$/i.test(header)) {
          // Only allow matching if it's a variation field
          if (!fieldName.startsWith("variation")) {
            return false; // Block ALL matching to non-variation fields
          }
        }
        
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
      // For Wix, exclude productOptionDescription, additionalInfoTitle, and additionalInfoDescription headers from fuzzy matching
      // productOptionDescription should ONLY map via platform patterns to variation fields
      // additionalInfoDescription should NOT be auto-mapped - let seller choose manually
      const headersForFuzzyMatch = sourcePlatform === "Wix"
        ? currentRemainingHeaders.filter((h) => {
            // Exclude productOptionDescription headers - they should only map via platform patterns
            if (/^productOptionDescription\d+$/i.test(h)) return false;
            // Exclude additional info headers
            if (/^additionalInfoTitle\d+$/i.test(h)) return false;
            if (/^additionalInfo\d+$/i.test(h)) return false;
            // Exclude additionalInfoDescription - let seller choose manually
            if (/^additionalInfoDescription\d+$/i.test(h)) return false;
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

  // CRITICAL: For Wix, FORCE correct mapping of productOptionDescription1-6 to variation1Values-6Values
  // This is a final enforcement step that ensures the mapping is correct regardless of what happened before
  console.log(`[AUTO-MAP] Final enforcement in autoMapHeaders - sourcePlatform: "${sourcePlatform}"`);
  if (sourcePlatform === "Wix") {
    console.log(`[AUTO-MAP] Running final enforcement in autoMapHeaders for Wix...`);
    for (let i = 1; i <= 6; i++) {
      const headerPattern = new RegExp(`^productOptionDescription${i}$`, "i");
      const correctField = `variation${i}Values`;
      
      // First, check if header is already in mapping (case-insensitive)
      const matchingHeaderInMapping = Object.keys(mapping).find(k => headerPattern.test(k));
      
      if (matchingHeaderInMapping) {
        // Force the correct mapping - override anything that was set before
        if (mapping[matchingHeaderInMapping] !== correctField) {
          console.log(`[AUTO-MAP] *** FORCING Wix mapping in autoMapHeaders: "${matchingHeaderInMapping}" → "${correctField}" (was: "${mapping[matchingHeaderInMapping]}") ***`);
          mapping[matchingHeaderInMapping] = correctField;
        } else {
          console.log(`[AUTO-MAP] Mapping already correct in autoMapHeaders: "${matchingHeaderInMapping}" → "${correctField}"`);
        }
      } else {
        // Header exists in CSV but not in mapping yet - find it and add the mapping
        const csvHeader = csvHeaders.find(h => headerPattern.test(h));
        if (csvHeader) {
          console.log(`[AUTO-MAP] *** Adding missing Wix mapping in autoMapHeaders: "${csvHeader}" → "${correctField}" ***`);
          mapping[csvHeader] = correctField;
        } else {
          console.log(`[AUTO-MAP] productOptionDescription${i} not found in CSV headers`);
        }
      }
    }
    console.log(`[AUTO-MAP] Final mapping state in autoMapHeaders:`, Object.entries(mapping).filter(([k]) => /^productOptionDescription\d+$/i.test(k)));
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
