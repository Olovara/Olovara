"use client";

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
  AddressElement,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

// Load Stripe outside of component to avoid recreating on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

interface EmbeddedPaymentFormProps {
  clientSecret: string;
  customerId?: string;
  amount: number;
  currency: string;
  shippingAddress?: {
    name: string;
    street: string;
    city: string;
    state: string;
    postal: string;
    country: string;
  };
  billingAddress?: {
    name: string;
    street: string;
    city: string;
    state: string;
    postal: string;
    country: string;
  };
  /** Return URL for 3DS / redirect-based methods (Stripe appends PI params). */
  paymentReturnUrl?: string;
  /**
   * When false, only the Payment Element is shown (use when addresses were collected on a prior step).
   * Defaults to true so existing product checkout behavior is unchanged.
   */
  showAddressElements?: boolean;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  onPaymentAttempt?: () => void;
  onPaymentProcessing?: () => void;
}

function PaymentForm({
  clientSecret,
  customerId,
  amount,
  currency,
  shippingAddress,
  billingAddress,
  paymentReturnUrl,
  showAddressElements = true,
  onSuccess,
  onError,
  onPaymentAttempt,
  onPaymentProcessing,
}: EmbeddedPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    // Track payment attempt
    onPaymentAttempt?.();

    setIsLoading(true);
    setMessage(null);

    // Track payment processing
    onPaymentProcessing?.();

    const returnUrl =
      paymentReturnUrl ?? `${window.location.origin}/checkout/success`;

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
      redirect: 'if_required',
    });

    if (error) {
      setMessage(error.message || 'An error occurred');
      onError(error.message || 'Payment failed');
      toast.error(error.message || 'Payment failed');
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setMessage('Payment succeeded!');
      onSuccess(paymentIntent.id);
      toast.success('Payment successful!');
    } else {
      setMessage('Unexpected error occurred');
      onError('Unexpected error occurred');
      toast.error('Unexpected error occurred');
    }

    setIsLoading(false);
  };

  const paymentElementOptions = {
    layout: 'tabs' as const,
    defaultValues: {
      billingDetails: {
        name: billingAddress?.name || shippingAddress?.name,
        address: billingAddress ? {
          line1: billingAddress.street,
          city: billingAddress.city,
          state: billingAddress.state,
          postal_code: billingAddress.postal,
          country: billingAddress.country,
        } : shippingAddress ? {
          line1: shippingAddress.street,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.postal,
          country: shippingAddress.country,
        } : undefined,
      },
    },
  };

  const showAddr = showAddressElements !== false;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Address Elements - only when enabled and parent did not pass addresses */}
        {showAddr && !shippingAddress && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              <AddressElement
                options={{
                  mode: 'shipping',
                  allowedCountries: ['US', 'CA', 'GB', 'AU', 'JP', 'IN', 'SG', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'NZ'],
                }}
              />
            </CardContent>
          </Card>
        )}

        {showAddr && !billingAddress && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Billing Address</CardTitle>
            </CardHeader>
            <CardContent>
              <AddressElement
                options={{
                  mode: 'billing',
                  allowedCountries: ['US', 'CA', 'GB', 'AU', 'JP', 'IN', 'SG', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'NZ'],
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Payment Element */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentElement 
              id="payment-element" 
              options={paymentElementOptions}
            />
          </CardContent>
        </Card>
      </div>

      {/* Error Message */}
      {message && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
          {message}
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading || !stripe || !elements}
        className="w-full"
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Processing...</span>
          </div>
        ) : (
          `Pay ${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`
        )}
      </Button>
    </form>
  );
}

export default function EmbeddedPaymentForm(props: EmbeddedPaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    setClientSecret(props.clientSecret);
  }, [props.clientSecret]);

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#5c1881',
            colorBackground: '#ffffff',
            colorText: '#1f2937',
            colorDanger: '#ef4444',
            fontFamily: 'Inter, system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '8px',
          },
        },
      }}
    >
      <PaymentForm {...props} />
    </Elements>
  );
} 