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
import { X, Plus, GripVertical, Trash2, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BLOCK_CONFIGS,
  ContentBlock,
  ContentBlockEditor,
  BlogPostPreview,
} from "@/components/blog";

// Dynamically import QuillEditor with SSR disabled
const QuillEditor = dynamic(
  () => import("@/components/QuillEditor").then((mod) => mod.QuillEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-[200px] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          Loading editor...
        </div>
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
  contentBlocks?: ContentBlock[];
  contentType: "BLOG" | "HELP_ARTICLE";
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
  mode,
}: BlogPostFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [content, setContent] = useState(initialData?.content || "");
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>(
    initialData?.contentBlocks || []
  );
  const [contentType, setContentType] = useState<"BLOG" | "HELP_ARTICLE">(
    initialData?.contentType || "BLOG"
  );
  const [category, setCategory] = useState(initialData?.catSlug || "");
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isPrivate, setIsPrivate] = useState(initialData?.isPrivate || false);
  const [isLoading, setIsLoading] = useState(true);

  // Tags and keywords state
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [keywords, setKeywords] = useState<string[]>(
    initialData?.keywords || []
  );
  const [tagInput, setTagInput] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(
    initialData?.metaDescription || ""
  );
  const [showPreview, setShowPreview] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isGripPressed, setIsGripPressed] = useState<number | null>(null);
  const [dropZoneIndex, setDropZoneIndex] = useState<number | null>(null);

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    // Only allow dragging if the grip was pressed
    if (isGripPressed !== index) {
      e.preventDefault();
      return;
    }

    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    // Update drop zone indicator
    if (draggedIndex !== null && draggedIndex !== index) {
      setDropZoneIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      moveContentBlock(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDropZoneIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDropZoneIndex(null);
  };

  // Calculate word count and read time from content blocks
  const calculateReadTime = () => {
    let totalWordCount = 0;

    // Count words from content blocks
    contentBlocks.forEach((block) => {
      if (block.type === "rich-text") {
        const plainText = (block as any).content.replace(/<[^>]*>/g, "");
        const words = plainText
          .trim()
          .split(/\s+/)
          .filter((word: string) => word.length > 0);
        totalWordCount += words.length;
      }
    });

    // Calculate read time (250 words per minute)
    const readTimeMinutes = Math.ceil(totalWordCount / 250);

    return { wordCount: totalWordCount, readTimeMinutes };
  };

  const { wordCount, readTimeMinutes } = calculateReadTime();

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
    const updatedKeywords = keywords.filter(
      (keyword) => keyword !== keywordToRemove
    );
    setKeywords(updatedKeywords);
  };

  // Content Block Management
  const addContentBlock = (blockType: string) => {
    const config = BLOCK_CONFIGS.find((c) => c.type === blockType);
    if (!config) return;

    const newBlock: ContentBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      order: contentBlocks.length,
      ...config.defaultData,
    } as ContentBlock;

    setContentBlocks([...contentBlocks, newBlock]);
  };

  const updateContentBlock = (index: number, updatedBlock: ContentBlock) => {
    const updatedBlocks = [...contentBlocks];
    updatedBlocks[index] = updatedBlock;
    setContentBlocks(updatedBlocks);
  };

  const removeContentBlock = (index: number) => {
    const updatedBlocks = contentBlocks.filter((_, i) => i !== index);
    // Reorder remaining blocks
    const reorderedBlocks = updatedBlocks.map((block, i) => ({
      ...block,
      order: i,
    }));
    setContentBlocks(reorderedBlocks);
  };

  const moveContentBlock = (fromIndex: number, toIndex: number) => {
    const updatedBlocks = [...contentBlocks];
    const [movedBlock] = updatedBlocks.splice(fromIndex, 1);
    updatedBlocks.splice(toIndex, 0, movedBlock);

    // Reorder all blocks
    const reorderedBlocks = updatedBlocks.map((block, i) => ({
      ...block,
      order: i,
    }));
    setContentBlocks(reorderedBlocks);
  };

  const handleSubmit = async (
    e: React.FormEvent,
    status: "DRAFT" | "PUBLISHED" = "DRAFT"
  ) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !category) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (contentBlocks.length === 0) {
      toast.error("Please add at least one content block");
      return;
    }

    const formData: BlogPost = {
      ...initialData,
      title: title.trim(),
      description: description.trim(),
      content: "", // Keep for backward compatibility but not used
      contentBlocks,
      contentType,
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
    <div
      className={`${showPreview ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : ""}`}
    >
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

        {/* Content Type */}
        <div className="space-y-2">
          <Label htmlFor="contentType">Content Type</Label>
          <Select
            value={contentType}
            onValueChange={(value: "BLOG" | "HELP_ARTICLE") =>
              setContentType(value)
            }
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select content type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BLOG">Blog Post</SelectItem>
              <SelectItem value="HELP_ARTICLE">Help Article</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Blog posts appear in your blog, while help articles appear in the
            help center.
          </p>
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

        {/* Content Blocks */}
        <div className="space-y-4">
          <div className="space-y-3">
            <Label>Content Blocks</Label>
            <div className="flex flex-wrap gap-2">
              {BLOCK_CONFIGS.map((config) => (
                <Button
                  key={config.type}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addContentBlock(config.type)}
                  className="text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {config.label}
                </Button>
              ))}
            </div>
          </div>

          {contentBlocks.length > 0 && (
            <div className="space-y-4">
              {contentBlocks.map((block, index) => (
                <div key={block.id}>
                  {/* Drop Zone Indicator */}
                  {dropZoneIndex === index &&
                    draggedIndex !== null &&
                    draggedIndex !== index && (
                      <div className="h-2 bg-purple-500 rounded-full mb-2 animate-pulse" />
                    )}

                  <Card
                    className={`relative transition-all duration-300 ease-in-out ${
                      draggedIndex === index
                        ? "opacity-50 scale-95 rotate-2 shadow-lg"
                        : draggedIndex !== null && draggedIndex !== index
                          ? "transform translate-y-0"
                          : ""
                    }`}
                    style={{
                      transform:
                        draggedIndex !== null &&
                        draggedIndex !== index &&
                        dropZoneIndex === index
                          ? "translateY(8px)"
                          : draggedIndex !== null &&
                              draggedIndex !== index &&
                              dropZoneIndex !== null &&
                              dropZoneIndex < index
                            ? "translateY(-8px)"
                            : "translateY(0)",
                    }}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <div
                            className="cursor-grab active:cursor-grabbing"
                            onMouseDown={() => setIsGripPressed(index)}
                            onMouseUp={() => setIsGripPressed(null)}
                            onMouseLeave={() => setIsGripPressed(null)}
                          >
                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                          </div>
                          {BLOCK_CONFIGS.find((c) => c.type === block.type)
                            ?.label || block.type}
                        </CardTitle>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeContentBlock(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ContentBlockEditor
                        block={block}
                        onChange={(updatedBlock) =>
                          updateContentBlock(index, updatedBlock)
                        }
                      />
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Add content blocks to create your post. Start with a &quot;Rich
            Text&quot; block for your main content.
          </p>
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
                if (e.key === "Enter") {
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
                if (e.key === "Enter") {
                  e.preventDefault();
                  addKeyword();
                }
              }}
            />
            <Button
              onClick={addKeyword}
              type="button"
              disabled={!keywordInput.trim()}
            >
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
              Custom title for search engines. If left empty, the post title
              will be used.
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
              Custom description for search engines. If left empty, the post
              description will be used.
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
          <Button type="submit" disabled={isSubmitting} variant="outline">
            {isSubmitting
              ? "Saving..."
              : mode === "create"
                ? "Save as Draft"
                : "Update Draft"}
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={(e) => handleSubmit(e, "PUBLISHED")}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting
              ? "Publishing..."
              : mode === "create"
                ? "Publish Now"
                : "Update & Publish"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            className="ml-auto"
          >
            {showPreview ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Show Preview
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Preview Panel */}
      {showPreview && (
        <div className="border-l border-gray-200 pl-6">
          <div className="sticky top-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
              <p className="text-sm text-gray-600">
                See how your post will look when published
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <BlogPostPreview
                title={title}
                description={description}
                content=""
                contentBlocks={contentBlocks}
                readTime={readTimeMinutes}
                isDraft={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
