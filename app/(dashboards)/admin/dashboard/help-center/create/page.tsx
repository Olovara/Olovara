"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import HelpArticleForm from "@/components/forms/HelpArticleForm";

export default function CreateHelpArticlePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (articleData: any) => {
    setLoading(true);

    try {
      const response = await fetch("/api/help/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(articleData),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.details) {
          // Show detailed validation errors
          const errorMessages = error.details.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ');
          throw new Error(`Validation errors: ${errorMessages}`);
        }
        throw new Error(error.error || "Failed to create article");
      }

      const createdArticle = await response.json();
      toast.success("Help article created successfully!");
      router.push("/admin/dashboard/help-center");
    } catch (error) {
      console.error("Error creating article:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create article");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/admin/dashboard/help-center");
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create Help Article</h1>
      </div>

      <HelpArticleForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}

