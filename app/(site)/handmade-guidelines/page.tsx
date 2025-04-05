"use client";

import { useState, useEffect } from "react";
import "react-quill/dist/quill.snow.css";
import { QuillEditor } from "@/components/QuillEditor";

export default function HandmadeGuidelines() {
  const [content, setContent] = useState({ ops: [] });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch guidelines
      const res = await fetch("/api/handmade-guidelines");
      const data = await res.json();
      setContent(data.content);

      // Fetch user role from API
      const roleRes = await fetch("/api/auth/get-role");
      const roleData = await roleRes.json();
      setIsAdmin(roleData.role === "admin");
    };

    fetchData();
  }, []);

  const handleSave = async () => {
    await fetch("/api/handmade-guidelines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    alert("Guidelines updated!");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Handmade Guidelines</h1>

      {/* Display QuillEditor only for admin */}
      {isAdmin ? (
        <QuillEditor setJson={setContent} json={content} />
      ) : (
        <div className="ql-editor">
          {/* Display content in Quill's output format */}
        </div>
      )}

      {/* Show save button only if admin */}
      {isAdmin && (
        <button
          className="mt-4 p-2 bg-purple-600 text-white rounded"
          onClick={handleSave}
        >
          Save Changes
        </button>
      )}
    </div>
  );
}
