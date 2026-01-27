"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Camera,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Image as ImageIcon,
} from "lucide-react";
import { saveHandmadeVerification } from "@/actions/onboardingActions";
import { toast } from "sonner";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import {
  SingleImageProcessor,
  SingleProcessedImage,
} from "@/components/seller/SingleImageProcessor";
import { uploadProcessedImages } from "@/lib/upload-images";

export default function HandmadeVerificationForm() {
  const router = useRouter();
  const [productPhoto, setProductPhoto] = useState<SingleProcessedImage | null>(
    null
  );
  const [workstationPhoto, setWorkstationPhoto] =
    useState<SingleProcessedImage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleContinue = async () => {
    // Validate that both photos are uploaded
    if (!productPhoto || !workstationPhoto) {
      toast.error("Please upload both photos to continue.");
      return;
    }

    // Validate that both photos have file objects
    if (!productPhoto.file || !workstationPhoto.file) {
      toast.error(
        "Please ensure both photos are properly processed before uploading."
      );
      return;
    }

    setIsSubmitting(true);
    setIsUploading(true);

    try {
      // Upload both images
      toast.loading("Uploading photos...");

      // Ensure files are proper File instances
      // imageCompression might return Blob, or files might lose their File prototype
      const ensureFile = (file: any, name: string, type: string): File => {
        // If it's already a File instance, return it
        if (file instanceof File) {
          return file;
        }

        // If it's a Blob, convert to File
        if (file instanceof Blob) {
          return new File([file], name, { type, lastModified: Date.now() });
        }

        // If it's an object with file-like properties, try to create a File from it
        // This handles cases where the file object lost its prototype
        if (
          file &&
          typeof file === "object" &&
          "size" in file &&
          "type" in file
        ) {
          // Try to get the actual file data - if it's a Blob-like object, use it directly
          // Otherwise, we need to reconstruct it (this shouldn't happen in normal flow)
          const blob = file instanceof Blob ? file : new Blob([file], { type });
          return new File([blob], name, { type, lastModified: Date.now() });
        }

        // Fallback: create a File from whatever we have
        return new File([file], name, { type, lastModified: Date.now() });
      };

      const productFile = ensureFile(
        productPhoto.file,
        productPhoto.originalName || "product-photo.jpg",
        productPhoto.file?.type || "image/jpeg"
      );

      const workstationFile = ensureFile(
        workstationPhoto.file,
        workstationPhoto.originalName || "workstation-photo.jpg",
        workstationPhoto.file?.type || "image/jpeg"
      );

      const imagesToUpload = [productFile, workstationFile];
      const { uploaded, skipped } = await uploadProcessedImages(imagesToUpload);

      // Handmade verification requires BOTH images; any skipped file is a hard fail.
      if (skipped.length > 0) {
        const reason = skipped[0]?.reason || "Unknown reason";
        throw new Error(`Photo rejected: ${reason}`);
      }

      if (uploaded.length !== 2) {
        throw new Error("Failed to upload photos");
      }

      const [productPhotoUrl, workstationPhotoUrl] = uploaded.map((u) => u.url);

      // Save the verification photos
      const result = await saveHandmadeVerification({
        productPhoto: productPhotoUrl,
        workstationPhoto: workstationPhotoUrl,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.dismiss();
      toast.success("Verification photos uploaded successfully!");
      router.push("/onboarding/create-first-product");
    } catch (error) {
      console.error("Error saving verification photos:", error);
      toast.dismiss();
      toast.error("Failed to upload photos. Please try again.");
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const handleBack = () => {
    router.push("/onboarding/shop-naming");
  };

  return (
    <div className="space-y-8">
      {/* Step Indicator */}
      <div className="w-full max-w-4xl mx-auto">
        <StepIndicator currentStep="handmade-verification" className="mb-8" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl mx-auto"
      >
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full">
                <Camera className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Verify Your Handmade Products
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Help us ensure all sellers on Yarnnu create authentic handmade
              items. Please upload photos of your products and workspace.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Product Photo Upload */}
            <div className="space-y-4">
              <Label className="text-base font-medium flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Photo of Your Product(s) *
              </Label>
              <p className="text-sm text-gray-600">
                Upload a clear photo showing one or more of your handmade
                products. This helps verify that you create authentic handmade
                items.
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <SingleImageProcessor
                  onImageProcessed={(image) => setProductPhoto(image)}
                  label="Product Photo"
                  description="Upload a photo of your handmade product(s)"
                  aspectRatio={4 / 3}
                  previewClassName="w-full h-64 rounded-lg object-cover"
                />
              </div>
            </div>

            {/* Workstation Photo Upload */}
            <div className="space-y-4">
              <Label className="text-base font-medium flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Photo of Your Work Station *
              </Label>
              <p className="text-sm text-gray-600">
                Upload a photo of your workspace where you create your handmade
                items. This could be your craft table, studio, or any area where
                you work.
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <SingleImageProcessor
                  onImageProcessed={(image) => setWorkstationPhoto(image)}
                  label="Work Station Photo"
                  description="Upload a photo of your work station"
                  aspectRatio={4 / 3}
                  previewClassName="w-full h-64 rounded-lg object-cover"
                />
              </div>
            </div>

            {/* Summary */}
            {productPhoto && workstationPhoto && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-purple-50 border border-purple-200 rounded-lg p-4"
              >
                <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Ready to Submit:
                </h3>
                <div className="space-y-1">
                  <p className="text-sm text-purple-800">
                    <strong>Product Photo:</strong> Uploaded ✓
                  </p>
                  <p className="text-sm text-purple-800">
                    <strong>Work Station Photo:</strong> Uploaded ✓
                  </p>
                </div>
              </motion.div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Why we need these photos:</strong> We want to ensure all
                sellers on Yarnnu create authentic handmade items. These photos
                help us verify that you&apos;re a real maker creating genuine
                handmade products. Your photos will be kept private and only
                used for verification purposes.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex items-center gap-2"
                disabled={isSubmitting}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              <Button
                onClick={handleContinue}
                disabled={isSubmitting || !productPhoto || !workstationPhoto}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-2"
              >
                {isSubmitting ? (
                  "Uploading..."
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
