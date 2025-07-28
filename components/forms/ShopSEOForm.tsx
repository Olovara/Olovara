"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { updateShopSEO } from "@/actions/updateShopSEO";

// Schema for shop SEO form
const ShopSEOSchema = z.object({
  metaTitle: z.string().max(60, "Meta title must be 60 characters or less").optional(),
  metaDescription: z.string().max(160, "Meta description must be 160 characters or less").optional(),
  keywords: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  ogTitle: z.string().max(60, "Social media title must be 60 characters or less").optional(),
  ogDescription: z.string().max(160, "Social media description must be 160 characters or less").optional(),
  ogImage: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

type ShopSEOFormData = z.infer<typeof ShopSEOSchema>;

interface ShopSEOFormProps {
  initialData?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    tags?: string[];
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  };
  onSubmit: (data: ShopSEOFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export default function ShopSEOForm({ initialData, onSubmit, isSubmitting = false }: ShopSEOFormProps) {
  const [keywordInput, setKeywordInput] = useState("");
  const [tagInput, setTagInput] = useState("");

  const form = useForm<ShopSEOFormData>({
    resolver: zodResolver(ShopSEOSchema),
    defaultValues: {
      metaTitle: initialData?.metaTitle || "",
      metaDescription: initialData?.metaDescription || "",
      keywords: initialData?.keywords || [],
      tags: initialData?.tags || [],
      ogTitle: initialData?.ogTitle || "",
      ogDescription: initialData?.ogDescription || "",
      ogImage: initialData?.ogImage || "",
    },
  });

  const { watch, setValue, handleSubmit } = form;
  const keywords = watch("keywords");
  const tags = watch("tags");
  const metaTitle = watch("metaTitle");
  const metaDescription = watch("metaDescription");
  const ogTitle = watch("ogTitle");
  const ogDescription = watch("ogDescription");

  // Add keyword
  const addKeyword = () => {
    if (keywordInput.trim() !== "" && !keywords.includes(keywordInput.trim())) {
      const updatedKeywords = [...keywords, keywordInput.trim()];
      setValue("keywords", updatedKeywords);
      setKeywordInput("");
    }
  };

  // Remove keyword
  const removeKeyword = (keywordToRemove: string) => {
    const updatedKeywords = keywords.filter((keyword) => keyword !== keywordToRemove);
    setValue("keywords", updatedKeywords);
  };

  // Add tag
  const addTag = () => {
    if (tagInput.trim() !== "" && !tags.includes(tagInput.trim())) {
      const updatedTags = [...tags, tagInput.trim()];
      setValue("tags", updatedTags);
      setTagInput("");
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    const updatedTags = tags.filter((tag) => tag !== tagToRemove);
    setValue("tags", updatedTags);
  };

  const handleFormSubmit = async (data: ShopSEOFormData) => {
    try {
      const result = await updateShopSEO(data);
      
      if (!result.success) {
        throw new Error(result.error || "Failed to update SEO settings");
      }

      await onSubmit(data);
      toast.success("SEO settings updated successfully");
    } catch (error) {
      console.error("Error updating SEO settings:", error);
      toast.error("Failed to update SEO settings");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>SEO Settings</CardTitle>
            <p className="text-sm text-muted-foreground">
              Optimize your shop for search engines and social media sharing.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Meta Title */}
            <FormField
              control={form.control}
              name="metaTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter a compelling title for your shop (50-60 characters recommended)"
                      maxLength={60}
                    />
                  </FormControl>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>This appears in search engine results</span>
                    <span>{metaTitle?.length || 0}/60</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Meta Description */}
            <FormField
              control={form.control}
              name="metaDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Write a brief description of your shop (150-160 characters recommended)"
                      maxLength={160}
                      rows={3}
                    />
                  </FormControl>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>This appears in search engine results</span>
                    <span>{metaDescription?.length || 0}/160</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Keywords */}
            <div className="space-y-2">
              <FormLabel>Keywords</FormLabel>
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
                    className="flex items-center px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeKeyword(keyword)}
                      aria-label={`Remove keyword ${keyword}`}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Keywords help search engines understand what your shop is about.
              </p>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <FormLabel>Tags</FormLabel>
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
                Tags help categorize your shop and improve discoverability.
              </p>
            </div>

            {/* Open Graph Settings */}
            <Separator />
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium">Social Media Sharing</h4>
                <p className="text-xs text-muted-foreground">
                  Customize how your shop appears when shared on social media.
                </p>
              </div>

              {/* Open Graph Title */}
              <FormField
                control={form.control}
                name="ogTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Social Media Title</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Custom title for social media sharing (optional)"
                        maxLength={60}
                      />
                    </FormControl>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Leave empty to use the meta title</span>
                      <span>{(ogTitle || "").length}/60</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Open Graph Description */}
              <FormField
                control={form.control}
                name="ogDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Social Media Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Custom description for social media sharing (optional)"
                        maxLength={160}
                        rows={3}
                      />
                    </FormControl>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Leave empty to use the meta description</span>
                      <span>{(ogDescription || "").length}/160</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Open Graph Image */}
              <FormField
                control={form.control}
                name="ogImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Social Media Image URL</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="https://example.com/image.jpg (optional)"
                        type="url"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Leave empty to use the default shop image. Recommended size: 1200x630 pixels.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save SEO Settings"}
        </Button>
      </form>
    </Form>
  );
} 