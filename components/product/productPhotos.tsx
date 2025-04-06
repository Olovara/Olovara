"use client";

import { UploadDropzone } from "@/lib/uploadthing";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Form } from "react-hook-form";

type ProductPhotosProps = {
  images: string[];
  setImages: (images: string[]) => void;
};

export function ProductPhotosSection({
  images,
  setImages,
}: ProductPhotosProps) {
  // Make sure images is always an array
  const imageArray = Array.isArray(images) ? images : [];

  const handleRemoveImage = (index: number) => {
    const newImages = imageArray.filter((_, i) => i !== index);
    setImages(newImages);
  };

  return (
    <div className="flex flex-col gap-y-4">
      <Label>Product Photos</Label>

      {/* Preview Images */}
      {imageArray.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {imageArray.map((url, index) => (
            <div key={index} className="relative w-24 h-24">
              <Image
                fill
                loading="eager"
                className="-z-10 h-full w-full object-cover object-center"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                src={url}
                alt={`Product image ${index + 1}`}
              />
              <Button
                variant="destructive"
                size="icon"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-0 right-0 w-5 h-5"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Section */}
      <UploadDropzone
        endpoint="imageUploader"
        onClientUploadComplete={(res) => {
          const urls = res.map((item) => item.url);
          // Append new images to existing ones
          setImages([...imageArray, ...urls]);
        }}
        onUploadError={(error: Error) => {
          toast.error("Something went wrong, try again");
        }}
      />
    </div>
  );
}
