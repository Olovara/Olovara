import React from "react";
import Image from "next/image";
import { ContentBlockRenderer } from "./ContentBlockRenderer";
import { ContentBlock } from "./types/BlockTypes";

interface BlogPostPreviewProps {
  title: string;
  description: string;
  content: string;
  contentBlocks?: ContentBlock[];
  img?: string | null;
  readTime?: number | null;
  publishedAt?: Date | null;
  user?: {
    image?: string | null;
    encryptedFirstName?: string | null;
    firstNameIV?: string | null;
    firstNameSalt?: string | null;
  } | null;
  isDraft?: boolean;
}

export function BlogPostPreview({
  title,
  description,
  content,
  contentBlocks = [],
  img,
  readTime,
  publishedAt,
  user,
  isDraft = true,
}: BlogPostPreviewProps) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Draft indicator */}
      {isDraft && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-sm font-medium text-yellow-800">
              Draft Preview
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="space-y-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 leading-tight">
          {title || "Untitled Post"}
        </h1>

        {description && (
          <p className="text-lg text-gray-600 leading-relaxed">{description}</p>
        )}

        {/* Meta information */}
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          {user && (
            <div className="flex items-center space-x-2">
              {user.image && (
                <Image
                  src={user.image}
                  alt="Author"
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              )}
              <span>By {user.encryptedFirstName || "Author"}</span>
            </div>
          )}

          {publishedAt && (
            <span>
              {new Date(publishedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          )}

          {readTime && <span>{readTime} min read</span>}
        </div>
      </div>

      {/* Featured image */}
      {img && (
        <div className="mb-8">
          <Image
            src={img}
            alt={title}
            width={800}
            height={256}
            className="w-full h-64 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Content blocks */}
      {contentBlocks && contentBlocks.length > 0 && (
        <div className="mb-8">
          <ContentBlockRenderer blocks={contentBlocks} className="space-y-6" />
        </div>
      )}

      {/* Regular content */}
      {content && (
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}

      {/* Empty state */}
      {!content && contentBlocks.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>
            No content added yet. Start by adding some content blocks or writing
            your post.
          </p>
        </div>
      )}
    </div>
  );
}
