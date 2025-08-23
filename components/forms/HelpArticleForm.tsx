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

interface HelpCategory {
  id: string;
  slug: string;
  title: string;
}

interface HelpArticle {
  id?: string;
  title: string;
  description: string;
  content: string;
  contentBlocks?: ContentBlock[];
  catSlug: string;
  status: "DRAFT" | "PUBLISHED";
  isPrivate: boolean;
  tags: string[];
  keywords: string[];
  readTime: number | null;
  img?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  order?: number;
  targetAudience?: "BUYERS" | "SELLERS" | "BOTH";
}

interface HelpArticleFormProps {
  initialData?: HelpArticle | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function HelpArticleForm({
  initialData,
  onSubmit,
  onCancel,
}: HelpArticleFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [content, setContent] = useState(initialData?.content || "");
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>(
    initialData?.contentBlocks || []
  );
  const [category, setCategory] = useState(initialData?.catSlug || "");
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [isPrivate, setIsPrivate] = useState(initialData?.isPrivate || false);
  const [targetAudience, setTargetAudience] = useState<"BUYERS" | "SELLERS" | "BOTH">(
    initialData?.targetAudience || "BOTH"
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tags and keywords state
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [keywords, setKeywords] = useState<string[]>(
    initialData?.keywords || []
  );
  const [tagInput, setTagInput] = useState("");
  const [keywordInput, setKeywordInput] = useState("");

  // SEO fields
  const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(
    initialData?.metaDescription || ""
  );

  // Image URL
  const [img, setImg] = useState(initialData?.img || "");

  // Preview state
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

  // Fetch help categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/help/categories");
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error("Error fetching help categories:", error);
        toast.error("Failed to load help categories");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Content block management
  const addContentBlock = (type: string) => {
    const config = BLOCK_CONFIGS.find((c) => c.type === type);
    if (!config) return;

    const newBlock: ContentBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      order: contentBlocks.length,
      ...config.defaultData,
    } as ContentBlock;

    setContentBlocks([...contentBlocks, newBlock]);
  };

  const removeContentBlock = (index: number) => {
    setContentBlocks(contentBlocks.filter((_, i) => i !== index));
  };

  const updateContentBlock = (index: number, updatedBlock: ContentBlock) => {
    const newBlocks = [...contentBlocks];
    newBlocks[index] = updatedBlock;
    setContentBlocks(newBlocks);
  };

  const moveContentBlock = (fromIndex: number, toIndex: number) => {
    const newBlocks = [...contentBlocks];
    const [movedBlock] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, movedBlock);
    setContentBlocks(newBlocks);
  };

  // Tag management
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput("");
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    setKeywords(keywords.filter((keyword) => keyword !== keywordToRemove));
  };

  // Calculate word count and read time from content blocks
  const calculateWordCount = () => {
    let totalWords = 0;
    contentBlocks.forEach((block) => {
      if (block.type === "rich-text" && block.content) {
        // Strip HTML tags and count words
        const textContent = block.content.replace(/<[^>]*>/g, " ");
        const words = textContent.trim().split(/\s+/).filter(Boolean);
        totalWords += words.length;
      }
    });
    return totalWords;
  };

  const calculateReadTime = () => {
    const wordCount = calculateWordCount();
    return Math.ceil(wordCount / 200); // Average reading speed: 200 words per minute
  };

  // Form submission
  const handleSubmit = async (status: "DRAFT" | "PUBLISHED") => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }

    if (contentBlocks.length === 0) {
      toast.error("At least one content block is required");
      return;
    }

    if (!category) {
      toast.error("Category is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const articleData = {
        title: title.trim(),
        description: description.trim(),
        content: content,
        contentBlocks,
        catSlug: category,
        status,
        isPrivate,
        targetAudience,
        tags,
        keywords,
        readTime: calculateReadTime(),
        img: img || null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        order: initialData?.order || 0,
      };

      await onSubmit(articleData);
    } catch (error) {
      console.error("Error submitting article:", error);
      toast.error("Failed to save article");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter article title..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter article description..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.slug} value={cat.slug}>
                    {cat.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="img">Featured Image URL</Label>
            <Input
              id="img"
              value={img}
              onChange={(e) => setImg(e.target.value)}
              placeholder="Enter image URL..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Content Blocks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Content</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showPreview ? "Hide Preview" : "Show Preview"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showPreview ? (
            <BlogPostPreview
              title={title}
              description={description}
              content=""
              contentBlocks={contentBlocks}
              readTime={calculateReadTime()}
            />
          ) : (
            <div className="space-y-4">
              {/* Add Content Block */}
              <div className="flex flex-wrap gap-2">
                {BLOCK_CONFIGS.map((config) => (
                  <Button
                    key={config.type}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addContentBlock(config.type)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {config.label}
                  </Button>
                ))}
              </div>

              {/* Content Blocks */}
              {contentBlocks.map((block, index) => (
                <div key={block.id}>
                  {/* Drop Zone Indicator */}
                  {dropZoneIndex === index && draggedIndex !== null && draggedIndex !== index && (
                    <div className="h-2 bg-purple-500 rounded-full mb-2 animate-pulse" />
                  )}

                  <Card
                    className={`relative transition-all duration-300 ease-in-out ${
                      draggedIndex === index
                        ? 'opacity-50 scale-95 rotate-2 shadow-lg'
                        : draggedIndex !== null && draggedIndex !== index
                        ? 'transform translate-y-0'
                        : ''
                    }`}
                    style={{
                      transform: draggedIndex !== null && draggedIndex !== index && dropZoneIndex === index
                        ? 'translateY(8px)'
                        : draggedIndex !== null && draggedIndex !== index && dropZoneIndex !== null && dropZoneIndex < index
                        ? 'translateY(-8px)'
                        : 'translateY(0)'
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
                            <GripVertical
                              className="w-4 h-4 text-muted-foreground"
                            />
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
                        onChange={(updatedBlock) => updateContentBlock(index, updatedBlock)}
                      />
                    </CardContent>
                  </Card>
                </div>
              ))}

              {contentBlocks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No content blocks yet. Add one to get started!</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEO Settings */}
      <Card>
        <CardHeader>
          <CardTitle>SEO Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="metaTitle">Meta Title</Label>
            <Input
              id="metaTitle"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="Custom SEO title (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="metaDescription">Meta Description</Label>
            <Input
              id="metaDescription"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Custom meta description (optional)"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Add a tag..."
              />
              <Button type="button" onClick={addTag} size="sm">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md text-sm"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <Label>Keywords</Label>
            <div className="flex gap-2">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                placeholder="Add a keyword..."
              />
              <Button type="button" onClick={addKeyword} size="sm">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {keywords.map((keyword) => (
                <div
                  key={keyword}
                  className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md text-sm"
                >
                  <span>{keyword}</span>
                  <button
                    type="button"
                    onClick={() => removeKeyword(keyword)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targetAudience">Target Audience</Label>
            <Select value={targetAudience} onValueChange={(value: "BUYERS" | "SELLERS" | "BOTH") => setTargetAudience(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select target audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BUYERS">Buyers Only</SelectItem>
                <SelectItem value="SELLERS">Sellers Only</SelectItem>
                <SelectItem value="BOTH">Both Buyers & Sellers</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Choose who this help article is intended for
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Private Article</Label>
              <p className="text-sm text-muted-foreground">
                Only visible to you and admins
              </p>
            </div>
            <Switch
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Buttons */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSubmit("DRAFT")}
          disabled={isSubmitting}
        >
          Save as Draft
        </Button>
        <Button
          type="button"
          onClick={() => handleSubmit("PUBLISHED")}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Publishing..." : "Publish Article"}
        </Button>
      </div>
    </div>
  );
}
