"use client";

import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { usePermissions } from "@/components/providers/PermissionProvider";
import { ROLES } from "@/data/roles-and-permissions";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ContactSellerButtonProps {
  sellerId: string;
  sellerName: string;
}

export function ContactSellerButton({ sellerId, sellerName }: ContactSellerButtonProps) {
  const { data: session } = useSession();
  const { role } = usePermissions();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleContactSeller = async () => {
    if (!session?.user?.id) {
      toast.error("Please log in to contact sellers");
      return;
    }

    // Don't allow sellers to contact themselves
    if (session.user.id === sellerId) {
      toast.error("You cannot contact yourself");
      return;
    }

    // Don't allow sellers to contact other sellers (business rule)
    if (role === ROLES.SELLER) {
      toast.error("Sellers cannot contact other sellers");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sellerId: sellerId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create conversation");
      }

      const data = await response.json();
      
      if (data.success) {
        // Redirect to the conversation
        router.push(`/messages?conversationId=${data.conversationId}`);
        toast.success(`Conversation started with ${sellerName}`);
      } else {
        throw new Error(data.error || "Failed to create conversation");
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Failed to start conversation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!session?.user?.id) {
    return (
      <Button 
        onClick={() => router.push("/login")}
        variant="outline"
        className="w-full"
      >
        Log in to Contact Seller
      </Button>
    );
  }

  return (
    <Button
      onClick={handleContactSeller}
      disabled={isLoading || session.user.id === sellerId}
      className="w-full"
    >
      {isLoading ? "Creating Conversation..." : "Contact Seller"}
    </Button>
  );
} 