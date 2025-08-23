"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCurrentPermissions } from "@/hooks/use-current-permissions";
import BlogPostForm from "@/components/forms/BlogPostForm";

interface BlogPost {
  id?: string;
  title: string;
  description: string;
  content: string;
  catSlug: string;
  status: "DRAFT" | "PUBLISHED";
  isPrivate: boolean;
  tags: string[];
  keywords: string[];
  readTime: number | null;
  img?: string | null;
}

export default function NewBlogPost() {
  const router = useRouter();
  const {
    permissions,
    loading: permissionsLoading,
    hasPermission,
  } = useCurrentPermissions();
  const [isSaving, setIsSaving] = useState(false);

  // Check if user has WRITE_BLOG permission
  const hasWriteBlogPermission = hasPermission("WRITE_BLOG");

  const handleSubmit = async (
    formData: BlogPost,
    status: "DRAFT" | "PUBLISHED"
  ) => {
    setIsSaving(true);
    const toastId = toast.loading(
      status === "PUBLISHED"
        ? "Publishing blog post..."
        : "Creating blog post..."
    );

    try {
      const response = await fetch("/api/blog/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create blog post");
      }

      const data = await response.json();
      toast.success(
        status === "PUBLISHED"
          ? "Blog post published successfully!"
          : "Blog post created successfully!",
        { id: toastId }
      );
      router.push(`/blog/${data.slug}`);
    } catch (error) {
      console.error("Error creating blog post:", error);
      toast.error("Failed to create blog post. Please try again.", {
        id: toastId,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading while permissions are being fetched
  if (permissionsLoading) {
    return <div className="p-4 sm:p-6">Loading...</div>;
  }

  // Check permissions after loading is complete
  if (!hasWriteBlogPermission) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>You do not have permission to create blog posts.</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 md:px-8">
      <div className="max-w-[1400px] mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create New Blog Post</h1>

        <BlogPostForm
          onSubmit={handleSubmit}
          isSubmitting={isSaving}
          mode="create"
        />
      </div>
    </div>
  );
}
