import { db } from "@/lib/db";

/**
 * Generates a unique SKU for a product
 * Format: PREFIX-YYYYMMDD-XXXXX
 * Where PREFIX is based on the product name and XXXXX is a random 5-digit number
 * SKU is unique per seller, not globally
 */
export async function generateUniqueSKU(productName: string, sellerId: string): Promise<string> {
  const maxAttempts = 10;
  let attempts = 0;

  while (attempts < maxAttempts) {
    // Create prefix from product name (first 3 letters, uppercase, alphanumeric only)
    const prefix = productName
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 3)
      .toUpperCase()
      .padEnd(3, 'X'); // Pad with X if less than 3 characters

    // Get current date in YYYYMMDD format
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    // Generate random 5-digit number
    const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0');

    const sku = `${prefix}-${date}-${randomNum}`;

    // Check if SKU already exists for this seller
    const existingProduct = await db.product.findFirst({
      where: { 
        sku,
        userId: sellerId 
      },
      select: { id: true }
    });

    if (!existingProduct) {
      return sku;
    }

    attempts++;
  }

  // If we can't generate a unique SKU after max attempts, add timestamp
  const timestamp = Date.now().toString().slice(-6);
  const prefix = productName
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 3)
    .toUpperCase()
    .padEnd(3, 'X');
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  return `${prefix}-${date}-${timestamp}`;
}

/**
 * Validates if a SKU is in the correct format
 */
export function isValidSKUFormat(sku: string): boolean {
  // Format: XXX-YYYYMMDD-XXXXX (where X are alphanumeric characters)
  const skuRegex = /^[A-Z0-9]{3}-\d{8}-[A-Z0-9]{5}$/;
  return skuRegex.test(sku);
}

/**
 * Checks if a SKU is available for a specific seller (not already in use by that seller)
 */
export async function isSKUAvailable(sku: string, sellerId: string, excludeProductId?: string): Promise<boolean> {
  const whereClause: any = { 
    sku,
    userId: sellerId 
  };
  
  if (excludeProductId) {
    whereClause.id = { not: excludeProductId };
  }

  const existingProduct = await db.product.findFirst({
    where: whereClause,
    select: { id: true }
  });

  return !existingProduct;
} 