"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { GrGoogle } from "react-icons/gr";

import { Button } from "../ui/button";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

const Social = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const onClick = (provider: "google") => {
    signIn(provider, { callbackUrl: callbackUrl || DEFAULT_LOGIN_REDIRECT });
  };

  return (
    <div className="flex items-center w-full gap-x-2">
      <Button
        size="lg"
        className="w-full text-xl hover:bg-purple-400 hover:text-background"
        variant="outline"
        onClick={() => onClick("google")}
      >
        <GrGoogle />
      </Button>
    </div>
  );
};

export default Social;