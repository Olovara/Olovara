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
          setSuccess(data.success);
          
          // Check if user wants to become a seller or has a redirect URL
          const wantsToBecomeSeller = localStorage.getItem("wantsToBecomeSeller");
          if (wantsToBecomeSeller === "true" || redirectTo) {
            // Redirect to the specified URL or sell page with seller intent
            const redirectUrl = redirectTo || "/sell?startApplication=true";
            setTimeout(() => {
              router.push(redirectUrl);
            }, 2000); // Give user 2 seconds to see success message
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

  return (
    <CardWrapper
      title="Confirming your verification"
      subtitle="Please wait while we verify your email"
      backButtonLabel="Back to login"
      backButtonHref="/login"
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