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
  value: any; // Can be string or object
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
      
      // If value is already an object with html property
      if (typeof value === 'object' && value.html) {
        return value.html;
      }
      
      // If value is a string, try to parse it as JSON
      if (typeof value === 'string') {
        const parsed = JSON.parse(value);
        return parsed.html || "";
      }
      
      return "";
    } catch (error) {
      console.error("Error parsing value:", error);
      return "";
    }
  }, [value]);

  // Convert HTML to JSON when content changes
  const handleChange = (html: string) => {
    const json = {
      html,
      text: html.replace(/<[^>]*>?/gm, ""), // Strip HTML tags for plain text
    };
    onChange(JSON.stringify(json));
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
