"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CreateWebsiteButtonProps {
  sellerId: string;
}

export default function CreateWebsiteButton({ sellerId }: CreateWebsiteButtonProps) {
  const handleCreateWebsite = async () => {
    try {
      const response = await fetch('/api/website-builder/websites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: "My Website", // Default name
          description: 'My custom website',
          theme: 'modern'
        }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        console.error('Failed to create website');
      }
    } catch (error) {
      console.error('Error creating website:', error);
    }
  };

  return (
    <Button onClick={handleCreateWebsite} size="lg" className="w-full">
      <Plus className="mr-2 h-4 w-4" />
      Create Website
    </Button>
  );
}
