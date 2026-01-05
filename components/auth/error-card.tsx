"use client";

import { useSearchParams } from "next/navigation";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import CardWrapper from "./card-wrapper";

export const ErrorCard = () => {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  // Map OAuth error codes to user-friendly messages
  const getErrorMessage = () => {
    switch (error) {
      case "OAuthAccountNotLinked":
        return "This email is already registered with a different login method. Please sign in with your original method (email/password) or contact support to link your accounts.";
      case "OAuthCallback":
        return "An error occurred during Google sign-in. Please try again.";
      case "OAuthCreateAccount":
        return "Unable to create account. Please try again or contact support.";
      case "AccessDenied":
        return "Access denied. You may have cancelled the sign-in process.";
      case "Configuration":
        return "Authentication configuration error. Please contact support.";
      case "Verification":
        return "Email verification failed. Please try again.";
      default:
        return "An error occurred during authentication. Please try again.";
    }
  };

  return (
    <CardWrapper
      title="Oops! Something went wrong!"
      subtitle="Please try again"
      backButtonHref="/login"
      backButtonLabel="Back to login"
    >
      <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive">
        <ExclamationTriangleIcon className="h-4 w-4 flex-none" />
        <p className="">{getErrorMessage()}</p>
      </div>
    </CardWrapper>
  );
};
