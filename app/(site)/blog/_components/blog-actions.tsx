"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentPermissions } from "@/hooks/use-current-permissions";

export const BlogActions = () => {
  const { data: session, status } = useSession();
  const { permissions, loading } = useCurrentPermissions();

  // Don't render anything while loading
  if (status === "loading" || loading) {
    return null;
  }

  // Don't render anything if not authenticated
  if (status === "unauthenticated" || !session?.user) {
    return null;
  }

  // Check if user has blog permissions
  const hasWriteBlogPermission = permissions?.includes('WRITE_BLOG');
  const hasManageContentPermission = permissions?.includes('MANAGE_CONTENT');

  // Don't render anything if user has no permissions
  if (!hasWriteBlogPermission && !hasManageContentPermission) {
    return null;
  }

  return (
    <div className="flex gap-2 mb-6">
      {hasWriteBlogPermission && (
        <Link href="/blog/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </Link>
      )}
      
      {hasManageContentPermission && (
        <Link href="/blog/categories">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Manage Categories
          </Button>
        </Link>
      )}
    </div>
  );
}; 