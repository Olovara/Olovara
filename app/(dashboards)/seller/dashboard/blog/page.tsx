import { Suspense } from "react";
import BlogManagement from "@/components/BlogManagement";
import PermissionGate from "@/components/auth/permission-gate";

export default function SellerBlogPage() {
  return (
    <PermissionGate requiredPermission="WRITE_BLOG">
      <div className="space-y-6">
        <Suspense fallback={<div>Loading blog management...</div>}>
          <BlogManagement />
        </Suspense>
      </div>
    </PermissionGate>
  );
} 