"use client";

import { useState, useEffect, useCallback } from "react";
import "react-quill/dist/quill.snow.css";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { format } from "date-fns";
import DMCAForm from "@/components/forms/DMCAForm";

// Dynamically import QuillEditor with SSR disabled
const QuillEditor = dynamic(
  () => import("@/components/QuillEditor").then((mod) => mod.QuillEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-[200px] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          Loading editor...
        </div>
      </div>
    ),
  }
);

export default function CopyrightInfringement() {
  const [content, setContent] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDMCAForm, setShowDMCAForm] = useState(false);

  const fetchPolicy = useCallback(async () => {
    try {
      const res = await fetch("/api/copyright-infringement");
      if (!res.ok) {
        throw new Error(`API request failed with status ${res.status}`);
      }
      const data = await res.json();
      setContent(data.content.html || "");
      setLastUpdated(new Date(data.updatedAt));
    } catch (error) {
      console.error("Error fetching copyright infringement policy:", error);
      setContent("");
      setLastUpdated(null);
    }
  }, []);

  const checkAdminStatus = useCallback(async () => {
    try {
      const roleRes = await fetch("/api/auth/get-role");
      if (roleRes.ok) {
        const roleData = await roleRes.json();
        setIsAdmin(roleData.permissions?.includes("MANAGE_CONTENT"));
      }
    } catch (error) {
      // If there's an error (like not logged in), just keep isAdmin as false
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchPolicy();
      await checkAdminStatus();
      setIsLoading(false);
    };
    loadData();
  }, [fetchPolicy, checkAdminStatus]);

  const handleSave = useCallback(async () => {
    if (!content.trim()) {
      toast.error("Please add some content before saving");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Saving policy...");

    try {
      const htmlToSave = content || "";
      const textToSave = htmlToSave.replace(/<[^>]*>?/gm, "");

      const response = await fetch("/api/copyright-infringement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: {
            html: htmlToSave,
            text: textToSave,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save copyright infringement policy");
      }

      const data = await response.json();
      setLastUpdated(new Date(data.updatedAt));

      toast.success("Copyright infringement policy updated successfully!", {
        id: toastId,
      });
    } catch (error) {
      console.error("Error saving copyright infringement policy:", error);
      toast.error("Failed to update policy. Please try again.", {
        id: toastId,
      });
    } finally {
      setIsSaving(false);
    }
  }, [content]);

  if (isLoading) {
    return <div className="p-4 sm:p-6">Loading...</div>;
  }

  return (
    <div className="w-full px-4 sm:px-6 md:px-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          {lastUpdated && (
            <p className="text-sm text-muted-foreground mt-2 sm:mt-0">
              Last updated: {format(lastUpdated, "MMMM d, yyyy")}
            </p>
          )}
        </div>

        {/* Display content with proper Quill styling */}
        <div className="prose max-w-none ql-snow">
          <div
            className="ql-editor"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>

        {/* DMCA Complaint Section */}
        <div className="mt-8 border-t pt-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Report Copyright Infringement
            </h2>
            <p className="text-gray-600 mb-4">
              If you believe your copyrighted work has been used without
              authorization, you can submit a DMCA takedown notice using the
              form below.
            </p>
            {!showDMCAForm && (
              <button
                onClick={() => setShowDMCAForm(true)}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Submit DMCA Complaint
              </button>
            )}
          </div>

          {showDMCAForm && (
            <div className="mt-6">
              <DMCAForm />
              <div className="text-center mt-4">
                <button
                  onClick={() => setShowDMCAForm(false)}
                  className="text-gray-500 hover:text-gray-700 underline"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Show editor and save button only for admin */}
        {isAdmin && (
          <div className="mt-6 sm:mt-8 border-t pt-6 sm:pt-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">
              Edit Policy
            </h2>
            <QuillEditor value={content} onChange={setContent} />
            <button
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
