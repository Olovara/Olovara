"use client";

import { useState } from "react";

const CheckoutButton = ({ productId, quantity }: { productId: string; quantity: number }) => {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId, quantity }),
      });

      const data = await response.json();

      if (response.ok && data.sessionUrl) {
        window.location.href = data.sessionUrl; // Redirect to Stripe checkout
      } else {
        console.error("Checkout failed:", data.error);
        alert(data.error || "Failed to initialize checkout.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className={`w-full bg-purple-500 text-white p-2 rounded-md ${
        loading ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {loading ? "Processing..." : "Buy Now"}
    </button>
  );
};

export default CheckoutButton;
