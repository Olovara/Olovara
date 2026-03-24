"use client";

import { useSearchParams } from "next/navigation";
import { GrGoogle } from "react-icons/gr";

import { Button } from "../ui/button";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

interface SocialProps {
  mode?: "signin" | "signup";
}

const Social = ({ mode = "signin" }: SocialProps) => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? DEFAULT_LOGIN_REDIRECT;
  // Direct link to OAuth endpoint so the server does the redirect to Google.
  // Avoids reliance on client-side signIn() which can fail silently (no redirect, user stays on login).
  const googleSignInHref = `/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  const buttonText = mode === "signup" ? "Sign up with Google" : "Sign in with Google";

  return (
    <div className="flex items-center w-full gap-x-2">
      <Button
        size="lg"
        variant="outline"
        className="h-auto min-h-11 w-full min-w-0 flex-wrap gap-2 whitespace-normal px-3 text-center text-sm leading-snug text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary sm:px-8 sm:text-lg"
        asChild
      >
        <a href={googleSignInHref}>
          <GrGoogle className="mr-2" aria-hidden />
          {buttonText}
        </a>
      </Button>
    </div>
  );
};

export default Social;