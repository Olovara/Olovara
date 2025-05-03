'use client' // Ensure the component only runs on the client side

import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.bubble.css"; // Import bubble theme CSS

interface ProductDescriptionProps {
  content: any | null; // Can be string, object, or null
}

export function ProductDescriptionComponent({ content }: ProductDescriptionProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current) {
      try {
        if (!content) {
          // Initialize empty Quill editor if no content
          const quill = new Quill(editorRef.current, {
            theme: "bubble",
            readOnly: true,
          });
          return;
        }

        // Parse the content if it's a string, otherwise use it directly
        const json = typeof content === 'string' ? JSON.parse(content) : content;
        const html = json.html || "";

        // Initialize Quill in read-only mode
        const quill = new Quill(editorRef.current, {
          theme: "bubble", // Minimalist theme for read-only
          readOnly: true,
        });

        // Set content to the editor
        quill.clipboard.dangerouslyPasteHTML(html);
      } catch (error) {
        console.error("Error parsing description content:", error);
      }
    }
  }, [content]);

  return <div ref={editorRef} className="prose prose-sm sm:prose-base" />;
}

export default ProductDescriptionComponent;
