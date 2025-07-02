// Example test for a simple utility function
// This test doesn't require external dependencies and can run with basic Jest setup

// Example function to test
function add(a: number, b: number): number {
  return a + b
}

function multiply(a: number, b: number): number {
  return a * b
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

describe('Utility Functions', () => {
  describe('add', () => {
    it('should add two positive numbers correctly', () => {
      expect(add(2, 3)).toBe(5)
    })

    it('should handle negative numbers', () => {
      expect(add(-1, 5)).toBe(4)
    })

    it('should handle zero', () => {
      expect(add(0, 10)).toBe(10)
    })
  })

  describe('multiply', () => {
    it('should multiply two numbers correctly', () => {
      expect(multiply(3, 4)).toBe(12)
    })

    it('should handle zero', () => {
      expect(multiply(5, 0)).toBe(0)
    })
  })

  describe('formatPrice', () => {
    it('should format price with two decimal places', () => {
      expect(formatPrice(29.99)).toBe('$29.99')
    })

    it('should handle whole numbers', () => {
      expect(formatPrice(50)).toBe('$50.00')
    })

    it('should handle zero', () => {
      expect(formatPrice(0)).toBe('$0.00')
    })
  })
}) 