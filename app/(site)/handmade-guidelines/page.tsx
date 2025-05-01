"use client";

import { useState, useEffect, useCallback } from "react";
import "react-quill/dist/quill.snow.css";
import dynamic from "next/dynamic";

// Dynamically import QuillEditor with SSR disabled
const QuillEditor = dynamic(
  () => import("@/components/QuillEditor").then((mod) => mod.QuillEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-[200px] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading editor...</div>
      </div>
    ),
  }
);

export default function HandmadeGuidelines() {
  const [content, setContent] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      // Fetch guidelines
      const res = await fetch("/api/handmade-guidelines");
      const data = await res.json();
      setContent(data.content?.ops?.map((op: any) => op.insert).join('') || '');

      // Try to fetch user role from API (optional)
      try {
        const roleRes = await fetch("/api/auth/get-role");
        if (roleRes.ok) {
          const roleData = await roleRes.json();
          setIsAdmin(roleData.role === "ADMIN");
        }
      } catch (error) {
        // Ignore role fetch errors for non-logged-in users
        console.log("User not logged in or role fetch failed");
      }
    } catch (error) {
      console.error("Error fetching guidelines:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = useCallback(async () => {
    try {
      await fetch("/api/handmade-guidelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: { ops: [{ insert: content }] } }),
      });
      alert("Guidelines updated!");
    } catch (error) {
      console.error("Error saving guidelines:", error);
      alert("Failed to update guidelines");
    }
  }, [content]);

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Handmade Guidelines</h1>

      {/* Always display content */}
      <div className="ql-editor" dangerouslySetInnerHTML={{ __html: content }} />

      {/* Show editor and save button only for admin */}
      {isAdmin && (
        <>
          <QuillEditor 
            value={content}
            onChange={setContent}
          />
          <button
            className="mt-4 p-2 bg-purple-600 text-white rounded"
            onClick={handleSave}
          >
            Save Changes
          </button>
        </>
      )}
    </div>
  );
}
