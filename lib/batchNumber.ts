import { db } from "@/lib/db";

/**
 * Generates a batch number in the format: [ProductID]-[YYYYMMDD]-B[Increment]
 * @param productId - The product ID
 * @returns The generated batch number
 */
export async function generateBatchNumber(productId: string): Promise<string> {
  const today = new Date();
  const dateString = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD format
  
  // Find the highest batch number for this product today
  const existingBatches = await db.product.findMany({
    where: {
      id: productId,
      batchNumber: {
        startsWith: `${productId}-${dateString}-B`
      }
    },
    select: {
      batchNumber: true
    }
  });

  // Extract the increment numbers and find the highest
  const incrementNumbers = existingBatches
    .map(batch => {
      const match = batch.batchNumber?.match(/B(\d+)$/);
      return match ? parseInt(match[1]) : 0;
    })
    .filter(num => !isNaN(num));

  const nextIncrement = incrementNumbers.length > 0 ? Math.max(...incrementNumbers) + 1 : 1;
  
  return `${productId}-${dateString}-B${nextIncrement}`;
}

/**
 * Checks if GPSR fields have changed between two product states
 * @param oldProduct - The old product state
 * @param newProduct - The new product state
 * @returns True if GPSR fields have changed
 */
export function hasGPSRFieldsChanged(oldProduct: any, newProduct: any): boolean {
  const gpsrFields = [
    'safetyWarnings',
    'materialsComposition', 
    'safeUseInstructions',
    'ageRestriction',
    'chokingHazard',
    'smallPartsWarning',
    'chemicalWarnings',
    'careInstructions'
  ];

  return gpsrFields.some(field => oldProduct[field] !== newProduct[field]);
}

/**
 * Checks if stock has increased (not just changed)
 * @param oldStock - The old stock value
 * @param newStock - The new stock value
 * @returns True if stock has increased
 */
export function hasStockIncreased(oldStock: number, newStock: number): boolean {
  return newStock > oldStock;
}
