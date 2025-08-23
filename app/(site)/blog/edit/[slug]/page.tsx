"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCurrentPermissions } from "@/hooks/use-current-permissions";
import BlogPostForm from "@/components/forms/BlogPostForm";

interface BlogPost {
  id?: string;
  title: string;
  description: string;
  content: string;
  contentBlocks?: any[];
  catSlug: string;
  status: "DRAFT" | "PUBLISHED";
  isPrivate: boolean;
  tags: string[];
  keywords: string[];
  readTime: number | null;
  img?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export default function EditBlogPost() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  
  const { permissions, loading: permissionsLoading, hasPermission } = useCurrentPermissions();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [post, setPost] = useState<BlogPost | null>(null);

  // Check if user has WRITE_BLOG permission
  const hasWriteBlogPermission = hasPermission('WRITE_BLOG');

  // Fetch blog post data
  useEffect(() => {
    const loadPost = async () => {
      if (!slug) return;
      
      try {
        const response = await fetch(`/api/blog/posts/${slug}`);
        if (response.ok) {
          const postData = await response.json();
          setPost(postData);
        } else if (response.status === 404) {
          toast.error("Blog post not found");
          router.push("/blog");
        } else {
          toast.error("Failed to load blog post");
        }
      } catch (error) {
        console.error("Error loading blog post:", error);
        toast.error("Failed to load blog post");
      } finally {
        setIsLoading(false);
      }
    };

    loadPost();
  }, [slug, router]);

  const handleSubmit = async (formData: BlogPost, status: "DRAFT" | "PUBLISHED") => {
    if (!post) {
      toast.error("Blog post not found");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading(status === "PUBLISHED" ? "Publishing blog post..." : "Updating blog post...");

    try {
      const response = await fetch(`/api/blog/posts/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update blog post");
      }

      const data = await response.json();
      toast.success(
        status === "PUBLISHED" 
          ? "Blog post published successfully!" 
          : "Blog post updated successfully!", 
        { id: toastId }
      );
      router.push(`/blog/${data.slug}`);
    } catch (error) {
      console.error("Error updating blog post:", error);
      toast.error("Failed to update blog post. Please try again.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading while permissions are being fetched or post is loading
  if (permissionsLoading || isLoading) {
    return <div className="p-4 sm:p-6">Loading...</div>;
  }

  // Check permissions after loading is complete
  if (!hasWriteBlogPermission) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>You do not have permission to edit blog posts.</p>
      </div>
    );
  }

  // Show error if post not found
  if (!post) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold mb-4">Blog Post Not Found</h1>
        <p>The blog post you&apos;re trying to edit could not be found.</p>
        <Button onClick={() => router.push("/blog")} className="mt-4">
          Back to Blog
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 md:px-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Edit Blog Post</h1>
          <Button variant="outline" onClick={() => router.push(`/blog/${slug}`)}>
            View Post
          </Button>
        </div>

        <BlogPostForm
          initialData={post}
          onSubmit={handleSubmit}
          isSubmitting={isSaving}
          mode="edit"
        />
      </div>
    </div>
  );
} 