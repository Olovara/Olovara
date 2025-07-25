"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { newVerification } from "@/actions/new-verification";
import CardWrapper from "@/components/auth/card-wrapper";
import FormError from "@/components/form-error";
import FormSuccess from "@/components/form-success";
import Spinner from "../spinner";

const NewVerificationForm = () => {
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const redirectTo = searchParams.get("redirect");

  const onSubmit = useCallback(() => {
    if (success || error) return;

    if (!token) {
      setError("Missing token! Please check your email and click the verification link again.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    newVerification(token)
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else if (data.success) {
          // Check if user wants to become a seller or has a redirect URL
          const wantsToBecomeSeller = typeof window !== 'undefined' ? localStorage.getItem("wantsToBecomeSeller") : null;
          const isSellerFlow = wantsToBecomeSeller === "true" || redirectTo?.includes('/sell');
          
          if (isSellerFlow) {
            // Custom success message for seller signup flow
            setSuccess("Email verified successfully! Redirecting you to sign in and start your seller application...");
            // Redirect to login page with seller application callback
            setTimeout(() => {
              router.push("/login?callbackUrl=/seller-application");
            }, 2000); // Give user 2 seconds to see success message
          } else {
            // Standard success message for regular signup
            setSuccess(data.success);
          }
        }
      })
      .catch(() => {
        setError("Something went wrong! Please try again later.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token, success, error, redirectTo, router]);

  useEffect(() => {
    onSubmit();
  }, [onSubmit]);

  // Check if this is part of the seller signup flow
  const isSellerSignupFlow = redirectTo?.includes('/sell') || (typeof window !== 'undefined' && localStorage.getItem("wantsToBecomeSeller") === "true");

  return (
    <CardWrapper
      title="Confirming your verification"
      subtitle="Please wait while we verify your email"
      backButtonLabel={isSellerSignupFlow ? "" : "Back to login"}
      backButtonHref={isSellerSignupFlow ? "" : "/login"}
    >
      <div className="flex items-center w-full justify-center">
        {isLoading && <Spinner />}
        {!success && <FormError message={error} />}
        {success && <FormSuccess message={success} />}
      </div>
    </CardWrapper>
  );
};

export default NewVerificationForm;