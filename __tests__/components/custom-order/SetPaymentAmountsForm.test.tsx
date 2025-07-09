import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils'
import SetPaymentAmountsForm from '@/components/custom-order/SetPaymentAmountsForm'
import { setPaymentAmounts } from '@/actions/customOrderPaymentActions'

// Mock the server action
jest.mock('@/actions/customOrderPaymentActions', () => ({
  setPaymentAmounts: jest.fn(),
}))

// Type for server action return value
type ServerActionResult = 
  | { error: string; success?: undefined }
  | { success: string; error?: undefined }

describe('SetPaymentAmountsForm', () => {
  const defaultProps = {
    submissionId: 'submission-123',
    currency: 'USD',
    onSuccess: jest.fn(),
  }

  const mockSetPaymentAmounts = setPaymentAmounts as jest.MockedFunction<typeof setPaymentAmounts>

  beforeEach(() => {
    mockSetPaymentAmounts.mockResolvedValue({ success: 'Payment amounts set successfully' })
    jest.clearAllMocks()
  })

  it('renders the form with all fields', () => {
    render(<SetPaymentAmountsForm {...defaultProps} />)
    
    expect(screen.getByText('Set Payment Amounts')).toBeInTheDocument()
    expect(screen.getByLabelText(/Materials Deposit/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Final Payment/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Shipping Cost/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Set Payment Amounts/ })).toBeInTheDocument()
  })

  it('displays payment summary correctly', () => {
    render(<SetPaymentAmountsForm {...defaultProps} />)
    
    // Fill in amounts
    fireEvent.change(screen.getByLabelText(/Materials Deposit/), { target: { value: '25.00' } })
    fireEvent.change(screen.getByLabelText(/Final Payment/), { target: { value: '75.00' } })
    fireEvent.change(screen.getByLabelText(/Shipping Cost/), { target: { value: '5.00' } })
    
    // Check summary
    expect(screen.getByText('$25.00')).toBeInTheDocument()
    expect(screen.getByText('$75.00')).toBeInTheDocument()
    expect(screen.getByText('$5.00')).toBeInTheDocument()
    expect(screen.getByText('$105.00')).toBeInTheDocument() // Total
  })

  it('submits form with correct data', async () => {
    render(<SetPaymentAmountsForm {...defaultProps} />)
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/Materials Deposit/), { target: { value: '25.00' } })
    fireEvent.change(screen.getByLabelText(/Final Payment/), { target: { value: '75.00' } })
    fireEvent.change(screen.getByLabelText(/Shipping Cost/), { target: { value: '5.00' } })
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Set Payment Amounts/ }))
    
    await waitFor(() => {
      expect(mockSetPaymentAmounts).toHaveBeenCalledWith({
        submissionId: 'submission-123',
        materialsDepositAmount: 25,
        finalPaymentAmount: 75,
        totalAmount: 105, // 25 + 75 + 5
        currency: 'USD',
        shippingCost: 5,
      })
    })
  })

  it('handles successful submission', async () => {
    render(<SetPaymentAmountsForm {...defaultProps} />)
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/Materials Deposit/), { target: { value: '25.00' } })
    fireEvent.change(screen.getByLabelText(/Final Payment/), { target: { value: '75.00' } })
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Set Payment Amounts/ }))
    
    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled()
    })
  })

  it('handles submission errors', async () => {
    mockSetPaymentAmounts.mockResolvedValue({ error: 'Failed to set payment amounts' })
    
    render(<SetPaymentAmountsForm {...defaultProps} />)
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/Materials Deposit/), { target: { value: '25.00' } })
    fireEvent.change(screen.getByLabelText(/Final Payment/), { target: { value: '75.00' } })
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Set Payment Amounts/ }))
    
    await waitFor(() => {
      expect(defaultProps.onSuccess).not.toHaveBeenCalled()
    })
  })

  it('validates minimum amounts', () => {
    render(<SetPaymentAmountsForm {...defaultProps} />)
    
    // Try to submit with zero amounts
    fireEvent.change(screen.getByLabelText(/Materials Deposit/), { target: { value: '0' } })
    fireEvent.change(screen.getByLabelText(/Final Payment/), { target: { value: '0' } })
    
    const submitButton = screen.getByRole('button', { name: /Set Payment Amounts/ })
    expect(submitButton).toBeDisabled()
  })

  it('allows zero shipping cost', () => {
    render(<SetPaymentAmountsForm {...defaultProps} />)
    
    // Fill in required amounts
    fireEvent.change(screen.getByLabelText(/Materials Deposit/), { target: { value: '25.00' } })
    fireEvent.change(screen.getByLabelText(/Final Payment/), { target: { value: '75.00' } })
    fireEvent.change(screen.getByLabelText(/Shipping Cost/), { target: { value: '0' } })
    
    const submitButton = screen.getByRole('button', { name: /Set Payment Amounts/ })
    expect(submitButton).toBeEnabled()
  })

  it('formats different currencies correctly', () => {
    render(<SetPaymentAmountsForm {...defaultProps} currency="EUR" />)
    
    // Fill in amounts
    fireEvent.change(screen.getByLabelText(/Materials Deposit/), { target: { value: '25.00' } })
    fireEvent.change(screen.getByLabelText(/Final Payment/), { target: { value: '75.00' } })
    fireEvent.change(screen.getByLabelText(/Shipping Cost/), { target: { value: '5.00' } })
    
    // Check EUR formatting
    expect(screen.getByText('€25.00')).toBeInTheDocument()
    expect(screen.getByText('€75.00')).toBeInTheDocument()
    expect(screen.getByText('€5.00')).toBeInTheDocument()
    expect(screen.getByText('€105.00')).toBeInTheDocument()
  })

  it('formats JPY without decimals', () => {
    render(<SetPaymentAmountsForm {...defaultProps} currency="JPY" />)
    
    // Fill in amounts
    fireEvent.change(screen.getByLabelText(/Materials Deposit/), { target: { value: '2500' } })
    fireEvent.change(screen.getByLabelText(/Final Payment/), { target: { value: '7500' } })
    fireEvent.change(screen.getByLabelText(/Shipping Cost/), { target: { value: '500' } })
    
    // Check JPY formatting
    expect(screen.getByText('¥2,500')).toBeInTheDocument()
    expect(screen.getByText('¥7,500')).toBeInTheDocument()
    expect(screen.getByText('¥500')).toBeInTheDocument()
    expect(screen.getByText('¥10,500')).toBeInTheDocument()
  })

  it('shows loading state during submission', async () => {
    // Mock a delayed response
    mockSetPaymentAmounts.mockImplementation(
      () => new Promise(resolve => 
        setTimeout(() => resolve({ success: 'Success' }), 100)
      )
    )
    
    render(<SetPaymentAmountsForm {...defaultProps} />)
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/Materials Deposit/), { target: { value: '25.00' } })
    fireEvent.change(screen.getByLabelText(/Final Payment/), { target: { value: '75.00' } })
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Set Payment Amounts/ }))
    
    // Should show loading state
    expect(screen.getByText('Setting Amounts...')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('handles decimal input correctly', () => {
    render(<SetPaymentAmountsForm {...defaultProps} />)
    
    // Fill in amounts with decimals
    fireEvent.change(screen.getByLabelText(/Materials Deposit/), { target: { value: '25.50' } })
    fireEvent.change(screen.getByLabelText(/Final Payment/), { target: { value: '74.99' } })
    fireEvent.change(screen.getByLabelText(/Shipping Cost/), { target: { value: '5.01' } })
    
    // Check summary
    expect(screen.getByText('$25.50')).toBeInTheDocument()
    expect(screen.getByText('$74.99')).toBeInTheDocument()
    expect(screen.getByText('$5.01')).toBeInTheDocument()
    expect(screen.getByText('$105.50')).toBeInTheDocument() // Total
  })

  it('handles large amounts correctly', () => {
    render(<SetPaymentAmountsForm {...defaultProps} />)
    
    // Fill in large amounts
    fireEvent.change(screen.getByLabelText(/Materials Deposit/), { target: { value: '1000.00' } })
    fireEvent.change(screen.getByLabelText(/Final Payment/), { target: { value: '5000.00' } })
    fireEvent.change(screen.getByLabelText(/Shipping Cost/), { target: { value: '100.00' } })
    
    // Check summary
    expect(screen.getByText('$1,000.00')).toBeInTheDocument()
    expect(screen.getByText('$5,000.00')).toBeInTheDocument()
    expect(screen.getByText('$100.00')).toBeInTheDocument()
    expect(screen.getByText('$6,100.00')).toBeInTheDocument() // Total
  })

  it('validates negative shipping cost', () => {
    render(<SetPaymentAmountsForm {...defaultProps} />)
    
    // Fill in required amounts
    fireEvent.change(screen.getByLabelText(/Materials Deposit/), { target: { value: '25.00' } })
    fireEvent.change(screen.getByLabelText(/Final Payment/), { target: { value: '75.00' } })
    
    // Try negative shipping cost
    fireEvent.change(screen.getByLabelText(/Shipping Cost/), { target: { value: '-5.00' } })
    
    const submitButton = screen.getByRole('button', { name: /Set Payment Amounts/ })
    expect(submitButton).toBeDisabled()
  })

  it('calls onSuccess callback when provided', async () => {
    const onSuccess = jest.fn()
    render(<SetPaymentAmountsForm {...defaultProps} onSuccess={onSuccess} />)
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/Materials Deposit/), { target: { value: '25.00' } })
    fireEvent.change(screen.getByLabelText(/Final Payment/), { target: { value: '75.00' } })
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Set Payment Amounts/ }))
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('works without onSuccess callback', async () => {
    render(<SetPaymentAmountsForm submissionId="submission-123" currency="USD" />)
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/Materials Deposit/), { target: { value: '25.00' } })
    fireEvent.change(screen.getByLabelText(/Final Payment/), { target: { value: '75.00' } })
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Set Payment Amounts/ }))
    
    await waitFor(() => {
      expect(mockSetPaymentAmounts).toHaveBeenCalled()
    })
  })
}) 