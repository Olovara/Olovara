"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { NewsletterSubscriptionSchema } from "@/schemas/NewsletterSubscriptionSchema";

interface NewsletterSubscriptionFormProps {
  className?: string;
  variant?: "default" | "compact";
}

export default function NewsletterSubscriptionForm({ 
  className = "", 
  variant = "default" 
}: NewsletterSubscriptionFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    // Validate email format
    try {
      NewsletterSubscriptionSchema.parse({ email: email.trim() });
    } catch (error) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          source: "website",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Successfully subscribed to newsletter!");
        setEmail("");
      } else {
        toast.error(data.error || "Failed to subscribe. Please try again.");
      }
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === "compact") {
    return (
      <div className={`space-y-3 ${className}`}>
        <div>
          <h4 className="text-sm font-semibold text-gray-900">
            STAY UPDATED
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            Get the latest updates and exclusive offers
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="text-sm h-9"
            disabled={isLoading}
            required
          />
          <Button 
            type="submit" 
            size="sm" 
            disabled={isLoading}
            className="h-9 px-3 text-xs"
          >
            {isLoading ? "..." : "Subscribe"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h4 className="text-sm font-semibold text-gray-900">
          Newsletter
        </h4>
        <p className="text-sm text-muted-foreground mt-1">
          Stay updated with the latest products, exclusive offers, and handmade stories.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="text-sm"
          disabled={isLoading}
          required
        />
        <Button 
          type="submit" 
          className="w-full text-sm"
          disabled={isLoading}
        >
          {isLoading ? "Subscribing..." : "Subscribe to Newsletter"}
        </Button>
      </form>
      
      <p className="text-xs text-muted-foreground">
        We respect your privacy. Unsubscribe at any time.
      </p>
    </div>
  );
} 