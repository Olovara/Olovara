"use client";

import * as React from "react";
import { useId } from "react";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import BackButton from "./back-button";
import Social from "./social";

export type AuthCardChildRender = (ctx: { headingId: string }) => React.ReactNode;

interface CardWrapperProps {
  children: React.ReactNode | AuthCardChildRender;
  backButtonLabel: string;
  backButtonHref: string;
  showSocial?: boolean;
  socialMode?: "signin" | "signup";
  title: string;
  subtitle: string;
}

const CardWrapper = ({
  children,
  backButtonHref,
  backButtonLabel,
  showSocial,
  socialMode = "signin",
  title,
  subtitle,
}: CardWrapperProps) => {
  const headingId = useId();

  const content =
    typeof children === "function" ? children({ headingId }) : children;

  return (
    <Card className="w-full min-w-0 max-w-md border border-brand-light-neutral-200 bg-brand-light-neutral-50 text-brand-dark-neutral-900 shadow-md">
      <CardHeader className="w-full min-w-0">
        <div className="text-center">
          <h2
            id={headingId}
            className="text-3xl font-bold tracking-tight text-brand-dark-neutral-900"
          >
            {title}
          </h2>
          <p className="mt-2 text-sm text-brand-dark-neutral-600">{subtitle}</p>
        </div>
      </CardHeader>
      <CardContent className="w-full min-w-0">{content}</CardContent>
      {showSocial && (
        <CardFooter className="w-full min-w-0">
          <Social mode={socialMode} />
        </CardFooter>
      )}
      {backButtonLabel && backButtonHref && (
        <CardFooter className="w-full min-w-0">
          <BackButton label={backButtonLabel} href={backButtonHref} />
        </CardFooter>
      )}
    </Card>
  );
};

export default CardWrapper;
