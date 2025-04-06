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
  tempImages: string[];
  setTempImages: (images: string[]) => void;
  form: any;
};

export function ProductPhotosSection({
  images,
  setImages,
  tempImages,
  setTempImages,
  form,
}: ProductPhotosProps) {
  const imageArray = Array.isArray(images) ? images : [];

  const handleRemoveImage = (index: number) => {
    const removedImage = imageArray[index];
    const newImages = imageArray.filter((_, i) => i !== index);
    
    // Update the images state
    setImages(newImages);

    // Clean up the removed image from storage, regardless of whether it's temp or not
    fetch("/api/upload/cleanup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ images: [removedImage] }),
    }).catch(console.error);

    // If it was a temp image, also remove it from tempImages state
    if (tempImages.includes(removedImage)) {
      setTempImages(prev => prev.filter(img => img !== removedImage));
    }

    // Force form to recognize change and mark as dirty
    form.setValue('images', newImages, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
  };

  return (
    <div className="flex flex-col gap-y-4">
      <Label>Product Photos</Label>

      {/* Preview Images */}
      {imageArray.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {imageArray.map((url, index) => (
            <div key={url} className="relative w-24 h-24">
              <Image
                fill
                loading="eager"
                className="-z-10 h-full w-full object-cover object-center"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                src={url}
                alt={`Product image ${index + 1}`}
              />
              <Button
                type="button"
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
          const newImages = [...imageArray, ...urls];
          
          // Update both states
          setTempImages(prev => [...prev, ...urls]);
          setImages(newImages);
          
          // Force form to recognize change
          form.setValue('images', newImages, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true
          });
        }}
        onUploadError={(error: Error) => {
          toast.error("Something went wrong, try again");
        }}
      />
    </div>
  );
}
