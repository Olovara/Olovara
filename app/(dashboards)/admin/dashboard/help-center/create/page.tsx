"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
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
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/dashboard/help-center")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Help Center
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <h1 className="text-2xl font-bold">Create Help Article</h1>
      </div>

      <HelpArticleForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}

