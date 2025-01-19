"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import "react-quill/dist/quill.snow.css"; // Import Quill's default styling

// Dynamically import ReactQuill with SSR disabled
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

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