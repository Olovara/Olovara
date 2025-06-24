"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { ROLES } from "@/data/roles-and-permissions";

interface ContactSellerButtonProps {
  sellerId: string;
  sellerName: string;
}

export default function ContactSellerButton({ sellerId, sellerName }: ContactSellerButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { data: session, status } = useSession();

  const handleContact = async () => {
    if (status !== "authenticated" || !session?.user) {
      // Redirect to login if not authenticated
      router.push("/login");
      return;
    }

    setIsLoading(true);
    try {
      // Call API to find or create conversation
      const response = await fetch("/api/messages/conversation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sellerId,
          userId: session.user.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create/find conversation");
      }

      const data = await response.json();
      
      // Redirect to appropriate dashboard based on user role
      if (session.user.role === ROLES.SELLER) {
        router.push(`/seller/dashboard/messages?conversation=${data.conversationId}`);
      } else {
        router.push(`/member/dashboard/messages?conversation=${data.conversationId}`);
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleContact}
      disabled={isLoading}
      className="w-full"
    >
      {isLoading ? "Loading..." : `Contact ${sellerName}`}
    </Button>
  );
} 