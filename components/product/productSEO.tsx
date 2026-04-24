"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X, ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { HelpPrompt } from "@/components/shared/HelpPrompt";


interface ProductSEOSectionProps {
  metaTitle: string;
  setMetaTitle: (value: string) => void;
  metaDescription: string;
  setMetaDescription: (value: string) => void;
  keywords: string[];
  setKeywords: (value: string[]) => void;
  ogTitle?: string;
  setOgTitle?: (value: string) => void;
  ogDescription?: string;
  setOgDescription?: (value: string) => void;
  ogImage?: string;
  setOgImage?: (value: string) => void;
}

export const ProductSEOSection = ({
  metaTitle,
  setMetaTitle,
  metaDescription,
  setMetaDescription,
  keywords,
  setKeywords,
  ogTitle,
  setOgTitle,
  ogDescription,
  setOgDescription,
  ogImage,
  setOgImage,
}: ProductSEOSectionProps) => {
  const [keywordInput, setKeywordInput] = useState("");
  const form = useFormContext();

  // Add keyword
  const addKeyword = () => {
    if (keywordInput.trim() !== "" && !keywords.includes(keywordInput.trim())) {
      const updatedKeywords = [...keywords, keywordInput.trim()];
      setKeywords(updatedKeywords);
      form.setValue("keywords", updatedKeywords);
      setKeywordInput("");
    }
  };

  // Remove keyword
  const removeKeyword = (keywordToRemove: string) => {
    const updatedKeywords = keywords.filter((keyword) => keyword !== keywordToRemove);
    setKeywords(updatedKeywords);
    form.setValue("keywords", updatedKeywords);
  };

  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="space-y-4">
        <CollapsibleContent className="overflow-hidden">
          <div className="space-y-8">
            {/* Search Engine Optimization */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Search Engine Optimization</h3>
                <p className="text-sm text-gray-600">Optimize your product for search engines and improve discoverability.</p>
              </div>

        {/* Meta Title */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="metaTitle" className="text-sm font-medium">
              Meta Title
            </Label>
            <HelpPrompt
              ariaLabel="Meta title help"
              content={
                <div className="space-y-2 text-sm">
                  <p>
                    <strong className="text-brand-primary-700">Meta title:</strong> is
                    the title search engines show for your product (and it often
                    becomes the browser tab title too).
                  </p>
                  <p>
                    It&apos;s useful because a clear title can improve
                    visibility and clicks from Google.
                  </p>
                  <p>
                  <strong className="text-brand-primary-700">Structure:</strong> Primary Keyword(s) - Secondary Keyword(s) | Key Detail
                  </p>
                  <p className="text-muted-foreground">
                    Tip: keep it around <strong>50-60 characters</strong> and
                    include what it is + a key detail (material, style, size,
                    etc.).
                  </p>
                </div>
              }
            />
          </div>
          <Input
            id="metaTitle"
            value={metaTitle}
            onChange={(e) => {
              setMetaTitle(e.target.value);
              form.setValue("metaTitle", e.target.value);
            }}
            placeholder="Enter a compelling title for your product (50-60 characters recommended)"
            maxLength={60}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>This appears in search engine results</span>
            <span>{metaTitle.length}/60</span>
          </div>
        </div>

        {/* Meta Description */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="metaDescription" className="text-sm font-medium">
              Meta Description
            </Label>
            <HelpPrompt
              ariaLabel="Meta description help"
              content={
                <div className="space-y-2 text-sm">
                  <p>
                    <strong className="text-brand-primary-700">
                      Meta description:
                    </strong>{" "}
                    is the short preview text that can show under your title in
                    Google search results.
                  </p>
                  <p>
                    It helps buyers understand what your product is quickly and
                    can increase clicks.
                  </p>
                  <p className="text-muted-foreground">
                    Tip: aim for <strong>150-160 characters</strong>. Lead with
                    what it is, then the main benefit + a key detail.
                  </p>
                </div>
              }
            />
          </div>
          <Textarea
            id="metaDescription"
            value={metaDescription}
            onChange={(e) => {
              setMetaDescription(e.target.value);
              form.setValue("metaDescription", e.target.value);
            }}
            placeholder="Write a brief description of your product (150-160 characters recommended)"
            maxLength={160}
            rows={3}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>This appears in search engine results</span>
            <span>{metaDescription.length}/160</span>
          </div>
        </div>

        {/* Keywords */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Keywords</Label>
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
              className="flex-1"
            />
            <Button onClick={addKeyword} type="button" disabled={!keywordInput.trim()} className="px-4">
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {keywords.map((keyword) => (
              <div
                key={keyword}
                className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full border border-blue-200"
              >
                {keyword}
                <button
                  type="button"
                  onClick={() => removeKeyword(keyword)}
                  aria-label={`Remove keyword ${keyword}`}
                  className="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Keywords help search engines understand what your product is about.
          </p>
        </div>
      </div>

      {/* Social Media Sharing */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Social Media Sharing</h3>
          <p className="text-sm text-gray-600">Customize how your product appears when shared on social media platforms.</p>
        </div>

        {/* Open Graph Title */}
        <div className="space-y-2">
          <Label htmlFor="ogTitle" className="text-sm font-medium">Social Media Title</Label>
          <Input
            id="ogTitle"
            value={ogTitle || ""}
            onChange={(e) => {
              setOgTitle?.(e.target.value);
              form.setValue("ogTitle", e.target.value);
            }}
            placeholder="Custom title for social media sharing (optional)"
            maxLength={60}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Leave empty to use the meta title</span>
            <span>{(ogTitle || "").length}/60</span>
          </div>
        </div>

        {/* Open Graph Description */}
        <div className="space-y-2">
          <Label htmlFor="ogDescription" className="text-sm font-medium">Social Media Description</Label>
          <Textarea
            id="ogDescription"
            value={ogDescription || ""}
            onChange={(e) => {
              setOgDescription?.(e.target.value);
              form.setValue("ogDescription", e.target.value);
            }}
            placeholder="Custom description for social media sharing (optional)"
            maxLength={160}
            rows={3}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Leave empty to use the meta description</span>
            <span>{(ogDescription || "").length}/160</span>
          </div>
        </div>

        {/* Open Graph Image */}
        <div className="space-y-2">
          <Label htmlFor="ogImage" className="text-sm font-medium">Social Media Image URL</Label>
          <Input
            id="ogImage"
            value={ogImage || ""}
            onChange={(e) => {
              setOgImage?.(e.target.value);
              form.setValue("ogImage", e.target.value);
            }}
            placeholder="https://example.com/image.jpg (optional)"
            type="url"
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Leave empty to use the default product image. Recommended size: 1200x630 pixels.
          </p>
        </div>
      </div>
    </div>
        </CollapsibleContent>

        <CollapsibleTrigger className="w-full flex items-center justify-center py-2 hover:bg-gray-50 rounded-md transition-colors group">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 group-hover:text-gray-900">
              {isOpen ? "Hide" : "Show"} SEO & Marketing
            </span>
            <ChevronDown
              className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </CollapsibleTrigger>
      </div>
    </Collapsible>
  );
}; 