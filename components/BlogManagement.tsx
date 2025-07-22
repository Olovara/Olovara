"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Edit, 
  Eye, 
  Plus, 
  Calendar, 
  Clock, 
  Tag as TagIcon,
  FileText,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface BlogPost {
  id: string;
  title: string;
  description: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED";
  publishedAt: string | null;
  views: number;
  readTime: number | null;
  tags: string[];
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function BlogManagement() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/blog/posts");
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      } else {
        toast.error("Failed to fetch blog posts");
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to fetch blog posts");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postSlug: string) => {
    if (!confirm("Are you sure you want to delete this blog post? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/blog/posts/${postSlug}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Blog post deleted successfully");
        fetchPosts(); // Refresh the list
      } else {
        toast.error("Failed to delete blog post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete blog post");
    }
  };

  const filteredPosts = posts.filter(post => {
    if (activeTab === "all") return true;
    if (activeTab === "published") return post.status === "PUBLISHED";
    if (activeTab === "drafts") return post.status === "DRAFT";
    return true;
  });

  const publishedCount = posts.filter(post => post.status === "PUBLISHED").length;
  const draftCount = posts.filter(post => post.status === "DRAFT").length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Blog Management</h2>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Blog Management</h2>
          <p className="text-muted-foreground">
            Manage your blog posts and create new content
          </p>
        </div>
        <Button onClick={() => router.push("/blog/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Post
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All ({posts.length})
          </TabsTrigger>
          <TabsTrigger value="published">
            Published ({publishedCount})
          </TabsTrigger>
          <TabsTrigger value="drafts">
            Drafts ({draftCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredPosts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {activeTab === "all" && "No blog posts yet"}
                  {activeTab === "published" && "No published posts"}
                  {activeTab === "drafts" && "No draft posts"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {activeTab === "all" && "Create your first blog post to get started"}
                  {activeTab === "published" && "Publish a post to see it here"}
                  {activeTab === "drafts" && "Save a post as draft to see it here"}
                </p>
                <Button onClick={() => router.push("/blog/new")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Post
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold line-clamp-1">
                            {post.title}
                          </h3>
                          <Badge variant={post.status === "PUBLISHED" ? "default" : "secondary"}>
                            {post.status}
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground line-clamp-2">
                          {post.description}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {post.status === "PUBLISHED" && post.publishedAt
                                ? formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })
                                : formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          
                          {post.readTime && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{post.readTime} min read</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            <span>{post.views} views</span>
                          </div>
                        </div>

                        {post.tags && post.tags.length > 0 && (
                          <div className="flex items-center gap-2">
                            <TagIcon className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-wrap gap-1">
                              {post.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {post.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{post.tags.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {post.status === "PUBLISHED" && (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/blog/${post.slug}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/blog/edit/${post.slug}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeletePost(post.slug)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 