import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils'
import ContactUsForm from '@/components/forms/ContactUsForm'
import { contactUs } from '@/actions/contact-us'

// Mock the contact-us action
jest.mock('@/actions/contact-us', () => ({
  contactUs: jest.fn(),
}))

// Mock the reCAPTCHA hook
jest.mock('react-google-recaptcha-v3', () => ({
  GoogleReCaptchaProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useGoogleReCaptcha: () => ({
    executeRecaptcha: jest.fn(() => Promise.resolve('mock-token')),
  }),
}))

// Mock environment variable
const originalEnv = process.env
beforeEach(() => {
  process.env = { ...originalEnv, NEXT_PUBLIC_RECAPTCHA_SITE_KEY: 'test-key' }
})

afterEach(() => {
  process.env = originalEnv
  jest.clearAllMocks()
})

describe('ContactUsForm', () => {
  const mockContactUs = contactUs as jest.MockedFunction<typeof contactUs>

  beforeEach(() => {
    mockContactUs.mockResolvedValue({ success: 'Message sent successfully!' })
  })

  it('renders the contact form with all fields', () => {
    render(<ContactUsForm />)
    
    expect(screen.getByText('Contact Us')).toBeInTheDocument()
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/reason/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/how can we help you/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
  })

  it('displays all reason options in the select dropdown', () => {
    render(<ContactUsForm />)
    
    const reasonSelect = screen.getByLabelText(/reason/i)
    fireEvent.click(reasonSelect)
    
    expect(screen.getByText('Billing Questions')).toBeInTheDocument()
    expect(screen.getByText('General Inquiry')).toBeInTheDocument()
    expect(screen.getByText('Listing Issue')).toBeInTheDocument()
    expect(screen.getByText('Account Support')).toBeInTheDocument()
    expect(screen.getByText('Payment Problem')).toBeInTheDocument()
    expect(screen.getByText('Feature Request')).toBeInTheDocument()
    expect(screen.getByText('Report a Bug')).toBeInTheDocument()
    expect(screen.getByText('Other')).toBeInTheDocument()
  })

  it('allows users to fill out the form', async () => {
    render(<ContactUsForm />)
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'John Doe' },
    })
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' },
    })
    
    // Select a reason
    const reasonSelect = screen.getByLabelText(/reason/i)
    fireEvent.click(reasonSelect)
    fireEvent.click(screen.getByText('General Inquiry'))
    
    fireEvent.change(screen.getByLabelText(/how can we help you/i), {
      target: { value: 'I need help with my account' },
    })
    
    // Verify the form values
    expect(screen.getByLabelText(/name/i)).toHaveValue('John Doe')
    expect(screen.getByLabelText(/email/i)).toHaveValue('john@example.com')
    expect(screen.getByLabelText(/how can we help you/i)).toHaveValue('I need help with my account')
  })

  it('submits the form successfully', async () => {
    render(<ContactUsForm />)
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'John Doe' },
    })
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' },
    })
    
    const reasonSelect = screen.getByLabelText(/reason/i)
    fireEvent.click(reasonSelect)
    fireEvent.click(screen.getByText('General Inquiry'))
    
    fireEvent.change(screen.getByLabelText(/how can we help you/i), {
      target: { value: 'I need help with my account' },
    })
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    
    await waitFor(() => {
      expect(mockContactUs).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        reason: 'GENERAL',
        helpDescription: 'I need help with my account',
        website: '',
        recaptchaToken: 'mock-token',
      })
    })
    
    await waitFor(() => {
      expect(screen.getByText('Message sent successfully!')).toBeInTheDocument()
    })
  })

  it('handles form submission errors', async () => {
    mockContactUs.mockResolvedValue({ error: 'Failed to send message' })
    
    render(<ContactUsForm />)
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'John Doe' },
    })
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' },
    })
    
    const reasonSelect = screen.getByLabelText(/reason/i)
    fireEvent.click(reasonSelect)
    fireEvent.click(screen.getByText('General Inquiry'))
    
    fireEvent.change(screen.getByLabelText(/how can we help you/i), {
      target: { value: 'I need help with my account' },
    })
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Failed to send message')).toBeInTheDocument()
    })
  })

  it('prevents submission when honeypot field is filled', async () => {
    render(<ContactUsForm />)
    
    // Fill out the form including the honeypot
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'John Doe' },
    })
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' },
    })
    
    // Fill the honeypot field (hidden from real users)
    const honeypotField = screen.getByLabelText(/website/i)
    fireEvent.change(honeypotField, {
      target: { value: 'spam-bot' },
    })
    
    const reasonSelect = screen.getByLabelText(/reason/i)
    fireEvent.click(reasonSelect)
    fireEvent.click(screen.getByText('General Inquiry'))
    
    fireEvent.change(screen.getByLabelText(/how can we help you/i), {
      target: { value: 'I need help with my account' },
    })
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    
    // The form should not be submitted
    await waitFor(() => {
      expect(mockContactUs).not.toHaveBeenCalled()
    })
  })

  it('disables form fields during submission', async () => {
    // Mock a slow response
    mockContactUs.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: 'Success' }), 100)))
    
    render(<ContactUsForm />)
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'John Doe' },
    })
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' },
    })
    
    const reasonSelect = screen.getByLabelText(/reason/i)
    fireEvent.click(reasonSelect)
    fireEvent.click(screen.getByText('General Inquiry'))
    
    fireEvent.change(screen.getByLabelText(/how can we help you/i), {
      target: { value: 'I need help with my account' },
    })
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    
    // Check that fields are disabled during submission
    expect(screen.getByLabelText(/name/i)).toBeDisabled()
    expect(screen.getByLabelText(/email/i)).toBeDisabled()
    expect(screen.getByLabelText(/how can we help you/i)).toBeDisabled()
  })

  it('resets form after successful submission', async () => {
    render(<ContactUsForm />)
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'John Doe' },
    })
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' },
    })
    
    const reasonSelect = screen.getByLabelText(/reason/i)
    fireEvent.click(reasonSelect)
    fireEvent.click(screen.getByText('General Inquiry'))
    
    fireEvent.change(screen.getByLabelText(/how can we help you/i), {
      target: { value: 'I need help with my account' },
    })
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Message sent successfully!')).toBeInTheDocument()
    })
    
    // Check that form is reset
    expect(screen.getByLabelText(/name/i)).toHaveValue('')
    expect(screen.getByLabelText(/email/i)).toHaveValue('')
    expect(screen.getByLabelText(/how can we help you/i)).toHaveValue('')
  })
}) 