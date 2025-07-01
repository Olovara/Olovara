"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ReturnUrlStripeProps {
  params: {
    connectedAccountId: string;
  };
}

export default function ReturnUrlStripe({ params }: ReturnUrlStripeProps) {
  const router = useRouter();

  useEffect(() => {
    // Handle Stripe connection completion
    const handleStripeConnection = async () => {
      try {
        // Trigger session update to reflect Stripe connection
        const response = await fetch("/api/auth/trigger-session-update", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: 'Stripe account connected' }),
        });
        
        if (response.ok) {
          // Refresh the page to get updated session data
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } catch (error) {
        console.error("Error handling Stripe connection:", error);
        toast.error("Failed to update onboarding status");
      }
    };

    handleStripeConnection();
  }, []);

  return (
    <section className="w-full min-h-[80vh] flex items-center justify-center">
      <Card className="w-[350px]">
        <div className="p-6">
          <div className="w-full flex justify-center">
            <Check className="w-12 h-12 rounded-full bg-green-500/30 text-green-500 p-2" />
          </div>
          <div className="mt-3 text-center sm:mt-5 w-full">
            <h3 className="text-lg leading-6 font-medium">
              Linking was Successful
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Congrats on linking your account to Yarnnu. You can now start
              selling your products!
            </p>

            <Button className="mt-5 sm:mt-6 w-full" asChild>
              <Link href="/seller/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
}
