"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AuthBackLink() {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="mb-4 self-start h-10 w-10 rounded-md text-brand-dark-neutral-700 shadow-sm ring-1 ring-brand-dark-neutral-200/80 bg-background/90 backdrop-blur-sm hover:bg-brand-primary-50 hover:text-brand-primary-700 hover:ring-brand-primary-200"
      asChild
    >
      <Link href="/" aria-label="Back to home">
        <ArrowLeft className="h-5 w-5" aria-hidden />
      </Link>
    </Button>
  );
}
