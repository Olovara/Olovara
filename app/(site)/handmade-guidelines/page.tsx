"use client";

import { useState, useEffect } from "react";
import "react-quill/dist/quill.snow.css";
import { QuillEditor } from "@/components/QuillEditor";

interface QuillContent {
  ops: Array<{
    insert: string;
    attributes?: Record<string, any>;
  }>;
}

export default function HandmadeGuidelines() {
  const [content, setContent] = useState<QuillContent>({ ops: [] });
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch guidelines
        const res = await fetch("/api/handmade-guidelines");
        const data = await res.json();
        setContent(data.content);

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
    };

    fetchData();
  }, []);

  const handleSave = async () => {
    try {
      await fetch("/api/handmade-guidelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      alert("Guidelines updated!");
    } catch (error) {
      console.error("Error saving guidelines:", error);
      alert("Failed to update guidelines");
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Handmade Guidelines</h1>

      {/* Always display content */}
      <div className="ql-editor" dangerouslySetInnerHTML={{ __html: content.ops?.map(op => op.insert).join('') || '' }} />

      {/* Show editor and save button only for admin */}
      {isAdmin && (
        <>
          <QuillEditor setJson={setContent} json={content} />
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
