"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";

type PortfolioItem = {
  id: string;
  title: string;
  images: string[];
  tags: string[];
  description?: string | null;
  priceRange?: string | null;
  complexity?: string | null;
  featured?: boolean;
};

export default function PortfolioGallery({ items }: { items: PortfolioItem[] }) {
  const [open, setOpen] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const activeItem = useMemo(
    () => items.find((i) => i.id === activeItemId) ?? null,
    [items, activeItemId]
  );

  const images = activeItem?.images ?? [];
  const canPrev = activeIndex > 0;
  const canNext = activeIndex < images.length - 1;

  const openViewer = (itemId: string, index: number) => {
    setActiveItemId(itemId);
    setActiveIndex(index);
    setOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border bg-white overflow-hidden"
          >
            <button
              type="button"
              className="relative aspect-[16/10] w-full bg-brand-light-neutral-100"
              onClick={() => openViewer(item.id, 0)}
              aria-label={`View images for ${item.title}`}
            >
              {item.images?.[0] ? (
                <Image
                  src={item.images[0]}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
              ) : null}
              {item.images?.length > 1 ? (
                <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs text-brand-dark-neutral-900 border border-brand-dark-neutral-200">
                  <Images className="h-3.5 w-3.5" />
                  {item.images.length}
                </div>
              ) : null}
            </button>

            {item.images?.length > 1 ? (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {item.images.slice(0, 5).map((url, idx) => (
                  <button
                    key={url}
                    type="button"
                    className="relative h-12 w-16 flex-shrink-0 overflow-hidden rounded-md border border-brand-dark-neutral-200"
                    onClick={() => openViewer(item.id, idx)}
                    aria-label={`Open image ${idx + 1} for ${item.title}`}
                  >
                    <Image
                      src={url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>
            ) : null}

            <div className="p-4 pt-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {item.featured ? (
                  <span className="text-xs font-medium text-brand-primary-700 bg-brand-primary-50 px-2 py-1 rounded-full border border-brand-primary-200">
                    Featured
                  </span>
                ) : null}
                {item.complexity ? (
                  <span className="text-xs text-gray-600 border px-2 py-1 rounded-full">
                    {item.complexity}
                  </span>
                ) : null}
                {item.priceRange ? (
                  <span className="text-xs text-gray-600 border px-2 py-1 rounded-full">
                    {item.priceRange}
                  </span>
                ) : null}
              </div>
              <div className="font-semibold text-gray-900 line-clamp-1">
                {item.title}
              </div>
              {item.description ? (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {item.description}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-1 mt-3">
                {(item.tags || []).slice(0, 6).map((t: string) => (
                  <span
                    key={t}
                    className="text-xs text-gray-700 bg-brand-light-neutral-100 px-2 py-1 rounded-full"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            setActiveItemId(null);
            setActiveIndex(0);
          }
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="truncate">
              {activeItem?.title ?? "Portfolio item"}
            </DialogTitle>
          </DialogHeader>

          {activeItem && images.length > 0 ? (
            <div className="space-y-3">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border">
                <Image
                  src={images[activeIndex]}
                  alt={activeItem.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 900px"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outlinePrimary"
                  onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
                  disabled={!canPrev}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Prev
                </Button>
                <div className="text-sm text-muted-foreground">
                  {activeIndex + 1}/{images.length}
                </div>
                <Button
                  type="button"
                  variant="outlinePrimary"
                  onClick={() =>
                    setActiveIndex((i) => Math.min(images.length - 1, i + 1))
                  }
                  disabled={!canNext}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              {images.length > 1 ? (
                <div className="flex gap-2 overflow-x-auto pt-1">
                  {images.map((url, idx) => (
                    <button
                      key={url}
                      type="button"
                      className={[
                        "relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-md border",
                        idx === activeIndex
                          ? "border-brand-primary-700 ring-2 ring-brand-primary-100 ring-offset-1"
                          : "border-brand-dark-neutral-200",
                      ].join(" ")}
                      onClick={() => setActiveIndex(idx)}
                      aria-label={`Select image ${idx + 1}`}
                    >
                      <Image
                        src={url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No images.</div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

