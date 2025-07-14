import { 
  validateDiscountCode, 
  calculateDiscount, 
  calculateProductSaleDiscount,
  canStackDiscountWithSale 
} from '@/lib/discount-calculator';

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    discountCode: {
      findUnique: jest.fn(),
    },
    discountCodeUsage: {
      count: jest.fn(),
    },
  },
}));

import { db } from '@/lib/db';

describe('Discount Calculator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateDiscountCode', () => {
    it('should return invalid for non-existent code', async () => {
      (db.discountCode.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await validateDiscountCode('INVALID', 'seller1', 'product1', 1000, 'user1');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid discount code');
    });

    it('should return invalid for inactive code', async () => {
      (db.discountCode.findUnique as jest.Mock).mockResolvedValue({
        id: 'code1',
        code: 'TEST10',
        name: 'Test Discount',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        isActive: false,
        sellerId: 'seller1',
        appliesToAllProducts: true,
        currentUses: 0,
        maxUses: 100,
        expiresAt: null,
      });

      const result = await validateDiscountCode('TEST10', 'seller1', 'product1', 1000, 'user1');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('This discount code is no longer active');
    });

    it('should return invalid for expired code', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      (db.discountCode.findUnique as jest.Mock).mockResolvedValue({
        id: 'code1',
        code: 'TEST10',
        name: 'Test Discount',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        isActive: true,
        sellerId: 'seller1',
        appliesToAllProducts: true,
        currentUses: 0,
        maxUses: 100,
        expiresAt: yesterday,
      });

      const result = await validateDiscountCode('TEST10', 'seller1', 'product1', 1000, 'user1');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('This discount code has expired');
    });

    it('should return invalid for wrong seller', async () => {
      (db.discountCode.findUnique as jest.Mock).mockResolvedValue({
        id: 'code1',
        code: 'TEST10',
        name: 'Test Discount',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        isActive: true,
        sellerId: 'seller2', // Different seller
        appliesToAllProducts: true,
        currentUses: 0,
        maxUses: 100,
        expiresAt: null,
      });

      const result = await validateDiscountCode('TEST10', 'seller1', 'product1', 1000, 'user1');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('This discount code is not valid for this seller');
    });

    it('should return invalid for minimum order amount not met', async () => {
      (db.discountCode.findUnique as jest.Mock).mockResolvedValue({
        id: 'code1',
        code: 'TEST10',
        name: 'Test Discount',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        isActive: true,
        sellerId: 'seller1',
        appliesToAllProducts: true,
        minimumOrderAmount: 2000, // $20 minimum
        currentUses: 0,
        maxUses: 100,
        expiresAt: null,
      });

      const result = await validateDiscountCode('TEST10', 'seller1', 'product1', 1000, 'user1'); // $10 order

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Minimum order amount of $20.00 required for this discount code');
    });

    it('should return invalid when usage limit reached', async () => {
      (db.discountCode.findUnique as jest.Mock).mockResolvedValue({
        id: 'code1',
        code: 'TEST10',
        name: 'Test Discount',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        isActive: true,
        sellerId: 'seller1',
        appliesToAllProducts: true,
        currentUses: 100,
        maxUses: 100, // Limit reached
        expiresAt: null,
      });

      const result = await validateDiscountCode('TEST10', 'seller1', 'product1', 1000, 'user1');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('This discount code has reached its usage limit');
    });

    it('should return invalid when per-customer limit reached', async () => {
      (db.discountCode.findUnique as jest.Mock).mockResolvedValue({
        id: 'code1',
        code: 'TEST10',
        name: 'Test Discount',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        isActive: true,
        sellerId: 'seller1',
        appliesToAllProducts: true,
        maxUsesPerCustomer: 1,
        currentUses: 0,
        maxUses: 100,
        expiresAt: null,
      });

      (db.discountCodeUsage.count as jest.Mock).mockResolvedValue(1); // User already used it

      const result = await validateDiscountCode('TEST10', 'seller1', 'product1', 1000, 'user1');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('You have already used this discount code the maximum number of times');
    });

    it('should return valid for percentage discount', async () => {
      (db.discountCode.findUnique as jest.Mock).mockResolvedValue({
        id: 'code1',
        code: 'TEST10',
        name: 'Test Discount',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        isActive: true,
        sellerId: 'seller1',
        appliesToAllProducts: true,
        currentUses: 0,
        maxUses: 100,
        expiresAt: null,
        stackableWithProductSales: true,
      });

      const result = await validateDiscountCode('TEST10', 'seller1', 'product1', 1000, 'user1');

      expect(result.isValid).toBe(true);
      expect(result.discountCode?.discountAmount).toBe(100); // 10% of 1000 cents
    });

    it('should return valid for fixed amount discount', async () => {
      (db.discountCode.findUnique as jest.Mock).mockResolvedValue({
        id: 'code1',
        code: 'SAVE5',
        name: 'Save $5',
        discountType: 'FIXED_AMOUNT',
        discountValue: 500, // $5 in cents
        isActive: true,
        sellerId: 'seller1',
        appliesToAllProducts: true,
        currentUses: 0,
        maxUses: 100,
        expiresAt: null,
        stackableWithProductSales: true,
      });

      const result = await validateDiscountCode('SAVE5', 'seller1', 'product1', 1000, 'user1');

      expect(result.isValid).toBe(true);
      expect(result.discountCode?.discountAmount).toBe(500);
    });

    it('should cap percentage discount at maximum amount', async () => {
      (db.discountCode.findUnique as jest.Mock).mockResolvedValue({
        id: 'code1',
        code: 'TEST50',
        name: 'Test Discount',
        discountType: 'PERCENTAGE',
        discountValue: 50,
        maximumDiscountAmount: 200, // Max $2 discount
        isActive: true,
        sellerId: 'seller1',
        appliesToAllProducts: true,
        currentUses: 0,
        maxUses: 100,
        expiresAt: null,
        stackableWithProductSales: true,
      });

      const result = await validateDiscountCode('TEST50', 'seller1', 'product1', 1000, 'user1');

      expect(result.isValid).toBe(true);
      expect(result.discountCode?.discountAmount).toBe(200); // Capped at $2, not $5
    });

    it('should cap fixed discount at order amount', async () => {
      (db.discountCode.findUnique as jest.Mock).mockResolvedValue({
        id: 'code1',
        code: 'SAVE20',
        name: 'Save $20',
        discountType: 'FIXED_AMOUNT',
        discountValue: 2000, // $20 in cents
        isActive: true,
        sellerId: 'seller1',
        appliesToAllProducts: true,
        currentUses: 0,
        maxUses: 100,
        expiresAt: null,
        stackableWithProductSales: true,
      });

      const result = await validateDiscountCode('SAVE20', 'seller1', 'product1', 1000, 'user1'); // $10 order

      expect(result.isValid).toBe(true);
      expect(result.discountCode?.discountAmount).toBe(1000); // Capped at order amount
    });
  });

  describe('calculateDiscount', () => {
    it('should calculate discount correctly', () => {
      const discountCode = {
        id: 'code1',
        code: 'TEST10',
        name: 'Test Discount',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        discountAmount: 100,
      };

      const result = calculateDiscount(1000, discountCode);

      expect(result.originalAmount).toBe(1000);
      expect(result.discountAmount).toBe(100);
      expect(result.finalAmount).toBe(900);
    });

    it('should handle zero discount', () => {
      const discountCode = {
        id: 'code1',
        code: 'TEST10',
        name: 'Test Discount',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        discountAmount: 0,
      };

      const result = calculateDiscount(1000, discountCode);

      expect(result.originalAmount).toBe(1000);
      expect(result.discountAmount).toBe(0);
      expect(result.finalAmount).toBe(1000);
    });
  });

  describe('calculateProductSaleDiscount', () => {
    it('should return 0 for product not on sale', () => {
      const product = {
        price: 1000,
        onSale: false,
        discount: 10,
      };

      const result = calculateProductSaleDiscount(product);

      expect(result).toBe(0);
    });

    it('should return 0 for product with no discount', () => {
      const product = {
        price: 1000,
        onSale: true,
        discount: null,
      };

      const result = calculateProductSaleDiscount(product);

      expect(result).toBe(0);
    });

    it('should calculate sale discount correctly', () => {
      const product = {
        price: 1000,
        onSale: true,
        discount: 20,
      };

      const result = calculateProductSaleDiscount(product);

      expect(result).toBe(200); // 20% of 1000 cents
    });

    it('should return 0 if sale has not started', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const product = {
        price: 1000,
        onSale: true,
        discount: 20,
        saleStartDate: tomorrow,
      };

      const result = calculateProductSaleDiscount(product);

      expect(result).toBe(0);
    });

    it('should return 0 if sale has ended', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const product = {
        price: 1000,
        onSale: true,
        discount: 20,
        saleEndDate: yesterday,
      };

      const result = calculateProductSaleDiscount(product);

      expect(result).toBe(0);
    });
  });

  describe('canStackDiscountWithSale', () => {
    it('should return true when product is not on sale', () => {
      const discountCode = {
        id: 'code1',
        code: 'TEST10',
        name: 'Test Discount',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        discountAmount: 100,
        stackableWithProductSales: false,
      };

      const result = canStackDiscountWithSale(discountCode, false);

      expect(result).toBe(true);
    });

    it('should return true when discount allows stacking', () => {
      const discountCode = {
        id: 'code1',
        code: 'TEST10',
        name: 'Test Discount',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        discountAmount: 100,
        stackableWithProductSales: true,
      };

      const result = canStackDiscountWithSale(discountCode, true);

      expect(result).toBe(true);
    });

    it('should return false when discount does not allow stacking', () => {
      const discountCode = {
        id: 'code1',
        code: 'TEST10',
        name: 'Test Discount',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        discountAmount: 100,
        stackableWithProductSales: false,
      };

      const result = canStackDiscountWithSale(discountCode, true);

      expect(result).toBe(false);
    });

    it('should return true when stackableWithProductSales is undefined', () => {
      const discountCode = {
        id: 'code1',
        code: 'TEST10',
        name: 'Test Discount',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        discountAmount: 100,
      };

      const result = canStackDiscountWithSale(discountCode, true);

      expect(result).toBe(true);
    });
  });
}); 