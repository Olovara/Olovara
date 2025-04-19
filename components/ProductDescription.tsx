'use client' // Ensure the component only runs on the client side

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Quill from "quill";
import type { Delta, Op } from 'quill';

interface ProductDescriptionProps {
  content: Delta;
}

export function ProductDescriptionComponent({ content }: ProductDescriptionProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current) {
      // Initialize Quill in read-only mode
      const quill = new Quill(editorRef.current, {
        theme: "bubble", // Minimalist theme for read-only
        readOnly: true,
      });

      // Set content to the editor
      quill.setContents(content);
    }
  }, [content]);

  return <div ref={editorRef} className="prose prose-sm sm:prose-base" />;
}

export default ProductDescriptionComponent;
