import { NextRequest } from 'next/server'
import { POST as createPaymentSession } from '@/app/api/stripe/custom-order-payment/route'
import { POST as handleWebhook } from '@/app/api/stripe/custom-order-webhooks/route'
import { db } from '@/lib/db'
import { stripeCheckout, stripeSecret } from '@/lib/stripe'
import { auth } from '@/auth'

// Mock all external dependencies
jest.mock('@/lib/db')
jest.mock('@/lib/stripe')
jest.mock('@/auth')
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, status: options?.status || 200 })),
  },
  headers: jest.fn(() => new Map([['stripe-signature', 'test-signature']])),
}))

// Mock environment variables
const mockEnv = {
  STRIPE_WEBHOOK_SECRET: 'whsec_test_webhook_secret',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
}

beforeEach(() => {
  process.env = { ...process.env, ...mockEnv }
  jest.clearAllMocks()
})

// Test data factories
const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'customer@example.com',
  username: 'testcustomer',
  role: 'MEMBER',
  ...overrides,
})

const createMockSeller = (overrides = {}) => ({
  id: 'seller-123',
  userId: 'seller-user-123',
  shopName: 'Test Shop',
  connectedAccountId: 'acct_test_seller_123',
  ...overrides,
})

const createMockCustomOrderForm = (overrides = {}) => ({
  id: 'form-123',
  sellerId: 'seller-user-123',
  title: 'Custom Jewelry Order',
  isActive: true,
  ...overrides,
})

const createMockSubmission = (overrides = {}) => ({
  id: 'submission-123',
  formId: 'form-123',
  userId: 'user-123',
  customerEmail: 'customer@example.com',
  customerName: 'Test Customer',
  status: 'PENDING',
  materialsDepositAmount: 2500, // $25.00 in cents
  finalPaymentAmount: 7500, // $75.00 in cents
  totalAmount: 10000, // $100.00 in cents
  currency: 'USD',
  materialsDepositPaid: false,
  finalPaymentPaid: false,
  shippingCost: 500, // $5.00 in cents
  form: {
    id: 'form-123',
    title: 'Custom Jewelry Order',
    seller: createMockSeller(),
  },
  ...overrides,
})

const createMockStripeSession = (overrides = {}) => ({
  id: 'cs_test_session_123',
  url: 'https://checkout.stripe.com/pay/cs_test_session_123',
  payment_intent: 'pi_test_payment_intent_123',
  amount_total: 2500,
  currency: 'usd',
  customer_email: 'customer@example.com',
  metadata: {
    submissionId: 'submission-123',
    paymentType: 'MATERIALS_DEPOSIT',
    userId: 'user-123',
    sellerId: 'seller-123',
    formId: 'form-123',
    amount: '2500',
    platformFee: '125',
    sellerAmount: '2375',
    currency: 'usd',
  },
  ...overrides,
})

const createMockStripeAccount = (overrides = {}) => ({
  id: 'acct_test_seller_123',
  capabilities: {
    transfers: 'active',
    card_payments: 'active',
  },
  ...overrides,
})

describe('Custom Order Checkout Process', () => {
  describe('POST /api/stripe/custom-order-payment', () => {
    const mockAuth = auth as jest.MockedFunction<typeof auth>
    const mockDb = db as jest.Mocked<typeof db>
    const mockStripeCheckout = stripeCheckout.instance as jest.Mocked<any>
    const mockStripeSecret = stripeSecret.instance as jest.Mocked<any>

    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: createMockUser(),
      } as any)

      mockDb.customOrderSubmission.findUnique.mockResolvedValue(createMockSubmission())
      mockDb.customOrderSubmission.update.mockResolvedValue(createMockSubmission())
      mockStripeSecret.accounts.retrieve.mockResolvedValue(createMockStripeAccount())
      mockStripeCheckout.checkout.sessions.create.mockResolvedValue(createMockStripeSession())
    })

    it('should create a materials deposit payment session successfully', async () => {
      const requestBody = {
        submissionId: 'submission-123',
        paymentType: 'MATERIALS_DEPOSIT',
        preferredCurrency: 'USD',
      }

      const request = new NextRequest('http://localhost:3000/api/stripe/custom-order-payment', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await createPaymentSession(request)
      const responseData = await response.json()

      expect(responseData.url).toBe('https://checkout.stripe.com/pay/cs_test_session_123')
      expect(mockStripeCheckout.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_method_types: ['card'],
          mode: 'payment',
          customer_email: 'customer@example.com',
          metadata: expect.objectContaining({
            submissionId: 'submission-123',
            paymentType: 'MATERIALS_DEPOSIT',
          }),
        })
      )
    })

    it('should create a final payment session successfully', async () => {
      const submissionWithMaterialsPaid = createMockSubmission({
        materialsDepositPaid: true,
        status: 'READY_FOR_FINAL_PAYMENT',
      })

      mockDb.customOrderSubmission.findUnique.mockResolvedValue(submissionWithMaterialsPaid)

      const requestBody = {
        submissionId: 'submission-123',
        paymentType: 'FINAL_PAYMENT',
        preferredCurrency: 'USD',
      }

      const request = new NextRequest('http://localhost:3000/api/stripe/custom-order-payment', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await createPaymentSession(request)
      const responseData = await response.json()

      expect(responseData.url).toBe('https://checkout.stripe.com/pay/cs_test_session_123')
      expect(mockStripeCheckout.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          shipping_address_collection: {
            allowed_countries: expect.any(Array),
          },
          metadata: expect.objectContaining({
            paymentType: 'FINAL_PAYMENT',
          }),
        })
      )
    })

    it('should reject payment if user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const requestBody = {
        submissionId: 'submission-123',
        paymentType: 'MATERIALS_DEPOSIT',
      }

      const request = new NextRequest('http://localhost:3000/api/stripe/custom-order-payment', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await createPaymentSession(request)
      const responseData = await response.json()

      expect(responseData.error).toBe('Unauthorized')
    })

    it('should reject payment if submission is not found', async () => {
      mockDb.customOrderSubmission.findUnique.mockResolvedValue(null)

      const requestBody = {
        submissionId: 'nonexistent-submission',
        paymentType: 'MATERIALS_DEPOSIT',
      }

      const request = new NextRequest('http://localhost:3000/api/stripe/custom-order-payment', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await createPaymentSession(request)
      const responseData = await response.json()

      expect(responseData.error).toBe('Submission not found')
    })

    it('should reject payment if user does not own the submission', async () => {
      const submission = createMockSubmission({ userId: 'different-user-123' })
      mockDb.customOrderSubmission.findUnique.mockResolvedValue(submission)

      const requestBody = {
        submissionId: 'submission-123',
        paymentType: 'MATERIALS_DEPOSIT',
      }

      const request = new NextRequest('http://localhost:3000/api/stripe/custom-order-payment', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await createPaymentSession(request)
      const responseData = await response.json()

      expect(responseData.error).toBe('Unauthorized')
    })

    it('should reject materials deposit if already paid', async () => {
      const submission = createMockSubmission({ materialsDepositPaid: true })
      mockDb.customOrderSubmission.findUnique.mockResolvedValue(submission)

      const requestBody = {
        submissionId: 'submission-123',
        paymentType: 'MATERIALS_DEPOSIT',
      }

      const request = new NextRequest('http://localhost:3000/api/stripe/custom-order-payment', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await createPaymentSession(request)
      const responseData = await response.json()

      expect(responseData.error).toBe('Materials deposit already paid')
    })

    it('should reject final payment if materials deposit not paid', async () => {
      const submission = createMockSubmission({ materialsDepositPaid: false })
      mockDb.customOrderSubmission.findUnique.mockResolvedValue(submission)

      const requestBody = {
        submissionId: 'submission-123',
        paymentType: 'FINAL_PAYMENT',
      }

      const request = new NextRequest('http://localhost:3000/api/stripe/custom-order-payment', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await createPaymentSession(request)
      const responseData = await response.json()

      expect(responseData.error).toBe('Materials deposit must be paid first')
    })

    it('should reject payment if seller Stripe account is not connected', async () => {
      const submission = createMockSubmission({
        form: {
          ...createMockCustomOrderForm(),
          seller: createMockSeller({ connectedAccountId: null }),
        },
      })
      mockDb.customOrderSubmission.findUnique.mockResolvedValue(submission)

      const requestBody = {
        submissionId: 'submission-123',
        paymentType: 'MATERIALS_DEPOSIT',
      }

      const request = new NextRequest('http://localhost:3000/api/stripe/custom-order-payment', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await createPaymentSession(request)
      const responseData = await response.json()

      expect(responseData.error).toBe("Seller's Stripe account not connected")
    })

    it('should handle currency conversion when preferred currency differs', async () => {
      // Mock fetch for currency conversion
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ convertedAmount: 2300 }), // Convert $25 USD to EUR
        })
      ) as jest.Mock

      const requestBody = {
        submissionId: 'submission-123',
        paymentType: 'MATERIALS_DEPOSIT',
        preferredCurrency: 'EUR',
      }

      const request = new NextRequest('http://localhost:3000/api/stripe/custom-order-payment', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await createPaymentSession(request)
      const responseData = await response.json()

      expect(responseData.url).toBe('https://checkout.stripe.com/pay/cs_test_session_123')
      expect(mockStripeCheckout.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                currency: 'eur',
                unit_amount: 2300, // Converted amount
              }),
            }),
          ],
        })
      )
    })
  })

  describe('POST /api/stripe/custom-order-webhooks', () => {
    const mockDb = db as jest.Mocked<typeof db>
    const mockStripeWebhook = stripeWebhook.instance as jest.Mocked<any>

    beforeEach(() => {
      mockDb.customOrderSubmission.findUnique.mockResolvedValue(createMockSubmission())
      mockDb.customOrderPayment.create.mockResolvedValue({
        id: 'payment-123',
        submissionId: 'submission-123',
        paymentType: 'MATERIALS_DEPOSIT',
        amount: 2500,
        status: 'COMPLETED',
      } as any)
      mockDb.customOrderSubmission.update.mockResolvedValue(createMockSubmission())
    })

    it('should process successful materials deposit payment', async () => {
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: createMockStripeSession({
            metadata: {
              submissionId: 'submission-123',
              paymentType: 'MATERIALS_DEPOSIT',
            },
          }),
        },
      }

      // Mock Stripe webhook verification
      mockStripeWebhook.webhooks.constructEvent.mockReturnValue(mockEvent)

      // Mock Stripe API calls
      mockStripeWebhook.paymentIntents.retrieve.mockResolvedValue({
        latest_charge: 'ch_test_charge_123',
      })
      mockStripeWebhook.charges.retrieve.mockResolvedValue({
        id: 'ch_test_charge_123',
        status: 'succeeded',
      })

      const request = new NextRequest('http://localhost:3000/api/stripe/custom-order-webhooks', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
          'stripe-signature': 'test-signature',
        },
      })

      const response = await handleWebhook(request)

      expect(response.status).toBe(200)
      expect(mockDb.customOrderPayment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          submissionId: 'submission-123',
          paymentType: 'MATERIALS_DEPOSIT',
          status: 'COMPLETED',
        }),
      })
      expect(mockDb.customOrderSubmission.update).toHaveBeenCalledWith({
        where: { id: 'submission-123' },
        data: expect.objectContaining({
          materialsDepositPaid: true,
          status: 'APPROVED',
        }),
      })
    })

    it('should process successful final payment', async () => {
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: createMockStripeSession({
            metadata: {
              submissionId: 'submission-123',
              paymentType: 'FINAL_PAYMENT',
            },
            shipping_details: {
              address: {
                city: 'New York',
                country: 'US',
                line1: '123 Main St',
                postal_code: '10001',
                state: 'NY',
              },
            },
          }),
        },
      }

      mockStripeWebhook.webhooks.constructEvent.mockReturnValue(mockEvent)
      mockStripeWebhook.paymentIntents.retrieve.mockResolvedValue({
        latest_charge: 'ch_test_charge_123',
      })
      mockStripeWebhook.charges.retrieve.mockResolvedValue({
        id: 'ch_test_charge_123',
        status: 'succeeded',
      })

      const request = new NextRequest('http://localhost:3000/api/stripe/custom-order-webhooks', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
          'stripe-signature': 'test-signature',
        },
      })

      const response = await handleWebhook(request)

      expect(response.status).toBe(200)
      expect(mockDb.customOrderSubmission.update).toHaveBeenCalledWith({
        where: { id: 'submission-123' },
        data: expect.objectContaining({
          finalPaymentPaid: true,
          status: 'COMPLETED',
          shippingAddress: expect.objectContaining({
            city: 'New York',
            country: 'US',
          }),
        }),
      })
    })

    it('should handle payment failure', async () => {
      const mockEvent = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test_failed_123',
            metadata: {
              submissionId: 'submission-123',
            },
          },
        },
      }

      mockStripeWebhook.webhooks.constructEvent.mockReturnValue(mockEvent)

      const request = new NextRequest('http://localhost:3000/api/stripe/custom-order-webhooks', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
          'stripe-signature': 'test-signature',
        },
      })

      const response = await handleWebhook(request)

      expect(response.status).toBe(200)
      expect(mockDb.customOrderPayment.updateMany).toHaveBeenCalledWith({
        where: {
          stripePaymentIntentId: 'pi_test_failed_123',
          status: 'PENDING',
        },
        data: { status: 'FAILED' },
      })
    })

    it('should reject webhook with invalid signature', async () => {
      mockStripeWebhook.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature')
      })

      const request = new NextRequest('http://localhost:3000/api/stripe/custom-order-webhooks', {
        method: 'POST',
        body: 'invalid-body',
        headers: {
          'stripe-signature': 'invalid-signature',
        },
      })

      const response = await handleWebhook(request)

      expect(response.status).toBe(400)
    })
  })
})

// Integration test helpers for end-to-end testing
export const createTestCustomOrder = async () => {
  // This would be used for integration tests that need real database operations
  const user = await db.user.create({
    data: createMockUser(),
  })

  const seller = await db.seller.create({
    data: createMockSeller({ userId: user.id }),
  })

  const form = await db.customOrderForm.create({
    data: createMockCustomOrderForm({ sellerId: seller.userId }),
  })

  const submission = await db.customOrderSubmission.create({
    data: createMockSubmission({
      formId: form.id,
      userId: user.id,
    }),
  })

  return { user, seller, form, submission }
}

export const cleanupTestData = async (submissionId: string) => {
  // Clean up test data after integration tests
  await db.customOrderPayment.deleteMany({
    where: { submissionId },
  })
  await db.customOrderSubmission.delete({
    where: { id: submissionId },
  })
} 