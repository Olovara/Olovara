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
  const callbackUrl = searchParams.get("callbackUrl");

  const onClick = (provider: "google") => {
    signIn(provider, { callbackUrl: callbackUrl || DEFAULT_LOGIN_REDIRECT });
  };

  const buttonText = mode === "signup" ? "Sign up with Google" : "Sign in with Google";

  return (
    <div className="flex items-center w-full gap-x-2">
      <Button
        size="lg"
        className="w-full text-xl hover:bg-purple-400 hover:text-background"
        variant="outline"
        onClick={() => onClick("google")}
      >
        <GrGoogle className="mr-2" />
        {buttonText}
      </Button>
    </div>
  );
};

export default Social;