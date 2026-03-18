"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { usePermissions } from "@/components/providers/PermissionProvider";

interface CheckoutSuccessClientProps {
  isAuthenticated?: boolean;
}

export default function CheckoutSuccessClient({ isAuthenticated = false }: CheckoutSuccessClientProps) {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [isLoading, setIsLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const { role } = usePermissions();

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
  // Only used if user is authenticated
  const getOrdersPageUrl = () => {
    if (role === "SELLER") {
      return "/seller/dashboard/my-purchases";
    } else {
      return "/member/dashboard/my-purchases";
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-3xl py-10">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-primary-700 border-x-transparent border-t-transparent" />
          <p className="text-sm text-brand-dark-neutral-600">
            Loading your order details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-10">
      <Card className="mx-auto bg-brand-light-neutral-50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-success-50">
            <CheckCircle className="h-6 w-6 text-brand-success-600" />
          </div>
          <CardTitle className="text-2xl text-brand-dark-neutral-900">
            Thank you for your purchase!
          </CardTitle>
          <CardDescription className="text-brand-dark-neutral-600">
            Your order has been successfully processed.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-2 text-sm text-brand-dark-neutral-600">
            We&apos;ve sent a confirmation email with your order details.
          </p>
          <p className="text-sm text-brand-dark-neutral-500">
            Order ID: {sessionId}
          </p>
        </CardContent>
        <CardFooter className="flex justify-center space-x-4">
          {/* Outline defaults to accent (tertiary) on hover — force primary fill + contrast text */}
          <Button
            asChild
            variant="outline"
            className="border-brand-primary-700 text-brand-primary-700 hover:bg-brand-primary-700 hover:text-white hover:border-brand-primary-700"
          >
            <Link href="/">Continue Shopping</Link>
          </Button>
          {/* Only show "View Purchases" button if user is authenticated */}
          {isAuthenticated && (
            <Button asChild>
              <Link href={getOrdersPageUrl()}>View Purchases</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}