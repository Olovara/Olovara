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
      const logContext = {
        connectedAccountId: params.connectedAccountId,
        timestamp: new Date().toISOString(),
        action: 'stripe_return_handler'
      };

      console.log(`[CLIENT] Handling Stripe return`, logContext);

      // Retry logic: attempt up to 3 times with exponential backoff
      const maxRetries = 3;
      let lastError: string | null = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[CLIENT] Checking onboarding status (attempt ${attempt}/${maxRetries})`, logContext);
          
          // Check if the Stripe account is fully onboarded
          const response = await fetch('/api/stripe/check-onboarding-status', {
            method: 'POST',
            credentials: 'include', // Required to send session cookies
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              connectedAccountId: params.connectedAccountId
            })
          });

          const data = await response.json();

          if (response.ok && data.success) {
            if (data.connected) {
              console.log(`[CLIENT] Stripe account successfully connected`, { ...logContext, attempt });
              toast.success("Stripe account connected successfully!");
              
              // Clear any cached permissions to force fresh fetch
              if (typeof window !== 'undefined') {
                localStorage.removeItem('yarnnu_user_permissions');
                localStorage.removeItem('yarnnu_user_role');
                localStorage.removeItem('yarnnu_permissions_timestamp');
              }
              
              // Wait a bit longer to ensure database update completes, then refresh
              setTimeout(() => {
                window.location.reload();
              }, 2000);
              return; // Success, exit
            } else {
              console.log(`[CLIENT] Stripe account not fully onboarded yet`, { ...logContext, attempt });
              toast.info("Stripe account setup in progress. This may take a few moments.");
              
              // Still clear cache and reload
              if (typeof window !== 'undefined') {
                localStorage.removeItem('yarnnu_user_permissions');
                localStorage.removeItem('yarnnu_user_role');
                localStorage.removeItem('yarnnu_permissions_timestamp');
              }
              
              setTimeout(() => {
                window.location.reload();
              }, 2000);
              return; // Not fully onboarded, but that's okay
            }
          } else {
            lastError = data.error || data.message || "Failed to verify Stripe connection status";
            console.warn(`[CLIENT] Status check failed (attempt ${attempt})`, { 
              ...logContext, 
              attempt,
              error: lastError,
              status: response.status
            });
            
            // If it's a client error (4xx), don't retry
            if (response.status >= 400 && response.status < 500) {
              console.error(`[CLIENT] Client error - not retrying`, { ...logContext, attempt, error: lastError });
              toast.error(lastError);
              setTimeout(() => {
                window.location.reload();
              }, 2000);
              return;
            }
            
            // For server errors, retry
            if (attempt < maxRetries) {
              const backoffMs = Math.pow(2, attempt - 1) * 1000;
              console.log(`[CLIENT] Retrying after ${backoffMs}ms`, { ...logContext, attempt, backoffMs });
              await new Promise(resolve => setTimeout(resolve, backoffMs));
              continue;
            }
          }
        } catch (error) {
          lastError = "Network error during status check";
          console.error(`[CLIENT] Status check exception (attempt ${attempt})`, { 
            ...logContext, 
            attempt,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });
          
          // Retry on network errors
          if (attempt < maxRetries) {
            const backoffMs = Math.pow(2, attempt - 1) * 1000;
            console.log(`[CLIENT] Retrying after ${backoffMs}ms`, { ...logContext, attempt, backoffMs });
            await new Promise(resolve => setTimeout(resolve, backoffMs));
            continue;
          }
        }
      }

      // If we get here, all retries failed
      console.error(`[CLIENT] All status check attempts failed`, { 
        ...logContext, 
        maxRetries,
        finalError: lastError
      });
      toast.error(lastError || "Failed to verify Stripe connection status. Please refresh the page.");
      
      // Still clear cache and reload to show current state
      if (typeof window !== 'undefined') {
        localStorage.removeItem('yarnnu_user_permissions');
        localStorage.removeItem('yarnnu_user_role');
        localStorage.removeItem('yarnnu_permissions_timestamp');
      }
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    };

    handleStripeConnection();
  }, [params.connectedAccountId]);

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
