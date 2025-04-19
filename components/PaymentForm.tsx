"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY as string);

interface PaymentFormProps {
  clientSecret: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function CheckoutForm({ onSuccess, onError }: { onSuccess: () => void; onError: (error: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
      });

      if (error) {
        onError(error.message || "An error occurred during payment");
      } else {
        onSuccess();
      }
    } catch (err) {
      onError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-4">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full"
      >
        {isLoading ? "Processing..." : "Pay Now"}
      </Button>
    </form>
  );
}

export default function PaymentForm({ clientSecret, onSuccess, onError }: PaymentFormProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
} 