"use client";

import { UploadDropzone } from "@/lib/uploadthing";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import Image from "next/image";
import { Dispatch, SetStateAction } from "react";

type ProductPhotosProps = {
  images: string[];
  setImages: Dispatch<SetStateAction<string[]>>;
  tempImages: string[];
  setTempImages: Dispatch<SetStateAction<string[]>>;
  form: any;
  setTempUploadsCreated?: (created: boolean) => void;
};

export function ProductPhotosSection({
  images,
  setImages,
  tempImages,
  setTempImages,
  form,
  setTempUploadsCreated,
}: ProductPhotosProps) {
  const imageArray = Array.isArray(images) ? images : [];

  const handleRemoveImage = (index: number) => {
    const removedImage = imageArray[index];
    const newImages = imageArray.filter((_, i) => i !== index);

    setImages(newImages);
    form.setValue("images", newImages, { shouldValidate: true }); // <-- critical

    if (tempImages.includes(removedImage)) {
      const updatedTempImages = tempImages.filter(
        (img: string) => img !== removedImage
      );
      setTempImages(updatedTempImages);
    }

    // Force form to recognize change and mark as dirty
    form.setValue("images", newImages, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const onRemove = (urlToRemove: string) => {
    setImages(images.filter((url) => url !== urlToRemove));
    // Remove from tempImages if it's a temporary image
    setTempImages(tempImages.filter(url => url !== urlToRemove));
  };

  const onUploadSuccess = (url: string) => {
    setImages(prev => [...prev, url]);
    setTempImages(prev => [...prev, url]);
    toast.success("Image uploaded successfully");
  };

  const onUploadError = (error: Error) => {
    toast.error(`Error uploading image: ${error.message}`);
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
          if (!res || res.length === 0) {
            toast.error("Image upload failed.");
            return;
          }

          const fileUrls = res.map(file => file.url || file.ufsUrl);
          const updatedImages = [...images, ...fileUrls];
          setImages(updatedImages);
          form.setValue("images", updatedImages, {
            shouldValidate: true,
          });

          // Track uploaded files as temp
          const updatedTempImages = [...tempImages, ...fileUrls];
          setTempImages(updatedTempImages);

          // Mark that temporary uploads have been created
          if (setTempUploadsCreated) {
            setTempUploadsCreated(true);
          }

          // Force form to recognize change
          form.setValue("images", updatedImages, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
          });

          toast.success("Your images have been uploaded!");
        }}
        onUploadError={(error: Error) => {
          toast.error("Something went wrong, try again");
        }}
      />
    </div>
  );
}
