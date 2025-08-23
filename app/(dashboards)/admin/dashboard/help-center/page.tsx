"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Edit,
  Eye,
  Trash2,
  FileText,
  FolderOpen,
  Users,
  Calendar,
  TrendingUp,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import HelpCategoryForm from "@/components/forms/HelpCategoryForm";

// Dashboard display interface
interface HelpArticleDisplay {
  id: string;
  title: string;
  description: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED";
  targetAudience: "BUYERS" | "SELLERS" | "BOTH";
  views: number;
  readTime: number | null;
  featured: boolean;
  order: number;
  createdAt: string;
  publishedAt: string | null;
  cat: {
    title: string;
    slug: string;
  };
}

// Form interface (compatible with HelpArticleForm)
interface HelpArticle {
  id?: string;
  slug?: string;
  title: string;
  description: string;
  content: string;
  catSlug: string;
  status: "DRAFT" | "PUBLISHED";
  isPrivate: boolean;
  tags: string[];
  keywords: string[];
  readTime: number | null;
  targetAudience?: "BUYERS" | "SELLERS" | "BOTH";
}

interface HelpCategory {
  id: string;
  title: string;
  description: string;
  slug: string;
  order: number;
  isActive: boolean;
  _count: {
    articles: number;
  };
}

export default function HelpCenterDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("articles");
  const [articles, setArticles] = useState<HelpArticleDisplay[]>([]);
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [audienceFilter, setAudienceFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<HelpCategory | null>(
    null
  );

  // Fetch articles
  const fetchArticles = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        limit: "50",
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      if (statusFilter !== "all") params.append("status", statusFilter);
      if (audienceFilter !== "all")
        params.append("targetAudience", audienceFilter);
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/help/articles?${params}`);
      if (!response.ok) throw new Error("Failed to fetch articles");

      const data = await response.json();
      setArticles(data.articles || []);
    } catch (error) {
      console.error("Error fetching articles:", error);
      toast.error("Failed to fetch articles");
    }
  }, [statusFilter, audienceFilter, categoryFilter, searchTerm]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/help/categories?includeArticles=true");
      if (!response.ok) throw new Error("Failed to fetch categories");

      const data = await response.json();
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to fetch categories");
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchArticles(), fetchCategories()]);
      setLoading(false);
    };
    loadData();
  }, [fetchArticles, fetchCategories]);

  // Refresh data when filters change
  useEffect(() => {
    if (!loading) {
      fetchArticles();
    }
  }, [fetchArticles, loading]);



  // Handle category form submission
  const handleCategorySubmit = async (data: any) => {
    try {
      const url = editingCategory
        ? `/api/help/categories/${editingCategory.slug}`
        : "/api/help/categories";

      const method = editingCategory ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to save category");

      toast.success(
        `Category ${editingCategory ? "updated" : "created"} successfully`
      );

      setShowCategoryForm(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("Failed to save category");
    }
  };

  // Handle article deletion
  const handleDeleteArticle = async (article: HelpArticleDisplay) => {
    try {
      const response = await fetch(`/api/help/articles/${article.slug}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete article");

      toast.success("Article deleted successfully");

      fetchArticles();
    } catch (error) {
      console.error("Error deleting article:", error);
      toast.error("Failed to delete article");
    }
  };

  // Handle category deletion
  const handleDeleteCategory = async (category: HelpCategory) => {
    try {
      const response = await fetch(`/api/help/categories/${category.slug}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete category");

      toast.success("Category deleted successfully");

      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    }
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Published
          </Badge>
        );
      case "DRAFT":
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get audience badge variant
  const getAudienceBadge = (audience: string) => {
    switch (audience) {
      case "BUYERS":
        return (
          <Badge variant="outline" className="border-blue-200 text-blue-700">
            Buyers
          </Badge>
        );
      case "SELLERS":
        return (
          <Badge
            variant="outline"
            className="border-purple-200 text-purple-700"
          >
            Sellers
          </Badge>
        );
      case "BOTH":
        return (
          <Badge variant="outline" className="border-gray-200 text-gray-700">
            Both
          </Badge>
        );
      default:
        return <Badge variant="outline">{audience}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">
            Loading help center data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Help Center Management
          </h1>
          <p className="text-muted-foreground">
            Manage help articles and categories for the Yarnnu marketplace
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => router.push("/admin/dashboard/help-center/create")}>
            <Plus className="mr-2 h-4 w-4" />
            New Article
          </Button>

          <Dialog open={showCategoryForm} onOpenChange={setShowCategoryForm}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                onClick={() => setEditingCategory(null)}
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                New Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Edit Category" : "Create New Category"}
                </DialogTitle>
              </DialogHeader>
              <HelpCategoryForm
                initialData={editingCategory}
                onSubmit={handleCategorySubmit}
                onCancel={() => {
                  setShowCategoryForm(false);
                  setEditingCategory(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Articles
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{articles.length}</div>
            <p className="text-xs text-muted-foreground">
              {articles.filter((a) => a.status === "PUBLISHED").length}{" "}
              published
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">
              {categories.filter((c) => c.isActive).length} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {articles
                .reduce((sum, article) => sum + article.views, 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Across all articles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Featured Articles
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {articles.filter((a) => a.featured).length}
            </div>
            <p className="text-xs text-muted-foreground">Highlighted content</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        {/* Articles Tab */}
        <TabsContent value="articles" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search articles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Audience</label>
                  <Select
                    value={audienceFilter}
                    onValueChange={setAudienceFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All audiences" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Audiences</SelectItem>
                      <SelectItem value="BUYERS">Buyers</SelectItem>
                      <SelectItem value="SELLERS">Sellers</SelectItem>
                      <SelectItem value="BOTH">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.slug} value={category.slug}>
                          {category.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Articles List */}
          <Card>
            <CardHeader>
              <CardTitle>Articles ({articles.length})</CardTitle>
              <CardDescription>
                Manage help center articles and their content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {articles.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No articles found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by creating your first help article.
                    </p>
                    <div className="mt-6">
                      <Button onClick={() => router.push("/admin/dashboard/help-center/create")}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Article
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {articles.map((article) => (
                      <div
                        key={article.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {article.title}
                            </h3>
                            {article.featured && (
                              <Badge variant="outline" className="text-xs">
                                Featured
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate mb-2">
                            {article.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <FolderOpen className="h-3 w-3" />
                              {article.cat.title}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {article.views.toLocaleString()} views
                            </span>
                            {article.readTime && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {article.readTime} min read
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {getAudienceBadge(article.targetAudience)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {getStatusBadge(article.status)}
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/admin/dashboard/help-center/edit/${article.slug}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                window.open(
                                  `/help-center/${article.slug}`,
                                  "_blank"
                                )
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Article
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete &quot;
                                    {article.title}&quot;? This action cannot be
                                    undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteArticle(article)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Categories ({categories.length})</CardTitle>
              <CardDescription>
                Organize help articles into categories for better navigation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categories.length === 0 ? (
                  <div className="text-center py-8">
                    <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No categories found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by creating your first category.
                    </p>
                    <div className="mt-6">
                      <Button onClick={() => setShowCategoryForm(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Category
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-sm font-medium text-gray-900">
                            {category.title}
                          </h3>
                          <Badge
                            variant={
                              category.isActive ? "default" : "secondary"
                            }
                          >
                            {category.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {category.description && (
                          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                            {category.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {category._count.articles} articles
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Order: {category.order}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCategory(category);
                              setShowCategoryForm(true);
                            }}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Category
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete &quot;
                                  {category.title}&quot;? This will also delete
                                  all articles in this category.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCategory(category)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
