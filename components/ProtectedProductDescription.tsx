"use client";

import { useState } from "react";
import ProductDescription from "./ProductDescription";

interface ProtectedProductDescriptionProps {
  content: any | null; // Can be string, object, or null
  NSFW: boolean;
}

export default function ProtectedProductDescription({
  content,
  NSFW,
}: ProtectedProductDescriptionProps) {
  const [revealed, setRevealed] = useState(!NSFW); // Start revealed if not NSFW

  if (!content) {
    return <div className="text-muted-foreground">No description available.</div>;
  }

  return (
    <div className="relative">
      {!revealed && NSFW && (
        <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <button
            className="bg-white text-black px-4 py-2 rounded shadow"
            onClick={() => setRevealed(true)}
          >
            This product contains sensitive content. Click to view.
          </button>
        </div>
      )}

      <div
        className={revealed ? "" : "blur-sm pointer-events-none"}
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <ProductDescription content={content} />
      </div>
    </div>
  );
}
