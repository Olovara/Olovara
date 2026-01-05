"use client";

import { CopyButton } from "./CopyButton";

// Client Component for displaying copyable URLs
// This needs to be a Client Component because it has an onClick handler
export function CopyableUrl({ url, label }: { url: string; label: string }) {
  return (
    <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
      <input
        type="text"
        value={url}
        readOnly
        className="flex-1 text-xs bg-transparent border-none outline-none text-muted-foreground"
        onClick={(e) => (e.target as HTMLInputElement).select()}
      />
      <CopyButton url={url} />
    </div>
  );
}

