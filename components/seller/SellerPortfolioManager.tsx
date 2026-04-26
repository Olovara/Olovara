"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { uploadProcessedImages } from "@/lib/upload-images";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { X, Pin, PinOff, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { PortfolioItemCreateSchema } from "@/schemas/PortfolioItemSchema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type PortfolioComplexity = "easy" | "medium" | "advanced";

type PortfolioItem = {
  id: string;
  title: string;
  images: string[];
  tags: string[];
  description: string | null;
  priceRange: string | null;
  complexity: PortfolioComplexity | null;
  featured: boolean;
  featuredRank: number | null;
  sortOrder: number;
  createdAt: string;
};

const MAX_ITEMS = 24;
const MAX_IMAGES = 5;
const MAX_FEATURED = 4;

function normalizeTag(t: string) {
  return t.trim().replace(/\s+/g, " ");
}

export default function SellerPortfolioManager() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<PortfolioItem | null>(null);

  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [description, setDescription] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [complexity, setComplexity] = useState<PortfolioComplexity | "">("");
  const [featured, setFeatured] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newFileThumbs, setNewFileThumbs] = useState<
    Array<{ key: string; url: string; file: File }>
  >([]);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PortfolioItem | null>(null);

  const featuredItems = useMemo(
    () =>
      [...items]
        .filter((i) => i.featured)
        .sort((a, b) => (a.featuredRank ?? 999) - (b.featuredRank ?? 999)),
    [items]
  );

  const regularItems = useMemo(
    () => [...items].filter((i) => !i.featured).sort((a, b) => a.sortOrder - b.sortOrder),
    [items]
  );

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/seller/portfolio", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load portfolio.");
      setItems(json.items || []);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to load portfolio.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    const thumbs = newFiles.map((file) => {
      const key = `${file.name}-${file.size}-${file.lastModified}`;
      return { key, file, url: URL.createObjectURL(file) };
    });

    setNewFileThumbs(thumbs);

    return () => {
      for (const t of thumbs) URL.revokeObjectURL(t.url);
    };
  }, [newFiles]);

  const resetModal = () => {
    setEditing(null);
    setTitle("");
    setTags([]);
    setTagInput("");
    setDescription("");
    setPriceRange("");
    setComplexity("");
    setFeatured(false);
    setExistingImages([]);
    setNewFiles([]);
    setNewFileThumbs([]);
  };

  const openCreate = () => {
    resetModal();
    setIsModalOpen(true);
  };

  const openEdit = (item: PortfolioItem) => {
    resetModal();
    setEditing(item);
    setTitle(item.title);
    setTags(item.tags || []);
    setDescription(item.description || "");
    setPriceRange(item.priceRange || "");
    setComplexity((item.complexity as any) || "");
    setFeatured(!!item.featured);
    setExistingImages(item.images || []);
    setIsModalOpen(true);
  };

  const addTag = () => {
    const t = normalizeTag(tagInput);
    if (!t) return;
    if (tags.some((x) => x.toLowerCase() === t.toLowerCase())) {
      setTagInput("");
      return;
    }
    setTags((prev) => [...prev, t].slice(0, 20));
    setTagInput("");
  };

  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t));

  const removeExistingImage = (url: string) => {
    setExistingImages((prev) => prev.filter((u) => u !== url));
  };

  const onPickFiles = (files: FileList | null) => {
    if (!files) return;
    const incoming = Array.from(files);
    const deduped = incoming.filter((f) => {
      const key = `${f.name}-${f.size}-${f.lastModified}`;
      return !newFiles.some(
        (x) => `${x.name}-${x.size}-${x.lastModified}` === key
      );
    });

    const limit = Math.max(0, MAX_IMAGES - existingImages.length);
    const next = [...newFiles, ...deduped].slice(0, limit);
    setNewFiles(next);
  };

  const removeNewFile = (key: string) => {
    setNewFiles((prev) =>
      prev.filter((f) => `${f.name}-${f.size}-${f.lastModified}` !== key)
    );
  };

  const saveItem = async () => {
    if (!title.trim()) return toast.error("Title is required.");
    if (tags.length === 0) return toast.error("Add at least one tag.");

    const totalAfter = existingImages.length + newFiles.length;
    if (totalAfter === 0) return toast.error("Add at least one image.");
    if (totalAfter > MAX_IMAGES) return toast.error(`Max ${MAX_IMAGES} images per item.`);

    // Validate the non-file fields BEFORE uploading any files.
    // (UploadThing upload is client-side, so server-side API validation can only happen after upload.)
    try {
      PortfolioItemCreateSchema.parse({
        title: title.trim(),
        tags,
        description: description.trim() ? description.trim() : undefined,
        priceRange: priceRange.trim() ? priceRange.trim() : undefined,
        complexity: complexity || undefined,
        featured,
        // Placeholder strings so we can validate max 5 + non-empty.
        images: [
          ...existingImages,
          ...newFiles.map((f) => f.name || "image"),
        ],
      });
    } catch {
      return toast.error("Please fix the fields above before uploading.");
    }

    const uploadingToast = toast.loading(
      newFiles.length > 0 ? `Uploading ${newFiles.length} image(s)...` : "Saving..."
    );

    try {
      let uploadedUrls: string[] = [];
      if (newFiles.length > 0) {
        const { uploaded, skipped } = await uploadProcessedImages(newFiles);
        uploadedUrls = uploaded.map((u) => u.url);
        if (skipped.length > 0) {
          const names = skipped.map((s) => s.fileName).slice(0, 3).join(", ");
          const extra = skipped.length > 3 ? ` (+${skipped.length - 3} more)` : "";
          toast.warning(`Some images were skipped: ${names}${extra}.`);
        }
      }

      const payload = {
        title: title.trim(),
        tags,
        description: description.trim() ? description.trim() : undefined,
        priceRange: priceRange.trim() ? priceRange.trim() : undefined,
        complexity: complexity || undefined,
        featured,
        images: [...existingImages, ...uploadedUrls],
      };

      const res = await fetch(
        editing ? `/api/seller/portfolio/${editing.id}` : "/api/seller/portfolio",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to save item.");

      toast.dismiss(uploadingToast);
      toast.success(editing ? "Portfolio item updated." : "Portfolio item created.");
      setIsModalOpen(false);
      resetModal();
      await fetchItems();
    } catch (e: any) {
      console.error(e);
      toast.dismiss(uploadingToast);
      toast.error(e?.message || "Failed to save item.");
    }
  };

  const requestDelete = (item: PortfolioItem) => {
    setDeleteTarget(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    const item = deleteTarget;
    if (!item) return;
    try {
      const res = await fetch(`/api/seller/portfolio/${item.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to delete.");
      toast.success("Deleted.");
      await fetchItems();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to delete.");
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const toggleFeatured = async (item: PortfolioItem) => {
    try {
      const res = await fetch(`/api/seller/portfolio/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, featured: !item.featured }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to update.");
      await fetchItems();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to update.");
    }
  };

  const moveRegular = async (id: string, direction: "up" | "down") => {
    const idx = regularItems.findIndex((x) => x.id === id);
    if (idx < 0) return;
    const swapWith = direction === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= regularItems.length) return;

    const a = regularItems[idx];
    const b = regularItems[swapWith];

    const order = [
      { id: a.id, sortOrder: b.sortOrder },
      { id: b.id, sortOrder: a.sortOrder },
    ];

    try {
      const res = await fetch("/api/seller/portfolio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to reorder.");
      await fetchItems();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to reorder.");
    }
  };

  const moveFeaturedRank = async (id: string, direction: "up" | "down") => {
    const idx = featuredItems.findIndex((x) => x.id === id);
    if (idx < 0) return;
    const swapWith = direction === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= featuredItems.length) return;
    const a = featuredItems[idx];
    const b = featuredItems[swapWith];

    try {
      const res1 = await fetch(`/api/seller/portfolio/${a.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: a.id, featured: true, featuredRank: b.featuredRank ?? idx }),
      });
      const j1 = await res1.json();
      if (!res1.ok) throw new Error(j1?.error || "Failed to reorder featured.");

      const res2 = await fetch(`/api/seller/portfolio/${b.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: b.id, featured: true, featuredRank: a.featuredRank ?? swapWith }),
      });
      const j2 = await res2.json();
      if (!res2.ok) throw new Error(j2?.error || "Failed to reorder featured.");

      await fetchItems();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to reorder featured.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {items.length}/{MAX_ITEMS} items • {featuredItems.length}/{MAX_FEATURED} pinned
        </div>
        <Button onClick={openCreate} disabled={items.length >= MAX_ITEMS}>
          Add portfolio item
        </Button>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-semibold">Pinned (top of gallery)</h2>
        {featuredItems.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Pin up to {MAX_FEATURED} items to show your best work first.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {featuredItems.map((item) => (
              <Card key={item.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge>Pinned #{(item.featuredRank ?? 0) + 1}</Badge>
                      {item.complexity ? (
                        <Badge variant="outline">{item.complexity}</Badge>
                      ) : null}
                    </div>
                    <div className="font-semibold truncate">{item.title}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {item.tags?.slice(0, 6).map((t) => (
                        <Badge key={t} variant="outline" className="font-normal">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outlinePrimary" size="icon" onClick={() => moveFeaturedRank(item.id, "up")}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outlinePrimary"
                      size="icon"
                      onClick={() => moveFeaturedRank(item.id, "down")}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button variant="outlinePrimary" size="icon" onClick={() => openEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outlinePrimary" size="icon" onClick={() => toggleFeatured(item)}>
                      <PinOff className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {item.images?.[0] ? (
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border">
                    <Image
                      src={item.images[0]}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-semibold">All items</h2>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : regularItems.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Add a portfolio item to start building your conversion gallery.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {regularItems.map((item) => (
              <Card key={item.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {item.featured ? (
                        <Badge>Pinned</Badge>
                      ) : (
                        <Badge variant="outline">Portfolio</Badge>
                      )}
                      {item.complexity ? (
                        <Badge variant="outline">{item.complexity}</Badge>
                      ) : null}
                    </div>
                    <div className="font-semibold truncate">{item.title}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {item.tags?.slice(0, 6).map((t) => (
                        <Badge key={t} variant="outline" className="font-normal">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outlinePrimary" size="icon" onClick={() => moveRegular(item.id, "up")}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button variant="outlinePrimary" size="icon" onClick={() => moveRegular(item.id, "down")}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button variant="outlinePrimary" size="icon" onClick={() => openEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outlinePrimary"
                      size="icon"
                      onClick={() => toggleFeatured(item)}
                      disabled={featuredItems.length >= MAX_FEATURED && !item.featured}
                    >
                      <Pin className="h-4 w-4" />
                    </Button>
                    <Button variant="outlinePrimary" size="icon" onClick={() => requestDelete(item)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {item.images?.[0] ? (
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border">
                    <Image
                      src={item.images[0]}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) resetModal();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit portfolio item" : "Add portfolio item"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Hand-painted pet portrait" />
            </div>

            <div className="space-y-2">
              <Label>Tags (required)</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add a tag and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" variant="outlinePrimary" onClick={addTag}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {tags.map((t) => (
                  <Badge key={t} className="gap-1">
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className="inline-flex items-center"
                      aria-label={`Remove tag ${t}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Complexity</Label>
                <Select value={complexity} onValueChange={(v) => setComplexity(v as any)}>
                  <SelectTrigger className="border-brand-dark-neutral-200 focus:ring-brand-primary-100 focus:ring-offset-1 focus:border-brand-primary-700 data-[state=open]:border-brand-primary-700 data-[state=open]:ring-2 data-[state=open]:ring-brand-primary-100 data-[state=open]:ring-offset-1">
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">easy</SelectItem>
                    <SelectItem value="medium">medium</SelectItem>
                    <SelectItem value="advanced">advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Price range</Label>
                <Input
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  placeholder="Optional, e.g. $80–$150"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional. Share materials, technique, timeline, etc."
                rows={4}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={featured}
                onCheckedChange={(v) => setFeatured(Boolean(v))}
                disabled={featuredItems.length >= MAX_FEATURED && !editing?.featured}
              />
              <span className="text-sm">
                Pin this item (max {MAX_FEATURED})
              </span>
            </div>

            <div className="space-y-2">
              <Label>Images (max {MAX_IMAGES})</Label>
              {existingImages.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {existingImages.map((url) => (
                    <div key={url} className="relative overflow-hidden rounded-lg border">
                      <div className="relative aspect-[16/10] w-full">
                        <Image src={url} alt="" fill className="object-cover" sizes="50vw" />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outlinePrimary"
                        className="absolute right-2 top-2"
                        onClick={() => removeExistingImage(url)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}

              {newFileThumbs.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {newFileThumbs.map((t) => (
                    <div
                      key={t.key}
                      className="relative overflow-hidden rounded-lg border"
                    >
                      <div className="relative aspect-[16/10] w-full bg-brand-light-neutral-100">
                        <Image
                          src={t.url}
                          alt={t.file.name}
                          fill
                          unoptimized
                          className="object-cover"
                          sizes="50vw"
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outlinePrimary"
                        className="absolute right-2 top-2"
                        onClick={() => removeNewFile(t.key)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}

              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => onPickFiles(e.target.files)}
              />
              <div className="text-xs text-muted-foreground">
                Selected new files: {newFiles.length}. Total after save:{" "}
                {existingImages.length + newFiles.length}/{MAX_IMAGES}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outlinePrimary"
              onClick={() => {
                setIsModalOpen(false);
                resetModal();
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={saveItem}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete portfolio item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium">
                {deleteTarget?.title ?? "this item"}
              </span>{" "}
              and remove its images.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-brand-dark-neutral-200 hover:bg-brand-primary-50 hover:text-brand-primary-700 hover:border-brand-primary-200 focus-visible:ring-brand-primary-100 focus-visible:ring-offset-1"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteTarget(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

