"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { GrGoogle } from "react-icons/gr";

import { Button } from "../ui/button";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

interface SocialProps {
  mode?: "signin" | "signup";
}

const Social = ({ mode = "signin" }: SocialProps) => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? DEFAULT_LOGIN_REDIRECT;
  const handleGoogle = async () => {
    // Auth.js expects a POST + CSRF for sign-in flows.
    // Using next-auth/react ensures the correct method/cookies are used.
    await signIn("google", { callbackUrl });
  };

  const buttonText = mode === "signup" ? "Sign up with Google" : "Sign in with Google";

  return (
    <div className="flex items-center w-full gap-x-2">
      <Button
        size="lg"
        variant="outline"
        className="h-auto min-h-11 w-full min-w-0 flex-wrap gap-2 whitespace-normal px-3 text-center text-sm leading-snug text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary sm:px-8 sm:text-lg"
        type="button"
        onClick={handleGoogle}
      >
        <>
          <GrGoogle className="mr-2" aria-hidden />
          {buttonText}
        </>
      </Button>
    </div>
  );
};

export default Social;