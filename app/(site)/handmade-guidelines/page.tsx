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
    setIsLoading(true);
    try {
      // Fetch guidelines
      const res = await fetch("/api/handmade-guidelines");
      if (!res.ok) {
        throw new Error(`API request failed with status ${res.status}`);
      }
      const data = await res.json();

      // The API now returns clean HTML content
      if (data.content && typeof data.content.html === 'string') {
        setContent(data.content.html);
      } else {
        setContent("");
      }

      // Try to fetch user role
      try {
        const roleRes = await fetch("/api/auth/get-role");
        if (roleRes.ok) {
          const roleData = await roleRes.json();
          setIsAdmin(roleData.role === "ADMIN");
        }
      } catch (error) {
        console.log("User not logged in or role fetch failed");
      }
    } catch (error) {
      console.error("Error fetching guidelines:", error);
      setContent("");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = useCallback(async () => {
    try {
      // Ensure content is defined, default to empty string if not
      const htmlToSave = content || '';
      // Generate plain text by stripping HTML tags
      const textToSave = htmlToSave.replace(/<[^>]*>?/gm, '');

      await fetch("/api/handmade-guidelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: {
            html: htmlToSave,
            text: textToSave
          }
        }),
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
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Handmade Guidelines</h1>

      {/* Display content with proper Quill styling */}
      <div className="prose max-w-none ql-snow">
        <div
          className="ql-editor"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>

      {/* Show editor and save button only for admin */}
      {isAdmin && (
        <div className="mt-8 border-t pt-8">
          <h2 className="text-xl font-semibold mb-4">Edit Guidelines</h2>
          <QuillEditor
            value={content}
            onChange={setContent}
          />
          <button
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
            onClick={handleSave}
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}
