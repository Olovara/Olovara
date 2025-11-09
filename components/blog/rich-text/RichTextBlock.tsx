"use client";

import "react-quill/dist/quill.snow.css";
import dynamic from "next/dynamic";
import { RichTextBlock as RichTextBlockType } from "../types/BlockTypes";

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

interface RichTextBlockProps {
  block: RichTextBlockType;
  className?: string;
}

export function RichTextBlock({ block, className }: RichTextBlockProps) {
  // Safety check: if content is empty or null, don't render anything
  if (!block.content || block.content.trim() === "") {
    return null;
  }

  return (
    <div className={className}>
      <div
        className="ql-editor max-w-none [&>h1]:text-3xl [&>h1]:mb-4 [&>h1]:mt-6 [&>h2]:text-2xl [&>h2]:mb-3 [&>h2]:mt-5 [&>h3]:text-xl [&>h3]:mb-2 [&>h3]:mt-4 [&>p]:mb-3 [&>ul]:mb-3 [&>ol]:mb-3 [&>li]:mb-1"
        dangerouslySetInnerHTML={{ __html: block.content }}
      />
    </div>
  );
}
