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

        // Handle different content formats
        let htmlContent = "";
        
        if (typeof content === 'string') {
          try {
            // Try to parse as JSON first
            const parsed = JSON.parse(content);
            htmlContent = parsed.html || "";
          } catch {
            // If not JSON, assume it's HTML
            htmlContent = content;
          }
        } else if (typeof content === 'object' && content !== null) {
          // If it's an object, try to get html property
          htmlContent = content.html || "";
        }

        // Initialize Quill in read-only mode
        const quill = new Quill(editorRef.current, {
          theme: "bubble", // Minimalist theme for read-only
          readOnly: true,
        });

        // Set content to the editor
        quill.clipboard.dangerouslyPasteHTML(htmlContent);
      } catch (error) {
        console.error("Error parsing description content:", error);
      }
    }
  }, [content]);

  // Override Quill bubble CSS so description uses site font (Jost). Quill sets
  // .ql-container to Helvetica/Arial — we force both container and editor to font-jost.
  return (
    <div className="space-y-4">
      <div
        className={
          "prose prose-sm sm:prose-base text-gray-800 " +
          "[&_.ql-container]:font-jost [&_.ql-container]:text-base [&_.ql-editor]:font-jost [&_.ql-editor]:text-gray-800"
        }
      >
        <div ref={editorRef} />
      </div>
    </div>
  );
}

export default ProductDescriptionComponent;
