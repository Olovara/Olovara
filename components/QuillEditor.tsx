"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import "react-quill/dist/quill.snow.css"; // Import Quill's default styling

// Dynamically import ReactQuill with SSR disabled and fallback handling
const ReactQuill = dynamic(
  () => import("react-quill").catch(() => null), // Fallback to null if import fails
  {
    ssr: false,
    loading: () => <div>Loading editor...</div>, // Show loading fallback while ReactQuill is loading
  }
);

// Define the Quill toolbar options
const toolbarOptions = [
  [{ header: [1, 2, 3, false] }],
  ["bold", "italic", "underline", "strike"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["blockquote", "code-block"],
  [{ align: [] }],
  ["link"],
  ["clean"],
];

export function QuillEditor({
  setJson,
  json,
}: {
  setJson: (value: any) => void;
  json: any;
}) {
  const [editorContent, setEditorContent] = useState(json || { ops: [] });

  useEffect(() => {
    setJson(editorContent);
  }, [editorContent, setJson]);

  // Render a fallback UI if ReactQuill fails to load
  if (!ReactQuill) {
    return <div>Failed to load editor. Please refresh the page.</div>;
  }

  return (
    <div className="mt-2">
      <ReactQuill
        value={editorContent}
        onChange={(content, delta, source, editor) => {
          setEditorContent(editor.getContents()); // Get content in Delta format
        }}
        modules={{
          toolbar: toolbarOptions,
        }}
        theme="snow"
        className="rounded-lg border p-2 min-h-[150px]"
      />
    </div>
  );
}
