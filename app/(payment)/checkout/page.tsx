"use client";

import { useEffect, useState } from "react";
import Checkout from "@/components/Checkout";

const CheckoutPage = ({ params }: { params: { productId: string } }) => {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const createCheckoutSession = async () => {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: params.productId,
          quantity: 1,
          buyerId: "user_id",
          connectedAccountId: "acct_**********",
          totalAmount: 25.0, // Replace dynamically
        }),
      });

      const data = await res.json();
      if (data.sessionId) {
        setSessionId(data.sessionId);
      }
    };

    createCheckoutSession();
  }, [params.productId]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Complete Your Purchase</h1>
      {sessionId ? (
        <Checkout sessionId={sessionId} />
      ) : (
        <p>Initializing checkout...</p>
      )}
    </div>
  );
};

export default CheckoutPage;
