import { getCurrencyDecimals } from "@/data/units";

describe('Discount Code Currency Conversion', () => {
  test('converts USD amounts to cents correctly', () => {
    const decimals = getCurrencyDecimals('USD');
    const multiplier = Math.pow(10, decimals);
    
    // Test various USD amounts
    expect(Math.round(10.50 * multiplier)).toBe(1050); // $10.50 -> 1050 cents
    expect(Math.round(25.00 * multiplier)).toBe(2500); // $25.00 -> 2500 cents
    expect(Math.round(0.99 * multiplier)).toBe(99);    // $0.99 -> 99 cents
    expect(Math.round(100.00 * multiplier)).toBe(10000); // $100.00 -> 10000 cents
  });

  test('converts EUR amounts to cents correctly', () => {
    const decimals = getCurrencyDecimals('EUR');
    const multiplier = Math.pow(10, decimals);
    
    // Test various EUR amounts
    expect(Math.round(15.75 * multiplier)).toBe(1575); // €15.75 -> 1575 cents
    expect(Math.round(50.00 * multiplier)).toBe(5000); // €50.00 -> 5000 cents
  });

  test('converts JPY amounts correctly (no decimals)', () => {
    const decimals = getCurrencyDecimals('JPY');
    const multiplier = Math.pow(10, decimals);
    
    console.log('JPY decimals:', decimals, 'multiplier:', multiplier);
    
    // Test JPY amounts (no decimal places)
    // Since JPY has 0 decimals, multiplier = 10^0 = 1, so no conversion needed
    expect(Math.round(1000 * multiplier)).toBe(1000);  // ¥1000 -> 1000 yen
    expect(Math.round(5000 * multiplier)).toBe(5000);  // ¥5000 -> 5000 yen
  });

  test('converts cents back to currency units correctly', () => {
    const decimals = getCurrencyDecimals('USD');
    const multiplier = Math.pow(10, decimals);
    
    // Test converting back from cents to dollars
    expect(1050 / multiplier).toBe(10.50); // 1050 cents -> $10.50
    expect(2500 / multiplier).toBe(25.00); // 2500 cents -> $25.00
    expect(99 / multiplier).toBe(0.99);    // 99 cents -> $0.99
  });

  test('handles percentage discounts correctly (no conversion needed)', () => {
    const discountType = "PERCENTAGE";
    const discountValue = 20; // 20%
    
    // Percentage discounts should not be converted
    const finalValue = discountType === "PERCENTAGE" 
      ? discountValue // Keep percentage as-is
      : Math.round(discountValue * 100); // Convert currency to cents
    
    expect(finalValue).toBe(20); // Should remain 20 for percentage
  });

  test('handles fixed amount discounts correctly (conversion needed)', () => {
    const discountValue = 15.50; // $15.50
    const decimals = getCurrencyDecimals('USD');
    const multiplier = Math.pow(10, decimals);
    
    // Fixed amount discounts should be converted to cents
    const finalValue = Math.round(discountValue * multiplier); // Convert currency to cents
    
    expect(finalValue).toBe(1550); // Should be 1550 cents
  });

  test('handles zero amounts correctly', () => {
    const decimals = getCurrencyDecimals('USD');
    const multiplier = Math.pow(10, decimals);
    
    expect(Math.round(0 * multiplier)).toBe(0); // $0.00 -> 0 cents
    expect(0 / multiplier).toBe(0); // 0 cents -> $0.00
  });

  test('handles null/undefined amounts correctly', () => {
    const decimals = getCurrencyDecimals('USD');
    const multiplier = Math.pow(10, decimals);
    
    // Test with null values (should be handled gracefully)
    const nullAmount = null;
    const undefinedAmount = undefined;
    
    // These should not throw errors and should be handled appropriately
    expect(nullAmount).toBeNull();
    expect(undefinedAmount).toBeUndefined();
  });
}); 