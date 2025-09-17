import { calculateShippingCost, getBestShippingRate, ShippingCalculation } from '@/lib/shipping-calculator';

describe('Country-Specific Shipping Rates', () => {
  const mockShippingRates: ShippingCalculation[] = [
    // Regional rate for North America
    {
      zone: 'NORTH_AMERICA',
      countryCode: null,
      isInternational: true,
      price: 1500, // $15.00
      currency: 'USD',
      estimatedDays: 7,
      additionalItem: 500, // $5.00
      serviceLevel: 'STANDARD',
      isFreeShipping: false,
    },
    // Country-specific rate for US (higher due to tariffs)
    {
      zone: 'NORTH_AMERICA',
      countryCode: 'US',
      isInternational: true,
      price: 2500, // $25.00 (higher due to tariffs)
      currency: 'USD',
      estimatedDays: 7,
      additionalItem: 500, // $5.00
      serviceLevel: 'STANDARD',
      isFreeShipping: false,
    },
    // Country-specific rate for Canada
    {
      zone: 'NORTH_AMERICA',
      countryCode: 'CA',
      isInternational: true,
      price: 1200, // $12.00 (lower than regional rate)
      currency: 'USD',
      estimatedDays: 5,
      additionalItem: 300, // $3.00
      serviceLevel: 'STANDARD',
      isFreeShipping: false,
    },
  ];

  describe('calculateShippingCost', () => {
    it('should prioritize country-specific rate over regional rate for US', () => {
      const result = calculateShippingCost(mockShippingRates, 'DE', 'US', 1);
      
      expect(result).not.toBeNull();
      expect(result!.countryCode).toBe('US');
      expect(result!.price).toBe(2500); // Should use US-specific rate ($25.00)
    });

    it('should use regional rate for Mexico (no country-specific rate)', () => {
      const result = calculateShippingCost(mockShippingRates, 'DE', 'MX', 1);
      
      expect(result).not.toBeNull();
      expect(result!.countryCode).toBeNull();
      expect(result!.price).toBe(1500); // Should use regional rate ($15.00)
    });

    it('should use country-specific rate for Canada', () => {
      const result = calculateShippingCost(mockShippingRates, 'DE', 'CA', 1);
      
      expect(result).not.toBeNull();
      expect(result!.countryCode).toBe('CA');
      expect(result!.price).toBe(1200); // Should use Canada-specific rate ($12.00)
    });

    it('should calculate additional items correctly for country-specific rates', () => {
      const result = calculateShippingCost(mockShippingRates, 'DE', 'US', 3);
      
      expect(result).not.toBeNull();
      expect(result!.price).toBe(3500); // $25.00 + (2 × $5.00) = $35.00
    });
  });

  describe('getBestShippingRate', () => {
    it('should return country-specific rate for US when available', () => {
      const result = getBestShippingRate(mockShippingRates, 'DE', 'US');
      
      expect(result).not.toBeNull();
      expect(result!.countryCode).toBe('US');
      expect(result!.price).toBe(2500);
    });

    it('should fall back to regional rate for countries without specific rates', () => {
      const result = getBestShippingRate(mockShippingRates, 'DE', 'MX');
      
      expect(result).not.toBeNull();
      expect(result!.countryCode).toBeNull();
      expect(result!.price).toBe(1500);
    });
  });
});
