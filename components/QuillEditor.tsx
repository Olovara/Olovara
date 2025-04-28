"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import "react-quill/dist/quill.snow.css"; // Import Quill's default styling

// Dynamically import ReactQuill with SSR disabled and proper fallback
const ReactQuill = dynamic(() => import("react-quill").then(mod => mod.default), {
  ssr: false,
  loading: () => (
    <div className="h-[200px] flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading editor...</div>
    </div>
  ),
});

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function QuillEditor({ value, onChange, placeholder }: QuillEditorProps) {
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image"],
        ["clean"],
      ],
    }),
    []
  );

  return (
    <div className="quill-editor">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
        className="min-h-[200px]"
      />
    </div>
  );
}
