import { ErrorCard } from "@/components/auth/error-card";
import { headers } from "next/headers";
import { logError } from "@/lib/error-logger";
import { Suspense } from "react";

/**
 * Helper function to get client IP and user agent for logging
 */
async function getRequestContext() {
  const headersList = await headers();
  const forwarded = headersList.get('x-forwarded-for');
  const realIP = headersList.get('x-real-ip');
  const cfConnectingIP = headersList.get('cf-connecting-ip');
  const xClientIP = headersList.get('x-client-ip');
  const userAgent = headersList.get('user-agent');
  
  // Try different IP headers in order of preference
  let clientIP = '';
  if (cfConnectingIP) {
    clientIP = cfConnectingIP;
  } else if (realIP) {
    clientIP = realIP;
  } else if (xClientIP) {
    clientIP = xClientIP;
  } else if (forwarded) {
    clientIP = forwarded.split(',')[0].trim();
  }
  
  return { clientIP, userAgent };
}

export const metadata = {
  title: "Error",
  description: "Something went wrong!",
};

const ErrorPageContent = async ({
  searchParams,
}: {
  searchParams: { error?: string; callbackUrl?: string };
}) => {
  // Log OAuth errors for monitoring
  const error = searchParams.error;
  if (error) {
    try {
      const requestContext = await getRequestContext();
      const { clientIP, userAgent } = requestContext;
      
      // Map OAuth error codes to log codes
      const errorCodeMap: Record<string, string> = {
        OAuthAccountNotLinked: "OAUTH_ACCOUNT_NOT_LINKED",
        OAuthCallback: "OAUTH_CALLBACK_ERROR",
        OAuthCreateAccount: "OAUTH_CREATE_ACCOUNT_ERROR",
        AccessDenied: "OAUTH_ACCESS_DENIED",
        Configuration: "OAUTH_CONFIGURATION_ERROR",
        Verification: "OAUTH_VERIFICATION_ERROR",
      };

      const logCode = errorCodeMap[error] || "OAUTH_UNKNOWN_ERROR";
      
      logError({
        code: logCode,
        route: "app/(auth)/error/page",
        method: "GET",
        metadata: {
          errorType: error,
          callbackUrl: searchParams.callbackUrl || null,
          clientIP,
          userAgent,
          timestamp: new Date().toISOString(),
          reason: `OAuth error occurred: ${error}`,
        },
        message: `OAuth authentication error: ${error}`,
      });
    } catch (loggingError) {
      // Don't fail the page if logging fails
      console.error("[ERROR_PAGE] Failed to log OAuth error:", loggingError);
    }
  }

  return <ErrorCard />;
};

const ErrorPage = ({
  searchParams,
}: {
  searchParams: { error?: string; callbackUrl?: string };
}) => {
  return (
    <Suspense fallback={<ErrorCard />}>
      <ErrorPageContent searchParams={searchParams} />
    </Suspense>
  );
};

export default ErrorPage;