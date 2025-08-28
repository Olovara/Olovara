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
  // Clean up old content block structures
  const cleanupContentBlocks = (blocks: ContentBlock[]): ContentBlock[] => {
    return blocks.map(block => {
      if (block.type === "requirements") {
        // Fix old requirements structure
        const requirements = (block as any).requirements?.map((req: any) => {
          if (req.icon && !req.isRequired) {
            return {
              title: req.title,
              description: req.description,
              isRequired: true,
              category: "Technical",
            };
          }
          return req;
        }) || [];
        
        // Fix old variant
        const variant = (block as any).variant === "cards" ? "simple" : (block as any).variant || "simple";
        
        return {
          ...block,
          requirements,
          variant,
        };
      }
      return block;
    });
  };

  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [content, setContent] = useState(initialData?.content || "");
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>(
    cleanupContentBlocks(initialData?.contentBlocks || [])
  );
  const [category, setCategory] = useState(initialData?.catSlug || "");
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [isPrivate, setIsPrivate] = useState(initialData?.isPrivate || false);
  const [targetAudience, setTargetAudience] = useState<
    "BUYERS" | "SELLERS" | "BOTH"
  >(initialData?.targetAudience || "BOTH");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tags and keywords state
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [keywords, setKeywords] = useState<string[]>(initialData?.keywords || []);
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
    newBlocks[index] = cleanupContentBlocks([updatedBlock])[0];
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
    if (tagInput.trim() !== "" && !tags.includes(tagInput.trim())) {
      const updatedTags = [...tags, tagInput.trim()];
      setTags(updatedTags);
      setTagInput("");
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    const updatedTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(updatedTags);
  };

  // Add keyword
  const addKeyword = () => {
    if (keywordInput.trim() !== "" && !keywords.includes(keywordInput.trim())) {
      const updatedKeywords = [...keywords, keywordInput.trim()];
      setKeywords(updatedKeywords);
      setKeywordInput("");
    }
  };

  // Remove keyword
  const removeKeyword = (keywordToRemove: string) => {
    const updatedKeywords = keywords.filter(
      (keyword) => keyword !== keywordToRemove
    );
    setKeywords(updatedKeywords);
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

    // Calculate read time (250 words per minute) - minimum 1 minute
    const readTimeMinutes = Math.max(1, Math.ceil(totalWordCount / 250));

    return { wordCount: totalWordCount, readTimeMinutes };
  };

  const { wordCount, readTimeMinutes } = calculateReadTime();

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
        contentBlocks,
        catSlug: category,
        status,
        isPrivate,
        targetAudience,
        tags,
        keywords,
        readTime: readTimeMinutes,
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
    <div
      className={`${showPreview ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : ""}`}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit("DRAFT");
        }}
        className="space-y-6"
      >
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter article title"
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
            placeholder="Enter article description"
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

        {/* Target Audience */}
        <div className="space-y-2">
          <Label htmlFor="targetAudience">Target Audience</Label>
          <Select
            value={targetAudience}
            onValueChange={(value: "BUYERS" | "SELLERS" | "BOTH") =>
              setTargetAudience(value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select target audience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BUYERS">Buyers Only</SelectItem>
              <SelectItem value="SELLERS">Sellers Only</SelectItem>
              <SelectItem value="BOTH">Both Buyers & Sellers</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Choose who this help article is intended for
          </p>
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
            Add content blocks to create your help article. Start with a
            &quot;Rich Text&quot; block for your main content.
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
            Tags help categorize your help article and improve discoverability.
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
              placeholder="Custom SEO title (leave empty to use article title)"
            />
            <p className="text-xs text-muted-foreground">
              Custom title for search engines. If left empty, the article title
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
              placeholder="Custom SEO description (leave empty to use article description)"
            />
            <p className="text-xs text-muted-foreground">
              Custom description for search engines. If left empty, the article
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
          <Label htmlFor="private">Make this article private</Label>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting} variant="outline">
            {isSubmitting ? "Saving..." : "Save as Draft"}
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit("PUBLISHED")}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? "Publishing..." : "Publish Article"}
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
                See how your help article will look when published
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
