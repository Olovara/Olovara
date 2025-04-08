"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "next-auth/react";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [isLoading, setIsLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const { data: session } = useSession();
  const userRole = session?.user?.role || "MEMBER";

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!sessionId) return;
      
      try {
        // You can implement an API call here to fetch order details using the session_id
        // For now, we'll just simulate loading
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error fetching order details:", error);
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [sessionId]);

  // Determine the orders page URL based on user role
  const getOrdersPageUrl = () => {
    if (userRole === "SELLER") {
      return "/seller/dashboard/orders";
    } else {
      return "/member/dashboard/orders";
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-3xl py-10">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
          <p className="text-sm text-muted-foreground">Loading your order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-10">
      <Card className="mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Thank you for your purchase!</CardTitle>
          <CardDescription>
            Your order has been successfully processed.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-2 text-sm text-muted-foreground">
            We&apos;ve sent a confirmation email with your order details.
          </p>
          <p className="text-sm text-muted-foreground">
            Order ID: {sessionId}
          </p>
        </CardContent>
        <CardFooter className="flex justify-center space-x-4">
          <Button asChild variant="outline">
            <Link href="/">Continue Shopping</Link>
          </Button>
          <Button asChild>
            <Link href={getOrdersPageUrl()}>View Orders</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 