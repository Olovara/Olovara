import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'

// Mock session for testing
const mockSession = {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'MEMBER' as const, // Explicitly type as const to match union type
      isTwoFactorEnabled: false,
      isOAuth: false,
      permissions: [] as string[],
      sellerOnboarding: {
        applicationAccepted: false,
        stripeConnected: false,
        shopProfileComplete: false,
        shippingProfileCreated: false,
        isFullyActivated: false,
      },
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider session={mockSession}>
      {children}
    </SessionProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'

// Override render method
export { customRender as render }

// Re-export specific functions that might be needed
export { screen, fireEvent, waitFor } from '@testing-library/react'

// Test data factories
export const createMockProduct = (overrides = {}) => ({
  id: 'test-product-id',
  name: 'Test Product',
  description: 'A test product description',
  price: 29.99,
  images: ['https://example.com/image1.jpg'],
  category: 'handmade',
  sellerId: 'test-seller-id',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'member',
  createdAt: new Date().toISOString(),
  ...overrides,
})

export const createMockOrder = (overrides = {}) => ({
  id: 'test-order-id',
  productId: 'test-product-id',
  buyerId: 'test-buyer-id',
  sellerId: 'test-seller-id',
  status: 'pending',
  total: 29.99,
  createdAt: new Date().toISOString(),
  ...overrides,
}) 