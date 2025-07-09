import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils'
import CustomOrderPaymentButton from '@/components/custom-order/CustomOrderPaymentButton'

// Correctly mock Zustand's useCurrency store
const mockUseCurrency = jest.fn();
jest.mock('@/hooks/useCurrency', () => ({
  useCurrency: mockUseCurrency,
}))

// Mock fetch for API calls
global.fetch = jest.fn()

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: '',
  },
  writable: true,
})

describe('CustomOrderPaymentButton', () => {
  const defaultProps = {
    submissionId: 'submission-123',
    paymentType: 'MATERIALS_DEPOSIT' as const,
    amount: 2500, // $25.00 in cents
    currency: 'USD',
  }

  beforeEach(() => {
    mockUseCurrency.mockReturnValue({ currency: 'USD' });
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  })

  it('renders materials deposit payment button correctly', () => {
    render(<CustomOrderPaymentButton {...defaultProps} />)
    
    expect(screen.getByText(/Pay Materials Deposit/)).toBeInTheDocument()
    expect(screen.getByText(/\$25\.00/)).toBeInTheDocument()
    expect(screen.getByText(/This covers the cost of materials and secures your order/)).toBeInTheDocument()
  })

  it('renders final payment button correctly', () => {
    render(
      <CustomOrderPaymentButton
        {...defaultProps}
        paymentType="FINAL_PAYMENT"
        amount={7500} // $75.00 in cents
      />
    )
    
    expect(screen.getByText(/Pay Final Payment/)).toBeInTheDocument()
    expect(screen.getByText(/\$75\.00/)).toBeInTheDocument()
    expect(screen.getByText(/This covers the remaining balance and shipping costs/)).toBeInTheDocument()
  })

  it('handles payment initiation successfully', async () => {
    const mockResponse = {
      url: 'https://checkout.stripe.com/pay/cs_test_session_123',
    }
    
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    render(<CustomOrderPaymentButton {...defaultProps} />)
    
    const button = screen.getByRole('button', { name: /Pay Materials Deposit/ })
    fireEvent.click(button)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/stripe/custom-order-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId: 'submission-123',
          paymentType: 'MATERIALS_DEPOSIT',
          preferredCurrency: 'USD',
        }),
      })
    })

    await waitFor(() => {
      expect(window.location.href).toBe('https://checkout.stripe.com/pay/cs_test_session_123')
    })
  })

  it('handles payment API errors gracefully', async () => {
    const errorResponse = {
      error: 'Payment initialization failed',
    }
    
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => errorResponse,
    })

    render(<CustomOrderPaymentButton {...defaultProps} />)
    
    const button = screen.getByRole('button', { name: /Pay Materials Deposit/ })
    fireEvent.click(button)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
  })

  it('handles network errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    render(<CustomOrderPaymentButton {...defaultProps} />)
    
    const button = screen.getByRole('button', { name: /Pay Materials Deposit/ })
    fireEvent.click(button)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
  })

  it('shows loading state during payment processing', async () => {
    // Mock a delayed response
    ;(global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ url: 'https://checkout.stripe.com/pay/cs_test_session_123' }),
      }), 100))
    )

    render(<CustomOrderPaymentButton {...defaultProps} />)
    
    const button = screen.getByRole('button', { name: /Pay Materials Deposit/ })
    fireEvent.click(button)

    // Should show loading state
    expect(screen.getByText('Processing...')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('respects disabled prop', () => {
    render(<CustomOrderPaymentButton {...defaultProps} disabled={true} />)
    
    const button = screen.getByRole('button', { name: /Pay Materials Deposit/ })
    expect(button).toBeDisabled()
  })

  it('applies custom className', () => {
    render(<CustomOrderPaymentButton {...defaultProps} className="custom-class" />)
    
    const container = screen.getByText(/Pay Materials Deposit/).closest('div')
    expect(container).toHaveClass('custom-class')
  })

  it('formats different currencies correctly', () => {
    render(
      <CustomOrderPaymentButton
        {...defaultProps}
        currency="EUR"
        amount={2500} // €25.00
      />
    )
    
    expect(screen.getByText(/€25\.00/)).toBeInTheDocument()
  })

  it('formats JPY without decimals', () => {
    render(
      <CustomOrderPaymentButton
        {...defaultProps}
        currency="JPY"
        amount={3000} // ¥30
      />
    )
    
    expect(screen.getByText(/¥30/)).toBeInTheDocument()
  })

  it('uses preferred currency from hook', async () => {
    mockUseCurrency.mockReturnValue({ currency: 'EUR' })
    
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: 'https://checkout.stripe.com/pay/cs_test_session_123' }),
    })

    render(<CustomOrderPaymentButton {...defaultProps} />)
    
    const button = screen.getByRole('button', { name: /Pay Materials Deposit/ })
    fireEvent.click(button)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/stripe/custom-order-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId: 'submission-123',
          paymentType: 'MATERIALS_DEPOSIT',
          preferredCurrency: 'EUR',
        }),
      })
    })
  })

  it('handles missing response URL gracefully', async () => {
    const errorResponse = {
      error: 'No checkout URL provided',
    }
    
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => errorResponse,
    })

    render(<CustomOrderPaymentButton {...defaultProps} />)
    
    const button = screen.getByRole('button', { name: /Pay Materials Deposit/ })
    fireEvent.click(button)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
  })

  it('handles different payment amounts correctly', () => {
    render(
      <CustomOrderPaymentButton
        {...defaultProps}
        amount={100} // $1.00
      />
    )
    
    expect(screen.getByText(/\$1\.00/)).toBeInTheDocument()
  })

  it('handles zero amount gracefully', () => {
    render(
      <CustomOrderPaymentButton
        {...defaultProps}
        amount={0}
      />
    )
    
    expect(screen.getByText(/\$0\.00/)).toBeInTheDocument()
  })
}) 