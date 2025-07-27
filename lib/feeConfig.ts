export const PLATFORM_FEE_PERCENT = parseFloat(process.env.PLATFORM_FEE_PERCENT || "10"); // Default to 10%

// Commission discount percentage (2% off)
export const COMMISSION_DISCOUNT_PERCENT = 2;

// Function to calculate commission rate based on seller status and discount eligibility
export function calculateCommissionRate(
  isFoundingSeller: boolean,
  hasCommissionDiscount: boolean,
  commissionDiscountExpiresAt?: Date | null
): number {
  // Base commission rates
  const baseCommission = isFoundingSeller ? 8 : 10;
  
  // Check if discount is active
  if (hasCommissionDiscount && commissionDiscountExpiresAt) {
    const now = new Date();
    if (commissionDiscountExpiresAt > now) {
      // Apply 2% discount
      return Math.max(baseCommission - COMMISSION_DISCOUNT_PERCENT, 0);
    }
  }
  
  return baseCommission;
}
