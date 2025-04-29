"use client";

import { useState, useEffect } from "react";
import "react-quill/dist/quill.snow.css";
import { QuillEditor } from "@/components/QuillEditor";

export default function PrivacyPolicy() {
  const [content, setContent] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch guidelines
        const res = await fetch("/api/privacy-policy");
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
        console.error("Error fetching policy:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSave = async () => {
    try {
      await fetch("/api/privacy-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: { ops: [{ insert: content }] } }),
      });
      alert("Policy updated!");
    } catch (error) {
      console.error("Error saving policy:", error);
      alert("Failed to update policy");
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>

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
