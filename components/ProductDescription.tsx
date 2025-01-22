'use client' // Ensure the component only runs on the client side

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Quill from "quill";

interface ProductDescriptionProps {
  content: Record<string, any>; // Quill's Delta JSON format
}

// Dynamically import the ProductDescription component with SSR disabled
const ProductDescription = dynamic(() => import('@/components/ProductDescription'), {
  ssr: false, // Disable SSR for this component
});

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
