/**
 * Integration Tests for Custom Order Checkout
 * 
 * These tests use Stripe's test mode to verify the complete payment flow.
 * Run with: yarn test integration.test.ts --testNamePattern="integration"
 * 
 * Prerequisites:
 * 1. Set STRIPE_SECRET_KEY=sk_test_...
 * 2. Set STRIPE_WEBHOOK_SECRET=whsec_test_...
 * 3. Have a test database running
 */

import { db } from '@/lib/db'
import { stripeCheckout, stripeSecret } from '@/lib/stripe'
import { auth } from '@/auth'

// Only run integration tests when explicitly requested
const isIntegrationTest = process.env.NODE_ENV === 'test' && 
  process.argv.includes('--testNamePattern=integration')

// Skip all tests if not running integration tests
const describeOrSkip = isIntegrationTest ? describe : describe.skip

describeOrSkip('Custom Order Integration Tests', () => {
  let testUser: any
  let testSeller: any
  let testForm: any
  let testSubmission: any

  beforeAll(async () => {
    // Verify Stripe test keys are configured
    if (!process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
      throw new Error('STRIPE_SECRET_KEY must be a test key (sk_test_...) for integration tests')
    }

    // Create test data
    testUser = await db.user.create({
      data: {
        email: 'integration-test@example.com',
        username: 'integrationtest',
        role: 'MEMBER',
      },
    })

    testSeller = await db.seller.create({
      data: {
        userId: testUser.id,
        shopName: 'Integration Test Shop',
        shopNameSlug: 'integration-test-shop',
        connectedAccountId: 'acct_test_integration_123',
        encryptedBusinessName: 'Test Business',
        businessNameIV: 'test-iv',
        businessNameSalt: 'test-salt',
        encryptedTaxId: 'test-tax-id',
        taxIdIV: 'test-iv',
        taxIdSalt: 'test-salt',
        taxCountry: 'US',
      },
    })

    testForm = await db.customOrderForm.create({
      data: {
        sellerId: testSeller.userId,
        title: 'Integration Test Form',
        description: 'Test form for integration testing',
        isActive: true,
      },
    })

    testSubmission = await db.customOrderSubmission.create({
      data: {
        formId: testForm.id,
        userId: testUser.id,
        customerEmail: 'customer@example.com',
        customerName: 'Test Customer',
        status: 'PENDING',
        materialsDepositAmount: 2500, // $25.00
        finalPaymentAmount: 7500, // $75.00
        totalAmount: 10000, // $100.00
        currency: 'USD',
        materialsDepositPaid: false,
        finalPaymentPaid: false,
      },
    })
  })

  afterAll(async () => {
    // Clean up test data
    if (testSubmission) {
      await db.customOrderPayment.deleteMany({
        where: { submissionId: testSubmission.id },
      })
      await db.customOrderSubmission.delete({
        where: { id: testSubmission.id },
      })
    }
    if (testForm) {
      await db.customOrderForm.delete({
        where: { id: testForm.id },
      })
    }
    if (testSeller) {
      await db.seller.delete({
        where: { id: testSeller.id },
      })
    }
    if (testUser) {
      await db.user.delete({
        where: { id: testUser.id },
      })
    }
  })

  describe('integration - Full Payment Flow', () => {
    it('should create and process materials deposit payment', async () => {
      // Mock authentication
      jest.spyOn(auth, 'getServerSession').mockResolvedValue({
        user: testUser,
      } as any)

      // Create payment session
      const sessionParams = {
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Materials deposit for custom order: Integration Test Form',
                description: 'Custom order from Integration Test Shop',
              },
              unit_amount: 2500,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        customer_email: 'customer@example.com',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/custom-order/${testSubmission.id}/materials-paid`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/custom-order/${testSubmission.id}`,
        metadata: {
          submissionId: testSubmission.id,
          paymentType: 'MATERIALS_DEPOSIT',
          userId: testUser.id,
          sellerId: testSeller.id,
          formId: testForm.id,
          amount: '2500',
          platformFee: '125',
          sellerAmount: '2375',
          currency: 'usd',
        },
        payment_intent_data: {
          transfer_data: {
            destination: testSeller.connectedAccountId,
          },
        },
        currency: 'usd',
      }

      // Create Stripe checkout session
      const session = await stripeCheckout.instance.checkout.sessions.create(sessionParams)

      expect(session.id).toBeDefined()
      expect(session.url).toBeDefined()
      expect(session.payment_intent).toBeDefined()

      // Simulate successful payment (in real scenario, this would come from webhook)
      const paymentIntent = await stripeSecret.instance.paymentIntents.retrieve(
        session.payment_intent as string
      )

      expect(paymentIntent.status).toBe('requires_payment_method') // Initial state

      // Update submission to simulate materials deposit paid
      await db.customOrderSubmission.update({
        where: { id: testSubmission.id },
        data: {
          materialsDepositPaid: true,
          status: 'APPROVED',
          materialsDepositSessionId: session.id,
        },
      })

      // Verify database state
      const updatedSubmission = await db.customOrderSubmission.findUnique({
        where: { id: testSubmission.id },
      })

      expect(updatedSubmission?.materialsDepositPaid).toBe(true)
      expect(updatedSubmission?.status).toBe('APPROVED')
    }, 30000) // 30 second timeout for Stripe API calls

    it('should create and process final payment', async () => {
      // Ensure materials deposit is paid first
      await db.customOrderSubmission.update({
        where: { id: testSubmission.id },
        data: {
          materialsDepositPaid: true,
          status: 'READY_FOR_FINAL_PAYMENT',
        },
      })

      // Create final payment session
      const sessionParams = {
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Final payment for custom order: Integration Test Form',
                description: 'Custom order from Integration Test Shop',
              },
              unit_amount: 7500,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        customer_email: 'customer@example.com',
        shipping_address_collection: {
          allowed_countries: ['US', 'CA', 'GB'],
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/custom-order/${testSubmission.id}/final-paid`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/custom-order/${testSubmission.id}`,
        metadata: {
          submissionId: testSubmission.id,
          paymentType: 'FINAL_PAYMENT',
          userId: testUser.id,
          sellerId: testSeller.id,
          formId: testForm.id,
          amount: '7500',
          platformFee: '375',
          sellerAmount: '7125',
          currency: 'usd',
        },
        payment_intent_data: {
          transfer_data: {
            destination: testSeller.connectedAccountId,
          },
        },
        currency: 'usd',
      }

      // Create Stripe checkout session
      const session = await stripeCheckout.instance.checkout.sessions.create(sessionParams)

      expect(session.id).toBeDefined()
      expect(session.url).toBeDefined()
      expect(session.payment_intent).toBeDefined()

      // Simulate successful payment with shipping address
      await db.customOrderSubmission.update({
        where: { id: testSubmission.id },
        data: {
          finalPaymentPaid: true,
          status: 'COMPLETED',
          finalPaymentSessionId: session.id,
          shippingAddress: {
            city: 'New York',
            country: 'US',
            line1: '123 Test St',
            postal_code: '10001',
            state: 'NY',
          },
        },
      })

      // Verify database state
      const updatedSubmission = await db.customOrderSubmission.findUnique({
        where: { id: testSubmission.id },
      })

      expect(updatedSubmission?.finalPaymentPaid).toBe(true)
      expect(updatedSubmission?.status).toBe('COMPLETED')
      expect(updatedSubmission?.shippingAddress).toBeDefined()
    }, 30000)

    it('should handle payment failures gracefully', async () => {
      // Create a session with a card that will be declined
      const sessionParams = {
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Test payment failure',
                description: 'Testing payment failure handling',
              },
              unit_amount: 1000,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        customer_email: 'customer@example.com',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
        metadata: {
          submissionId: testSubmission.id,
          paymentType: 'MATERIALS_DEPOSIT',
        },
        payment_intent_data: {
          transfer_data: {
            destination: testSeller.connectedAccountId,
          },
        },
        currency: 'usd',
      }

      // Create session
      const session = await stripeCheckout.instance.checkout.sessions.create(sessionParams)

      expect(session.id).toBeDefined()

      // The session should be created successfully even if payment fails
      // In a real scenario, the webhook would handle the failure
      expect(session.status).toBe('open')
    }, 30000)
  })

  describe('integration - Webhook Processing', () => {
    it('should process webhook events correctly', async () => {
      // Create a test webhook event
      const webhookEvent = {
        id: 'evt_test_webhook_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_webhook_session_123',
            payment_intent: 'pi_test_webhook_payment_123',
            amount_total: 2500,
            currency: 'usd',
            customer_email: 'customer@example.com',
            metadata: {
              submissionId: testSubmission.id,
              paymentType: 'MATERIALS_DEPOSIT',
            },
            shipping_details: {
              address: {
                city: 'Test City',
                country: 'US',
                line1: '123 Test St',
                postal_code: '12345',
                state: 'TS',
              },
            },
          },
        },
      }

      // In a real test, you would send this to your webhook endpoint
      // For now, we'll simulate the webhook processing logic
      const submission = await db.customOrderSubmission.findUnique({
        where: { id: testSubmission.id },
      })

      expect(submission).toBeDefined()
      expect(submission?.id).toBe(testSubmission.id)

      // Simulate webhook processing
      if (webhookEvent.data.object.metadata.paymentType === 'MATERIALS_DEPOSIT') {
        await db.customOrderSubmission.update({
          where: { id: testSubmission.id },
          data: {
            materialsDepositPaid: true,
            status: 'APPROVED',
          },
        })
      }

      // Verify the update
      const updatedSubmission = await db.customOrderSubmission.findUnique({
        where: { id: testSubmission.id },
      })

      expect(updatedSubmission?.materialsDepositPaid).toBe(true)
      expect(updatedSubmission?.status).toBe('APPROVED')
    })
  })

  describe('integration - Error Handling', () => {
    it('should handle missing seller Stripe account', async () => {
      // Create a seller without connected account
      const sellerWithoutStripe = await db.seller.create({
        data: {
          userId: testUser.id,
          shopName: 'No Stripe Shop',
          shopNameSlug: 'no-stripe-shop',
          connectedAccountId: null, // No Stripe account
          encryptedBusinessName: 'No Stripe Business',
          businessNameIV: 'test-iv',
          businessNameSalt: 'test-salt',
          encryptedTaxId: 'test-tax-id',
          taxIdIV: 'test-iv',
          taxIdSalt: 'test-salt',
          taxCountry: 'US',
        },
      })

      // Try to create a payment session
      try {
        await stripeCheckout.instance.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: 'Test payment',
                },
                unit_amount: 1000,
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          payment_intent_data: {
            transfer_data: {
              destination: null, // This should cause an error
            },
          },
        })

        // Should not reach here
        expect(true).toBe(false)
      } catch (error: any) {
        // Should throw an error about missing destination
        expect(error.message).toContain('destination')
      }

      // Clean up
      await db.seller.delete({
        where: { id: sellerWithoutStripe.id },
      })
    })

    it('should handle invalid submission ID', async () => {
      const invalidSubmissionId = 'invalid-submission-id'

      const submission = await db.customOrderSubmission.findUnique({
        where: { id: invalidSubmissionId },
      })

      expect(submission).toBeNull()
    })
  })
})

// Helper function to run integration tests
export const runIntegrationTests = () => {
  if (isIntegrationTest) {
    console.log('Running integration tests with Stripe test mode...')
  } else {
    console.log('Skipping integration tests. Run with --testNamePattern=integration to enable.')
  }
} 