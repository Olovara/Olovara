"use client";

import Link from "next/link";

import { Button } from "../ui/button";

type BackButtonProps = {
  href: string;
  label: string;
};

const BackButton = ({ href, label }: BackButtonProps) => {
  return (
    <Button
      variant="link"
      className="w-full text-brand-dark-neutral-600 hover:text-brand-primary-700"
      size="sm"
      asChild
    >
      <Link href={href}>{label}</Link>
    </Button>
  );
};

export default BackButton;