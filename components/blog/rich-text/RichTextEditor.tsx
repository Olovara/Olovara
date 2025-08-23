"use client";

import "react-quill/dist/quill.snow.css";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface RichTextEditorProps {
  block: RichTextBlockType;
  onChange: (block: RichTextBlockType) => void;
}

export function RichTextEditor({ block, onChange }: RichTextEditorProps) {
  const [title, setTitle] = useState(block.title || "");
  const [content, setContent] = useState(block.content || "");

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    onChange({
      ...block,
      title: newTitle,
    });
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    onChange({
      ...block,
      content: newContent,
    });
  };

  return (
    <div className="space-y-2">
      <Label>Content</Label>
      <QuillEditor
        value={content}
        onChange={handleContentChange}
        placeholder="Write your content here..."
      />
    </div>
  );
}
