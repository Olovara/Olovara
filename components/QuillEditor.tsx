"use client";

import dynamic from "next/dynamic";
import { useMemo, useEffect } from "react";
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
  value: string; // Changed to string type since we only handle HTML
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
      clipboard: {
        matchVisual: false,
      },
    }),
    []
  );

  // Clean up Quill instance on unmount
  useEffect(() => {
    return () => {
      // Remove Quill stylesheet when component unmounts
      const quillStylesheet = document.querySelector('link[href*="quill.snow.css"]');
      if (quillStylesheet) {
        quillStylesheet.remove();
      }
    };
  }, []);

  // Convert value to HTML for Quill
  const htmlValue = useMemo(() => {
    try {
      if (!value) return "";
      
      // If value is a string, it should be the HTML content
      if (typeof value === 'string') {
        return value;
      }
      
      return "";
    } catch (error) {
      console.error("Error parsing value:", error);
      return "";
    }
  }, [value]);

  // Simply pass the HTML content directly
  const handleChange = (html: string) => {
    onChange(html);
  };

  return (
    <div className="quill-editor">
      <ReactQuill
        theme="snow"
        value={htmlValue}
        onChange={handleChange}
        modules={modules}
        placeholder={placeholder}
        className="min-h-[200px]"
      />
    </div>
  );
}
