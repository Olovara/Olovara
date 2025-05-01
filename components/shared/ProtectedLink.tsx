"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ProtectedLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function ProtectedLink({ href, children, className }: ProtectedLinkProps) {
  const router = useRouter();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(href, {
        method: "HEAD",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        router.push(href);
      } else if (response.status === 403) {
        toast.error("You don't have permission to access this page");
      } else if (response.status === 401) {
        toast.error("Please log in to access this page");
        router.push(`/login?callbackUrl=${encodeURIComponent(href)}`);
      } else {
        toast.error("Something went wrong");
      }
    } catch (error) {
      console.error("Navigation error:", error);
      toast.error("Something went wrong");
    }
  };

  return (
    <Link href={href} onClick={handleClick} className={cn(className)}>
      {children}
    </Link>
  );
} 