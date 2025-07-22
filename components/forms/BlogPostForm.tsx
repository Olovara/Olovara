"use client";

import { useState, useEffect } from "react";
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
import { X } from "lucide-react";

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
  metaTitle?: string | null;
  metaDescription?: string | null;
}

interface BlogPostFormProps {
  initialData?: BlogPost | null;
  onSubmit: (data: BlogPost, status: "DRAFT" | "PUBLISHED") => Promise<void>;
  isSubmitting: boolean;
  mode: "create" | "edit";
}

export default function BlogPostForm({ 
  initialData, 
  onSubmit, 
  isSubmitting, 
  mode 
}: BlogPostFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [category, setCategory] = useState(initialData?.catSlug || "");
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isPrivate, setIsPrivate] = useState(initialData?.isPrivate || false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Tags and keywords state
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [keywords, setKeywords] = useState<string[]>(initialData?.keywords || []);
  const [tagInput, setTagInput] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription || "");

  // Calculate word count and read time
  const calculateReadTime = (content: string) => {
    // Remove HTML tags and get plain text
    const plainText = content.replace(/<[^>]*>/g, '');
    
    // Split by whitespace and filter out empty strings
    const words = plainText.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    
    // Calculate read time (250 words per minute)
    const readTimeMinutes = Math.ceil(wordCount / 250);
    
    return { wordCount, readTimeMinutes };
  };

  const { wordCount, readTimeMinutes } = calculateReadTime(content);

  // Fetch categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesRes = await fetch("/api/blog/categories");
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error("Error loading categories:", error);
        toast.error("Failed to load categories");
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Add tag
  const addTag = () => {
    if (tagInput.trim() !== "" && !tags.includes(tagInput.trim())) {
      const updatedTags = [...tags, tagInput.trim()];
      setTags(updatedTags);
      setTagInput("");
    }
  };

  // Add keyword
  const addKeyword = () => {
    if (keywordInput.trim() !== "" && !keywords.includes(keywordInput.trim())) {
      const updatedKeywords = [...keywords, keywordInput.trim()];
      setKeywords(updatedKeywords);
      setKeywordInput("");
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    const updatedTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(updatedTags);
  };

  // Remove keyword
  const removeKeyword = (keywordToRemove: string) => {
    const updatedKeywords = keywords.filter((keyword) => keyword !== keywordToRemove);
    setKeywords(updatedKeywords);
  };

  const handleSubmit = async (e: React.FormEvent, status: "DRAFT" | "PUBLISHED" = "DRAFT") => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !content.trim() || !category) {
      toast.error("Please fill in all required fields");
      return;
    }

    const formData: BlogPost = {
      ...initialData,
      title: title.trim(),
      description: description.trim(),
      content: content.trim(),
      catSlug: category,
      status: initialData?.status || "DRAFT",
      isPrivate,
      tags,
      keywords,
      readTime: readTimeMinutes,
      metaTitle: metaTitle.trim() || null,
      metaDescription: metaDescription.trim() || null,
    };

    await onSubmit(formData, status);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => handleSubmit(e, "DRAFT")} className="space-y-6">
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
        {/* Word count and read time display */}
        <div className="flex justify-between items-center text-sm text-muted-foreground mt-2">
          <span>{wordCount} words</span>
          <span>~{readTimeMinutes} min read</span>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex space-x-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Enter a tag..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <Button onClick={addTag} type="button" disabled={!tagInput.trim()}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag) => (
            <div
              key={tag}
              className="flex items-center px-2 py-1 text-sm bg-gray-100 rounded-full"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Remove tag ${tag}`}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Tags help categorize your blog post and improve discoverability.
        </p>
      </div>

      {/* Keywords */}
      <div className="space-y-2">
        <Label>SEO Keywords</Label>
        <div className="flex space-x-2">
          <Input
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            placeholder="Enter a keyword..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addKeyword();
              }
            }}
          />
          <Button onClick={addKeyword} type="button" disabled={!keywordInput.trim()}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {keywords.map((keyword) => (
            <div
              key={keyword}
              className="flex items-center px-2 py-1 text-sm bg-blue-100 rounded-full"
            >
              {keyword}
              <button
                type="button"
                onClick={() => removeKeyword(keyword)}
                aria-label={`Remove keyword ${keyword}`}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Keywords help with SEO and search engine optimization.
        </p>
      </div>

      {/* SEO Fields */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">SEO Settings</h3>
        
        {/* Meta Title */}
        <div className="space-y-2">
          <Label htmlFor="metaTitle">Meta Title (Optional)</Label>
          <Input
            id="metaTitle"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            placeholder="Custom SEO title (leave empty to use post title)"
          />
          <p className="text-xs text-muted-foreground">
            Custom title for search engines. If left empty, the post title will be used.
          </p>
        </div>

        {/* Meta Description */}
        <div className="space-y-2">
          <Label htmlFor="metaDescription">Meta Description (Optional)</Label>
          <Input
            id="metaDescription"
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            placeholder="Custom SEO description (leave empty to use post description)"
          />
          <p className="text-xs text-muted-foreground">
            Custom description for search engines. If left empty, the post description will be used.
          </p>
        </div>
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

      {/* Submit Buttons */}
      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          variant="outline"
        >
          {isSubmitting ? "Saving..." : mode === "create" ? "Save as Draft" : "Update Draft"}
        </Button>
        <Button
          type="button"
          disabled={isSubmitting}
          onClick={(e) => handleSubmit(e, "PUBLISHED")}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isSubmitting ? "Publishing..." : mode === "create" ? "Publish Now" : "Update & Publish"}
        </Button>
      </div>
    </form>
  );
} 