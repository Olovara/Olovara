import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  getSellerOnboardingSteps,
  getOnboardingProgress,
  getNextOnboardingStep,
  updateOnboardingStep,
} from "@/lib/onboarding";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const logContext: Record<string, any> = {
    endpoint: "/api/seller/onboarding-status",
    timestamp: new Date().toISOString(),
    action: "get_onboarding_status",
  };

  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();

    if (!session?.user?.id) {
      console.error(`[ONBOARDING_STATUS] Authentication failed`, logContext);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    logContext.userId = userId;

    console.log(`[ONBOARDING_STATUS] Fetching onboarding status`, logContext);

    // Get seller data
    const seller = await db.seller.findUnique({
      where: { userId },
      select: {
        id: true,
        applicationAccepted: true,
        stripeConnected: true,
        connectedAccountId: true,
        shopCountry: true,
        isFullyActivated: true,
        shippingOptions: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!seller) {
      console.error(`[ONBOARDING_STATUS] Seller not found`, logContext);
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    logContext.sellerId = seller.id;
    logContext.currentStripeConnected = seller.stripeConnected;
    logContext.hasConnectedAccountId = !!seller.connectedAccountId;

    // Get onboarding steps
    console.log(`[ONBOARDING_STATUS] Fetching onboarding steps`, logContext);
    const onboardingSteps = await getSellerOnboardingSteps(seller.id);
    const completionPercentage = await getOnboardingProgress(seller.id);
    const nextStep = await getNextOnboardingStep(seller.id);

    // Check Stripe connection status - if we have a connectedAccountId but stripeConnected is false,
    // check if the account is actually fully onboarded
    let stripeConnected = seller.stripeConnected && !!seller.connectedAccountId;

    // Skip verification for temp accounts - they should be replaced with real accounts during onboarding
    if (
      seller.connectedAccountId &&
      !seller.stripeConnected &&
      !seller.connectedAccountId.startsWith("temp_")
    ) {
      logContext.connectedAccountId = seller.connectedAccountId;
      logContext.needsVerification = true;

      console.log(
        `[ONBOARDING_STATUS] Verifying Stripe account status (stripeConnected is false but account exists)`,
        logContext
      );

      try {
        const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

        // Retry logic for Stripe API call (3 attempts with exponential backoff)
        let account;
        let retries = 3;
        let lastStripeError;

        while (retries > 0) {
          try {
            account = await stripe.accounts.retrieve(seller.connectedAccountId);
            break; // Success, exit retry loop
          } catch (stripeError: any) {
            lastStripeError = stripeError;
            retries--;
            if (retries > 0) {
              console.warn(
                `[ONBOARDING_STATUS] Stripe API call failed, retrying...`,
                {
                  ...logContext,
                  attemptsLeft: retries,
                  error: stripeError.message,
                  errorType: stripeError.type,
                }
              );
              // Exponential backoff: 1s, 2s, 4s
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * (4 - retries))
              );
            }
          }
        }

        if (!account) {
          const errorDetails = {
            ...logContext,
            error: lastStripeError?.message || "Stripe API timeout",
            errorType: lastStripeError?.type,
            stack: lastStripeError?.stack,
            note: "Failed to retrieve Stripe account after retries",
          };
          console.error(
            `[ONBOARDING_STATUS] Failed to retrieve Stripe account after retries`,
            errorDetails
          );
          // Continue without updating - will try again on next request
          throw lastStripeError || new Error("Stripe API timeout");
        }

        logContext.chargesEnabled = account.charges_enabled;
        logContext.payoutsEnabled = account.payouts_enabled;

        if (account.charges_enabled && account.payouts_enabled) {
          console.log(
            `[ONBOARDING_STATUS] Account fully onboarded, updating database in transaction`,
            logContext
          );

          // Update in a transaction to ensure consistency
          // This fixes the issue where seller.stripeConnected was true but onboarding step was false
          // Retry logic for database transaction (3 attempts with exponential backoff)
          let transactionRetries = 3;
          let transactionSuccess = false;
          let lastTransactionError;

          while (transactionRetries > 0 && !transactionSuccess) {
            try {
              await db.$transaction(async (tx) => {
                // Update the seller's stripeConnected status
                await tx.seller.update({
                  where: { id: seller.id },
                  data: { stripeConnected: true },
                });

                // Mark payment_setup step as completed - MUST be in same transaction
                await tx.onboardingStep.upsert({
                  where: {
                    sellerId_stepKey: {
                      sellerId: seller.id,
                      stepKey: "payment_setup",
                    },
                  },
                  update: {
                    completed: true,
                    completedAt: new Date(),
                  },
                  create: {
                    sellerId: seller.id,
                    stepKey: "payment_setup",
                    completed: true,
                    completedAt: new Date(),
                  },
                });
              });

              transactionSuccess = true; // Success, exit retry loop
            } catch (dbError) {
              lastTransactionError = dbError;
              transactionRetries--;

              // Check if it's a retryable error (transient database errors)
              const isRetryable =
                dbError instanceof Error &&
                (dbError.message.includes("timeout") ||
                  dbError.message.includes("connection") ||
                  dbError.message.includes("deadlock") ||
                  dbError.message.includes("lock"));

              if (transactionRetries > 0 && isRetryable) {
                const backoffMs = 1000 * (4 - transactionRetries); // 1s, 2s, 4s
                console.warn(
                  `[ONBOARDING_STATUS] Database transaction failed, retrying...`,
                  {
                    ...logContext,
                    attemptsLeft: transactionRetries,
                    error:
                      dbError instanceof Error
                        ? dbError.message
                        : String(dbError),
                    backoffMs,
                    isRetryable,
                  }
                );
                await new Promise((resolve) => setTimeout(resolve, backoffMs));
              } else {
                // Not retryable or out of retries, break
                break;
              }
            }
          }

          if (!transactionSuccess) {
            const errorDetails = {
              ...logContext,
              error:
                lastTransactionError instanceof Error
                  ? lastTransactionError.message
                  : String(lastTransactionError),
              errorType:
                lastTransactionError instanceof Error
                  ? lastTransactionError.constructor.name
                  : typeof lastTransactionError,
              stack:
                lastTransactionError instanceof Error
                  ? lastTransactionError.stack
                  : undefined,
              status: "FAILED",
              note: "Transaction failed after retries - seller.stripeConnected and onboarding step may be out of sync",
            };
            console.error(
              `[ONBOARDING_STATUS] Failed to update Stripe connection status in transaction after retries`,
              errorDetails
            );
            // Keep stripeConnected as false if transaction fails
          } else {
            console.log(
              `[ONBOARDING_STATUS] Transaction completed successfully`,
              logContext
            );

            // Recalculate isFullyActivated (outside transaction)
            try {
              await updateOnboardingStep(seller.id, "payment_setup", true);
              console.log(
                `[ONBOARDING_STATUS] isFullyActivated recalculated`,
                logContext
              );
            } catch (recalcError) {
              const errorDetails = {
                ...logContext,
                error:
                  recalcError instanceof Error
                    ? recalcError.message
                    : String(recalcError),
                stack:
                  recalcError instanceof Error ? recalcError.stack : undefined,
                note: "Non-critical - step was already updated in transaction",
              };
              console.warn(
                `[ONBOARDING_STATUS] Failed to recalculate isFullyActivated (non-critical)`,
                errorDetails
              );
            }

            stripeConnected = true;
            console.log(
              `[ONBOARDING_STATUS] Stripe connection status updated successfully`,
              {
                ...logContext,
                status: "SUCCESS",
              }
            );
          }
        } else {
          console.log(
            `[ONBOARDING_STATUS] Account not fully onboarded yet`,
            logContext
          );
        }
      } catch (error) {
        const errorDetails = {
          ...logContext,
          error: error instanceof Error ? error.message : String(error),
          errorType:
            error instanceof Error ? error.constructor.name : typeof error,
          stack: error instanceof Error ? error.stack : undefined,
          note: "Stripe API call failed - could not verify account status",
        };
        console.warn(
          `[ONBOARDING_STATUS] Could not verify Stripe account status`,
          errorDetails
        );
        // Keep stripeConnected as false if we can't verify
      }
    }

    const totalDuration = Date.now() - startTime;
    console.log(`[ONBOARDING_STATUS] Onboarding status fetched successfully`, {
      ...logContext,
      totalDurationMs: totalDuration,
      stripeConnected,
      isFullyActivated: seller.isFullyActivated,
      status: "SUCCESS",
    });

    return NextResponse.json(
      {
        isFullyActivated: seller.isFullyActivated,
        stripeConnected,
        onboardingSteps,
        completionPercentage,
        nextStep,
        currentStep: nextStep || "fully_activated",
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    const errorDetails = {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
      totalDurationMs: totalDuration,
      status: "FAILED",
    };

    console.error(
      `[ONBOARDING_STATUS] Error fetching seller onboarding status`,
      errorDetails
    );

    // Log to database - user could email about "can't see onboarding status"
    const userMessage = logError({
      code: "ONBOARDING_STATUS_FETCH_FAILED",
      userId: session?.user?.id,
      route: "/api/seller/onboarding-status",
      method: "GET",
      error,
      metadata: {
        totalDurationMs: totalDuration,
        note: "Failed to fetch seller onboarding status",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
