import { cn, shopNameSlugify, formatPrice } from '@/lib/utils'

describe('Utility Functions', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    })

    it('should handle conditional classes', () => {
      const isActive = true
      expect(cn('base-class', isActive && 'active-class')).toBe('base-class active-class')
    })

    it('should handle false conditional classes', () => {
      const isActive = false
      expect(cn('base-class', isActive && 'active-class')).toBe('base-class')
    })

    it('should handle arrays of classes', () => {
      expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3')
    })

    it('should handle objects with conditional classes', () => {
      const classes = {
        'base-class': true,
        'conditional-class': true,
        'false-class': false,
      }
      expect(cn(classes)).toBe('base-class conditional-class')
    })

    it('should handle mixed inputs', () => {
      const isActive = true
      const classes = ['array-class1', 'array-class2']
      const objectClasses = { 'object-class': true, 'false-class': false }
      
      expect(cn('string-class', isActive && 'conditional-class', classes, objectClasses))
        .toBe('string-class conditional-class array-class1 array-class2 object-class')
    })
  })

  describe('shopNameSlugify', () => {
    it('should convert shop name to slug format', () => {
      expect(shopNameSlugify('My Awesome Shop')).toBe('myawesomeshop')
    })

    it('should handle multiple spaces', () => {
      expect(shopNameSlugify('My   Awesome   Shop')).toBe('myawesomeshop')
    })

    it('should remove special characters but keep hyphens', () => {
      expect(shopNameSlugify('My-Awesome-Shop!')).toBe('my-awesome-shop')
    })

    it('should handle numbers', () => {
      expect(shopNameSlugify('Shop 123')).toBe('shop123')
    })

    it('should handle mixed case', () => {
      expect(shopNameSlugify('MyAwesomeSHOP')).toBe('myawesomeshop')
    })

    it('should handle empty string', () => {
      expect(shopNameSlugify('')).toBe('')
    })

    it('should handle string with only special characters', () => {
      expect(shopNameSlugify('!@#$%^&*()')).toBe('')
    })
  })

  describe('formatPrice', () => {
    it('should format USD price correctly (default)', () => {
      expect(formatPrice(2999)).toBe('$29.99') // 2999 cents = $29.99
    })

    it('should format USD price with compact notation', () => {
      expect(formatPrice(2999, { notation: 'compact' })).toBe('$29.99')
    })

    it('should format USD price with standard notation', () => {
      expect(formatPrice(2999, { notation: 'standard' })).toBe('$29.99')
    })

    it('should handle different currencies', () => {
      expect(formatPrice(2999, { currency: 'EUR' })).toBe('€29.99')
      expect(formatPrice(2999, { currency: 'GBP' })).toBe('£29.99')
      expect(formatPrice(2999, { currency: 'CAD' })).toBe('CA$29.99')
    })

    it('should handle JPY without decimals', () => {
      expect(formatPrice(3000, { currency: 'JPY' })).toBe('¥30')
    })

    it('should handle prices in dollars (not cents)', () => {
      expect(formatPrice(30, { isCents: false })).toBe('$30.00')
    })

    it('should handle string input', () => {
      expect(formatPrice('2999')).toBe('$29.99')
    })

    it('should handle zero price', () => {
      expect(formatPrice(0)).toBe('$0.00')
    })

    it('should handle large numbers with compact notation', () => {
      expect(formatPrice(1000000, { notation: 'compact' })).toBe('$10.00K')
    })

    it('should handle decimal prices in dollars', () => {
      expect(formatPrice(29.99, { isCents: false })).toBe('$29.99')
    })
  })
}) 