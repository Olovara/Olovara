import { 
  determineShippingZone, 
  calculateShippingCost, 
  getBestShippingRate, 
  isShippingAvailable,
  ShippingCalculation 
} from '@/lib/shipping-calculator';

describe('Shipping Calculator', () => {
  const mockShippingRates = [
    {
      zone: "NORTH_AMERICA",
      isInternational: false,
      price: 500, // $5.00
      currency: "USD",
      estimatedDays: 3,
      additionalItem: 200, // $2.00
      serviceLevel: "STANDARD",
      isFreeShipping: false,
    },
    {
      zone: "NORTH_AMERICA",
      isInternational: true,
      price: 1500, // $15.00
      currency: "USD",
      estimatedDays: 7,
      additionalItem: 500, // $5.00
      serviceLevel: "STANDARD",
      isFreeShipping: false,
    },
    {
      zone: "EUROPE",
      isInternational: false,
      price: 800, // $8.00
      currency: "USD",
      estimatedDays: 5,
      additionalItem: 300, // $3.00
      serviceLevel: "STANDARD",
      isFreeShipping: false,
    },
    {
      zone: "EUROPE",
      isInternational: true,
      price: 2500, // $25.00
      currency: "USD",
      estimatedDays: 10,
      additionalItem: 1000, // $10.00
      serviceLevel: "STANDARD",
      isFreeShipping: false,
    },
    {
      zone: "ASIA",
      isInternational: true,
      price: 3000, // $30.00
      currency: "USD",
      estimatedDays: 12,
      additionalItem: 1200, // $12.00
      serviceLevel: "STANDARD",
      isFreeShipping: false,
    },
    {
      zone: "OCEANIA",
      isInternational: true,
      price: 3500, // $35.00
      currency: "USD",
      estimatedDays: 14,
      additionalItem: 1500, // $15.00
      serviceLevel: "STANDARD",
      isFreeShipping: false,
    },
  ];

  describe('determineShippingZone', () => {
    it('should return domestic for same country', () => {
      const result = determineShippingZone('US', 'US');
      expect(result).toEqual({ zone: 'NORTH_AMERICA', isInternational: false });
    });

    it('should return international for different countries in same zone', () => {
      const result = determineShippingZone('GB', 'DE');
      expect(result).toEqual({ zone: 'EUROPE', isInternational: true });
    });

    it('should return international for different countries in different zones', () => {
      const result = determineShippingZone('US', 'GB');
      expect(result).toEqual({ zone: 'EUROPE', isInternational: true });
    });

    it('should return international for different countries in North America', () => {
      const result = determineShippingZone('US', 'CA');
      expect(result).toEqual({ zone: 'NORTH_AMERICA', isInternational: true });
    });

    it('should handle unknown countries gracefully', () => {
      const result = determineShippingZone('XX', 'YY');
      expect(result).toEqual({ zone: 'NORTH_AMERICA', isInternational: true });
    });
  });

  describe('calculateShippingCost', () => {
    const mockRates: ShippingCalculation[] = [
      {
        zone: 'NORTH_AMERICA',
        isInternational: false,
        price: 500,
        currency: 'USD',
        estimatedDays: 3,
        isFreeShipping: false
      },
      {
        zone: 'NORTH_AMERICA',
        isInternational: true,
        price: 1500,
        currency: 'USD',
        estimatedDays: 7,
        isFreeShipping: false
      },
      {
        zone: 'EUROPE',
        isInternational: true,
        price: 2000,
        currency: 'USD',
        estimatedDays: 10,
        isFreeShipping: false
      }
    ];

    it('should calculate domestic shipping cost', () => {
      const result = calculateShippingCost(mockRates, 'US', 'US', 1);
      expect(result).toEqual({
        zone: 'NORTH_AMERICA',
        isInternational: false,
        price: 500,
        currency: 'USD',
        estimatedDays: 3,
        isFreeShipping: false
      });
    });

    it('should calculate international shipping cost within same zone', () => {
      const result = calculateShippingCost(mockRates, 'US', 'CA', 1);
      expect(result).toEqual({
        zone: 'NORTH_AMERICA',
        isInternational: true,
        price: 1500,
        currency: 'USD',
        estimatedDays: 7,
        isFreeShipping: false
      });
    });

    it('should calculate international shipping cost across zones', () => {
      const result = calculateShippingCost(mockRates, 'US', 'GB', 1);
      expect(result).toEqual({
        zone: 'EUROPE',
        isInternational: true,
        price: 2000,
        currency: 'USD',
        estimatedDays: 10,
        isFreeShipping: false
      });
    });

    it('should calculate shipping cost with additional items', () => {
      const ratesWithAdditional = [
        ...mockRates,
        {
          zone: 'EUROPE',
          isInternational: true,
          price: 2000,
          currency: 'USD',
          estimatedDays: 10,
          additionalItem: 500,
          isFreeShipping: false
        }
      ];
      
      const result = calculateShippingCost(ratesWithAdditional, 'US', 'GB', 3);
      expect(result?.price).toBe(3000); // 2000 + (500 * 2)
    });

    it('should return null when no matching rate found', () => {
      const result = calculateShippingCost(mockRates, 'US', 'XX', 1);
      expect(result).toBeNull();
    });
  });

  describe('getBestShippingRate', () => {
    const mockShippingRates: ShippingCalculation[] = [
      {
        zone: 'NORTH_AMERICA',
        isInternational: false,
        price: 500,
        currency: 'USD',
        estimatedDays: 3,
        isFreeShipping: false
      },
      {
        zone: 'NORTH_AMERICA',
        isInternational: true,
        price: 1500,
        currency: 'USD',
        estimatedDays: 7,
        isFreeShipping: false
      },
      {
        zone: 'EUROPE',
        isInternational: true,
        price: 2000,
        currency: 'USD',
        estimatedDays: 10,
        isFreeShipping: false
      }
    ];

    it('should find exact match first', () => {
      const result = getBestShippingRate(mockShippingRates, 'US', 'CA');
      expect(result?.zone).toBe('NORTH_AMERICA');
      expect(result?.isInternational).toBe(true); // Now international since different countries
    });

    it('should fall back to zone match', () => {
      const result = getBestShippingRate(mockShippingRates, 'US', 'GB');
      expect(result?.zone).toBe('EUROPE');
      expect(result?.isInternational).toBe(true);
    });

    it('should return first rate as last resort', () => {
      const result = getBestShippingRate(mockShippingRates, 'XX', 'YY');
      expect(result).toBeTruthy();
      expect(result?.zone).toBe('NORTH_AMERICA');
    });
  });

  describe('isShippingAvailable', () => {
    it('should return true for available shipping', () => {
      const result = isShippingAvailable(mockShippingRates, 'US', 'CA');
      expect(result).toBe(true);
    });

    it('should return true for international shipping', () => {
      const result = isShippingAvailable(mockShippingRates, 'US', 'GB');
      expect(result).toBe(true);
    });

    it('should return false for unavailable shipping', () => {
      const result = isShippingAvailable([], 'US', 'CA');
      expect(result).toBe(false);
    });
  });
}); 