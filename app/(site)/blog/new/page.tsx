"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import "react-quill/dist/quill.snow.css";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

// Dynamically import QuillEditor with SSR disabled
const QuillEditor = dynamic(
  () => import("@/components/QuillEditor").then((mod) => mod.QuillEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-[200px] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading editor...</div>
      </div>
    ),
  }
);

interface BlogCategory {
  id: string;
  slug: string;
  title: string;
}

export default function NewBlogPost() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch categories and check admin status
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch categories
        const categoriesRes = await fetch("/api/blog/categories");
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData);
        }

        // Check admin status
        const roleRes = await fetch("/api/auth/get-role");
        if (roleRes.ok) {
          const roleData = await roleRes.json();
          setIsAdmin(roleData.role === "ADMIN");
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load required data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !content.trim() || !category) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Creating blog post...");

    try {
      const response = await fetch("/api/blog/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          content,
          catSlug: category,
          isPrivate,
          status: "DRAFT", // Start as draft, can be published later
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create blog post");
      }

      const data = await response.json();
      toast.success("Blog post created successfully!", { id: toastId });
      router.push(`/blog/${data.slug}`);
    } catch (error) {
      console.error("Error creating blog post:", error);
      toast.error("Failed to create blog post. Please try again.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-4 sm:p-6">Loading...</div>;
  }

  if (!isAdmin) {
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter post description"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.slug}>
                    {cat.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label>Content</Label>
            <QuillEditor
              value={content}
              onChange={setContent}
              placeholder="Write your blog post content..."
            />
          </div>

          {/* Private Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="private"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
            <Label htmlFor="private">Make this post private</Label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving ? "Creating..." : "Create Post"}
          </Button>
        </form>
      </div>
    </div>
  );
} 