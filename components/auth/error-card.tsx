"use client";

import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import CardWrapper from "./card-wrapper";

export const ErrorCard = () => {
  return (
    <CardWrapper
      title="Oops! Something went wrong!"
      subtitle="Please try again"
      backButtonHref="/login"
      backButtonLabel="Back to login"
    >
      <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive">
        <ExclamationTriangleIcon className="h-4 w-4 flex-none" />
        <p className="">An error occurred during authentication!</p>
      </div>
    </CardWrapper>
  );
};
