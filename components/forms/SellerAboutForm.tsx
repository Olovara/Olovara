"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Submitbutton } from "@/components/SubmitButtons";
import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useIsClient } from "@/hooks/use-is-client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Spinner from "@/components/spinner";
import { SellerAboutSchema } from "@/schemas/SellerAboutSchema";
import {
  updateSellerAbout,
  getSellerAbout,
} from "@/actions/sellerAboutActions";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import {
  SingleImageProcessor,
  SingleProcessedImage,
} from "@/components/seller/SingleImageProcessor";
import { uploadProcessedImages } from "@/lib/upload-images";
import { useSession } from "next-auth/react";
import { cleanupTempUploads } from "@/actions/cleanup-temp-uploads";

// Rich text editor for Behind the Hands (SSR disabled like other Quill usage)
const QuillEditor = dynamic(
  () => import("@/components/QuillEditor").then((mod) => mod.QuillEditor),
  { ssr: false, loading: () => <div className="min-h-[200px] animate-pulse rounded border bg-muted" /> }
);

const SellerAboutForm = () => {
  const isClient = useIsClient();
  const { data: session } = useSession();
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isPending, setIsPending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Add state to track temporary uploads
  const [tempImages, setTempImages] = useState<string[]>([]);
  const [tempUploadsCreated, setTempUploadsCreated] = useState(false);

  // Add state to track processed images (before upload)
  const [processedSellerImage, setProcessedSellerImage] =
    useState<SingleProcessedImage | null>(null);
  const [processedBannerImage, setProcessedBannerImage] =
    useState<SingleProcessedImage | null>(null);
  const [processedLogoImage, setProcessedLogoImage] =
    useState<SingleProcessedImage | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Add a ref to track if form was submitted successfully
  const formSubmittedRef = useRef(false);

  const form = useForm<z.infer<typeof SellerAboutSchema>>({
    resolver: zodResolver(SellerAboutSchema),
    defaultValues: {
      shopName: "",
      shopTagLine: "",
      shopDescription: "",
      shopAnnouncement: "",
      behindTheHands: "",
      sellerImage: undefined,
      shopBannerImage: undefined,
      shopLogoImage: undefined,
    },
  });

  useEffect(() => {
    const fetchSellerAbout = async () => {
      try {
        const result = await getSellerAbout();
        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          // Convert nulls to undefined for optional fields, keep empty strings for required fields
          const safeData = {
            shopName: result.data.shopName || "",
            shopDescription: result.data.shopDescription || "",
            shopTagLine: result.data.shopTagLine || undefined,
            shopAnnouncement: result.data.shopAnnouncement || undefined,
            behindTheHands: result.data.behindTheHands || undefined,
            sellerImage: result.data.sellerImage || undefined,
            shopBannerImage: result.data.shopBannerImage || undefined,
            shopLogoImage: result.data.shopLogoImage || undefined,
          };
          form.reset(safeData);
        }
      } catch (error) {
        setError("Failed to load shop information");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSellerAbout();
  }, [form]);

  // Add cleanup function for temporary uploads
  const cleanupTempImages = useCallback(async () => {
    // Only clean up if the form was submitted successfully
    if (tempImages.length > 0 && formSubmittedRef.current) {
      try {
        // For about form cleanup, we don't have a product ID, so pass empty string
        const result = await cleanupTempUploads("", tempImages);
        console.log("[DEBUG] About form cleanup result:", result);
        setTempImages([]); // Clear the temp images after cleanup
      } catch (error) {
        console.error("Error cleaning up temporary images:", error);
      }
    }
  }, [tempImages]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      void cleanupTempImages();
    };
  }, [cleanupTempImages]);

  // Add beforeunload handler to warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty || tempImages.length > 0) {
        e.preventDefault();
        // Modern browsers ignore the return value, but we still need to call preventDefault()
        return "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [form.formState.isDirty, tempImages]);

  const onSubmit = async (values: z.infer<typeof SellerAboutSchema>) => {
    try {
      console.log("Form submission started with values:", values);
      setIsPending(true);
      setError("");
      setSuccess("");

      // Upload processed images if any
      let finalSellerImage = values.sellerImage;
      let finalBannerImage = values.shopBannerImage;
      let finalLogoImage = values.shopLogoImage;

      // Collect all new processed images to upload
      // Track which file maps to which field so we can assign URLs reliably,
      // even if the uploader reports skipped files.
      const uploadItems: Array<{ type: "seller" | "banner" | "logo"; file: File }> = [];

      if (processedSellerImage && processedSellerImage.file.size > 0) {
        uploadItems.push({ type: "seller", file: processedSellerImage.file });
      }
      if (processedBannerImage && processedBannerImage.file.size > 0) {
        uploadItems.push({ type: "banner", file: processedBannerImage.file });
      }
      if (processedLogoImage && processedLogoImage.file.size > 0) {
        uploadItems.push({ type: "logo", file: processedLogoImage.file });
      }

      // Upload new images if any
      if (uploadItems.length > 0) {
        setIsUploading(true);
        toast.loading("Uploading images...");
        try {
          const { uploaded, skipped } = await uploadProcessedImages(
            uploadItems.map((i) => i.file)
          );
          const urlByFileName = new Map(uploaded.map((u) => [u.fileName, u.url]));

          // Warn the seller if anything was skipped (size/type/etc.)
          if (skipped.length > 0) {
            const names = skipped.map((s) => s.fileName).slice(0, 3).join(", ");
            const extra = skipped.length > 3 ? ` (+${skipped.length - 3} more)` : "";
            toast.warning(
              `Some images were skipped: ${names}${extra}. Check file size/type and try again.`
            );
          }

          // Map uploaded URLs to their respective fields by fileName
          for (const item of uploadItems) {
            const url = urlByFileName.get(item.file.name);
            if (!url) continue;

            if (item.type === "seller") finalSellerImage = url;
            if (item.type === "banner") finalBannerImage = url;
            if (item.type === "logo") finalLogoImage = url;
          }

          toast.dismiss();
        } catch (uploadError) {
          console.error("Error uploading images:", uploadError);
          toast.dismiss();
          toast.error("Failed to upload images. Please try again.");
          setIsPending(false);
          setIsUploading(false);
          return;
        } finally {
          setIsUploading(false);
        }
      }

      // Prepare form data with uploaded image URLs
      const formData = {
        ...values,
        sellerImage: finalSellerImage,
        shopBannerImage: finalBannerImage,
        shopLogoImage: finalLogoImage,
      };

      const result = await updateSellerAbout(formData);
      console.log("Form submission result:", result);

      if (result.error) {
        toast.error(result.error);
        throw new Error(result.error);
      }

      // Set the flag to indicate successful submission
      formSubmittedRef.current = true;

      // Clear processed images after successful upload
      setProcessedSellerImage(null);
      setProcessedBannerImage(null);
      setProcessedLogoImage(null);

      // Clean up temporary uploads after successful submission
      if (tempImages.length > 0) {
        console.log(
          "[DEBUG] About form submitted successfully, cleaning up temporary uploads"
        );
        const cleanupResult = await cleanupTempUploads("", tempImages);
        console.log("[DEBUG] Cleanup result:", cleanupResult);

        if (!cleanupResult.success) {
          console.error("[ERROR] Cleanup failed:", cleanupResult.error);
        }

        // Clear temp images after cleanup
        setTempImages([]);
      }

      toast.success(
        result.message || "Successfully saved your shop information."
      );
    } catch (error) {
      console.error("Error submitting form:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to save shop information";
      toast.error(errorMessage);
    } finally {
      setIsPending(false);
    }
  };

  // Handle processed images from SingleImageProcessor
  const handleSellerImageProcessed = useCallback(
    (image: SingleProcessedImage | null) => {
      setProcessedSellerImage(image);
      // Update form field - if image is null, clear the field
      if (!image) {
        form.setValue("sellerImage", undefined);
      }
    },
    [form]
  );

  const handleBannerImageProcessed = useCallback(
    (image: SingleProcessedImage | null) => {
      setProcessedBannerImage(image);
      // Update form field - if image is null, clear the field
      if (!image) {
        form.setValue("shopBannerImage", undefined);
      }
    },
    [form]
  );

  const handleLogoImageProcessed = useCallback(
    (image: SingleProcessedImage | null) => {
      setProcessedLogoImage(image);
      // Update form field - if image is null, clear the field
      if (!image) {
        form.setValue("shopLogoImage", undefined);
      }
    },
    [form]
  );

  if (!isClient || isLoading) return <Spinner />;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <CardHeader>
        <CardTitle>About Your Shop</CardTitle>
        <CardDescription>
          Tell customers about your shop and upload images to make it stand out
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-y-6">
        {/* Debug form errors */}
        {Object.keys(form.formState.errors).length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <h4 className="text-sm font-medium text-red-800 mb-2">
              Form Validation Errors:
            </h4>
            <ul className="text-sm text-red-700 space-y-1">
              {Object.entries(form.formState.errors).map(([field, error]) => (
                <li key={field}>
                  <strong>{field}:</strong> {error?.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Shop Name */}
        <div className="flex flex-col gap-y-2">
          <Label>Shop Name *</Label>
          <Input
            placeholder="Enter your shop name"
            {...form.register("shopName")}
            disabled={isPending}
          />
          <p className="text-xs text-muted-foreground">
            This will be your shop&apos;s display name and URL
          </p>
        </div>

        {/* Shop Tagline */}
        <div className="flex flex-col gap-y-2">
          <Label>Shop Tagline</Label>
          <Input
            placeholder="A short, catchy tagline for your shop"
            {...form.register("shopTagLine")}
            disabled={isPending}
          />
          <p className="text-xs text-muted-foreground">
            A brief description that appears under your shop name
          </p>
        </div>

        {/* Shop Description */}
        <div className="flex flex-col gap-y-2">
          <Label>Shop Description *</Label>
          <Textarea
            placeholder="Tell customers about your shop, your products, and what makes you unique"
            {...form.register("shopDescription")}
            disabled={isPending}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            This helps customers understand what you offer
          </p>
        </div>

        {/* Shop Announcement */}
        <div className="flex flex-col gap-y-2">
          <Label>Shop Announcement</Label>
          <Textarea
            placeholder="Any announcements, special offers, or updates for your customers"
            {...form.register("shopAnnouncement")}
            disabled={isPending}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            This will be displayed prominently on your shop page
          </p>
        </div>

        {/* Behind the Hands - rich text via Quill (stores HTML) */}
        <div className="flex flex-col gap-y-2">
          <Label>Behind the Hands</Label>
          <QuillEditor
            value={form.watch("behindTheHands") ?? ""}
            onChange={(html) => form.setValue("behindTheHands", html, { shouldDirty: true })}
            placeholder="Share your personal story - how you got started, what you love about crafting, your journey, and what makes your work special"
          />
          {/* Character counter: plain text length (strip HTML tags) like product description */}
          {(() => {
            const html = form.watch("behindTheHands") ?? "";
            const plainTextLength = html ? html.replace(/<[^>]*>/g, "").length : 0;
            const maxLength = 5000;
            const isNearLimit = plainTextLength > maxLength * 0.9;
            const isOverLimit = plainTextLength > maxLength;
            return (
              <div className="flex justify-end">
                <span
                  className={`text-xs ${
                    isOverLimit ? "text-red-500 font-medium" : isNearLimit ? "text-amber-500" : "text-muted-foreground"
                  }`}
                >
                  {plainTextLength.toLocaleString()} / {maxLength.toLocaleString()} characters
                </span>
              </div>
            );
          })()}
          <p className="text-xs text-muted-foreground">
            This personal touch helps customers connect with you and your story. You can use bold, lists, and links.
          </p>
        </div>

        {/* Email Address (Read-only) */}
        <div className="flex flex-col gap-y-2">
          <Label>Email Address</Label>
          <Input
            value={session?.user?.email || "Loading..."}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            Your account email address (cannot be changed here)
          </p>
        </div>

        <Separator className="my-4" />

        {/* Image Uploads */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Shop Images</h3>

          {/* Seller Image - Round (1:1 aspect ratio) */}
          <SingleImageProcessor
            onImageProcessed={handleSellerImageProcessed}
            existingImage={form.watch("sellerImage")}
            aspectRatio={1}
            label="Seller Profile Image"
            description="Upload a profile image for your shop (will be displayed as round)"
            previewClassName="w-20 h-20 rounded-full object-cover"
          />

          {/* Shop Banner Image - Wide (16:9 aspect ratio) */}
          <SingleImageProcessor
            onImageProcessed={handleBannerImageProcessed}
            existingImage={form.watch("shopBannerImage")}
            aspectRatio={16 / 9}
            label="Shop Banner Image"
            description="Upload a banner image for your shop page (wide format)"
            previewClassName="w-32 h-20 rounded object-cover"
          />

          {/* Shop Logo Image - Square (1:1 aspect ratio, small) */}
          <SingleImageProcessor
            onImageProcessed={handleLogoImageProcessed}
            existingImage={form.watch("shopLogoImage")}
            aspectRatio={1}
            label="Shop Logo Image"
            description="Upload a logo for your shop (square format)"
            previewClassName="w-16 h-16 rounded object-cover"
          />
        </div>

        <Submitbutton title="Save Shop Information" isPending={isPending} />
      </CardContent>
    </form>
  );
};

export default SellerAboutForm;
