"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import PaymentForm from "@/components/PaymentForm";
import { toast } from "sonner";

const CheckoutButton = ({ productId, quantity }: { productId: string; quantity: number }) => {
  const [loading, setLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId, quantity }),
      });

      const data = await response.json();

      if (response.ok && data.clientSecret) {
        setClientSecret(data.clientSecret);
        setShowPaymentForm(true);
      } else {
        console.error("Payment initialization failed:", data.error);
        toast.error(data.error || "Failed to initialize payment.");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    window.location.href = "/checkout/success";
  };

  const handlePaymentError = (error: string) => {
    toast.error(error);
  };

  return (
    <>
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={`w-full bg-purple-500 text-white p-2 rounded-md ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "Processing..." : "Buy Now"}
      </button>

      <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
        <DialogContent className="sm:max-w-[425px]">
          {clientSecret && (
            <PaymentForm
              clientSecret={clientSecret}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CheckoutButton;
