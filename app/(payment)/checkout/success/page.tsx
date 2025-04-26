"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!sessionId) {
        setError("No session ID found");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/orders/session/${sessionId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch order details");
        }

        setOrderDetails(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-lg">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Card className="w-[350px]">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Button asChild>
                <Link href="/">Return to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-[350px]">
        <CardHeader>
          <div className="w-full flex justify-center">
            <Check className="w-12 h-12 rounded-full bg-green-500/30 text-green-500 p-2" />
          </div>
          <CardTitle className="text-center mt-4">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Thank you for your purchase! Your order has been confirmed.
            </p>
            {orderDetails && (
              <div className="text-sm">
                <p>Order ID: {orderDetails.id}</p>
                <p>Amount: ${orderDetails.totalAmount.toFixed(2)}</p>
                <p>Status: {orderDetails.status}</p>
                {orderDetails.shippingAddress && (
                  <div className="mt-2 text-left">
                    <p className="font-medium">Shipping Address:</p>
                    <p>{orderDetails.shippingAddress.line1}</p>
                    {orderDetails.shippingAddress.line2 && (
                      <p>{orderDetails.shippingAddress.line2}</p>
                    )}
                    <p>
                      {orderDetails.shippingAddress.city},{" "}
                      {orderDetails.shippingAddress.state}{" "}
                      {orderDetails.shippingAddress.postal_code}
                    </p>
                    <p>{orderDetails.shippingAddress.country}</p>
                  </div>
                )}
              </div>
            )}
            <Button asChild className="w-full">
              <Link href="/">Return to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 