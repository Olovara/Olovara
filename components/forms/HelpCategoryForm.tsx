"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HelpCategory {
  id: string;
  slug: string;
  title: string;
  description?: string;
  img?: string;
  order: number;
  isActive: boolean;
  parentSlug?: string;
}

interface HelpCategoryFormProps {
  initialData?: HelpCategory | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function HelpCategoryForm({
  initialData,
  onSubmit,
  onCancel,
}: HelpCategoryFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [img, setImg] = useState(initialData?.img || "");
  const [order, setOrder] = useState(initialData?.order || 0);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [parentSlug, setParentSlug] = useState(initialData?.parentSlug || "");
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch categories for parent selection
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/help/categories?isActive=true");
        if (response.ok) {
          const data = await response.json();
          // Filter out the current category if editing to prevent self-reference
          const filteredCategories = initialData 
            ? data.filter((cat: HelpCategory) => cat.slug !== initialData.slug)
            : data;
          setCategories(filteredCategories);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert("Title is required");
      return;
    }

    setIsLoading(true);

    try {
      const formData = {
        title: title.trim(),
        description: description.trim() || null,
        img: img.trim() || null,
        order: order,
        isActive,
        parentSlug: parentSlug || null,
      };

      await onSubmit(formData);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Category Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter category title..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter category description..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="img">Image URL</Label>
            <Input
              id="img"
              value={img}
              onChange={(e) => setImg(e.target.value)}
              placeholder="Enter image URL..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentSlug">Parent Category</Label>
            <Select value={parentSlug} onValueChange={setParentSlug}>
              <SelectTrigger>
                <SelectValue placeholder="Select a parent category (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No parent category</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.slug} value={category.slug}>
                    {category.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order">Display Order</Label>
            <Input
              id="order"
              type="number"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
              placeholder="0"
              min="0"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : initialData ? "Update Category" : "Create Category"}
        </Button>
      </div>
    </form>
  );
}
