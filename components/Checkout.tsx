"use client";

import React, { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY as string);

const Checkout = ({ sessionId }: { sessionId: string }) => {
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      setCheckoutUrl(`https://checkout.stripe.com/c/pay/${sessionId}#hosted-checkout`);
    }
  }, [sessionId]);

  if (!checkoutUrl) return <p>Loading checkout...</p>;

  return (
    <iframe
      src={checkoutUrl}
      width="100%"
      height="700"
      style={{ border: "none", borderRadius: "10px" }}
      allow="payment"
    />
  );
};

export default Checkout;
