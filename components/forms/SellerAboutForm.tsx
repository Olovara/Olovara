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
import { useState, useEffect } from "react";
import { useIsClient } from "@/hooks/use-is-client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Spinner from "@/components/spinner";
import { SellerAboutSchema } from "@/schemas/SellerAboutSchema";
import { updateSellerAbout, getSellerAbout } from "@/actions/sellerAboutActions";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { UploadButton } from "@uploadthing/react";
import { ourFileRouter } from "@/app/api/uploadthing/core";
import Image from "next/image";
import { useSession } from "next-auth/react";

const SellerAboutForm = () => {
  const isClient = useIsClient();
  const { data: session } = useSession();
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isPending, setIsPending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<z.infer<typeof SellerAboutSchema>>({
    resolver: zodResolver(SellerAboutSchema),
    defaultValues: {
      shopName: "",
      shopTagLine: "",
      shopDescription: "",
      shopAnnouncement: "",
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

  const onSubmit = async (values: z.infer<typeof SellerAboutSchema>) => {
    try {
      console.log("Form submission started with values:", values);
      setIsPending(true);
      setError("");
      setSuccess("");

      const result = await updateSellerAbout(values);
      console.log("Form submission result:", result);

      if (result.error) {
        toast.error(result.error);
        throw new Error(result.error);
      }

      toast.success(result.message || "Successfully saved your shop information.");
    } catch (error) {
      console.error("Error submitting form:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save shop information";
      toast.error(errorMessage);
    } finally {
      setIsPending(false);
    }
  };

  const removeImage = (field: keyof z.infer<typeof SellerAboutSchema>) => {
    form.setValue(field, undefined);
  };

  if (!isClient || isLoading) return <Spinner />;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <CardHeader>
        <CardTitle>About Your Shop</CardTitle>
        <CardDescription>
          Tell customers about your shop and upload images to make it stand out
        </CardDescription>
      </CardHeader>
      
      {/* Debug form errors */}
      {Object.keys(form.formState.errors).length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h4 className="text-sm font-medium text-red-800 mb-2">Form Validation Errors:</h4>
          <ul className="text-sm text-red-700 space-y-1">
            {Object.entries(form.formState.errors).map(([field, error]) => (
              <li key={field}>
                <strong>{field}:</strong> {error?.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      <CardContent className="flex flex-col gap-y-6">
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

        <Separator className="my-4" />

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
          {/* Seller Image */}
          <div className="flex flex-col gap-y-2">
            <Label>Seller Profile Image</Label>
            <div className="flex items-center gap-4">
              {(() => {
                const sellerImage = form.watch("sellerImage");
                return sellerImage ? (
                  <div className="relative">
                    <Image 
                      src={sellerImage} 
                      alt="Seller profile" 
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 w-6 h-6 p-0"
                      onClick={() => removeImage("sellerImage")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center">
                    <Upload className="h-6 w-6 text-gray-400" />
                  </div>
                );
              })()}
              <div className="flex-1">
                <UploadButton<typeof ourFileRouter, 'singleImageUploader'>
                  endpoint="singleImageUploader"
                  onClientUploadComplete={(res) => {
                    if (res && res[0]) {
                      const fileUrl = res[0].url || res[0].ufsUrl;
                      form.setValue("sellerImage", fileUrl);
                      toast.success("Profile image uploaded!");
                    }
                  }}
                  onUploadError={(error) => {
                    toast.error(error.message);
                  }}
                  appearance={{
                    button: "w-full mt-2",
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload a profile image for your shop
                </p>
              </div>
            </div>
          </div>

          {/* Shop Banner Image */}
          <div className="flex flex-col gap-y-2">
            <Label>Shop Banner Image</Label>
            <div className="flex items-center gap-4">
              {(() => {
                const shopBannerImage = form.watch("shopBannerImage");
                return shopBannerImage ? (
                  <div className="relative">
                    <Image 
                      src={shopBannerImage} 
                      alt="Shop banner" 
                      width={128}
                      height={80}
                      className="w-32 h-20 rounded object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 w-6 h-6 p-0"
                      onClick={() => removeImage("shopBannerImage")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-32 h-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                    <Upload className="h-6 w-6 text-gray-400" />
                  </div>
                );
              })()}
              <div className="flex-1">
                <UploadButton<typeof ourFileRouter, 'singleImageUploader'>
                  endpoint="singleImageUploader"
                  onClientUploadComplete={(res) => {
                    if (res && res[0]) {
                      const fileUrl = res[0].url || res[0].ufsUrl;
                      form.setValue("shopBannerImage", fileUrl);
                      toast.success("Banner image uploaded!");
                    }
                  }}
                  onUploadError={(error) => {
                    toast.error(error.message);
                  }}
                  appearance={{
                    button: "w-full mt-2",
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload a banner image for your shop page
                </p>
              </div>
            </div>
          </div>

          {/* Shop Logo Image */}
          <div className="flex flex-col gap-y-2">
            <Label>Shop Logo Image</Label>
            <div className="flex items-center gap-4">
              {(() => {
                const shopLogoImage = form.watch("shopLogoImage");
                return shopLogoImage ? (
                  <div className="relative">
                    <Image 
                      src={shopLogoImage} 
                      alt="Shop logo" 
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 w-6 h-6 p-0"
                      onClick={() => removeImage("shopLogoImage")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                    <Upload className="h-6 w-6 text-gray-400" />
                  </div>
                );
              })()}
              <div className="flex-1">
                <UploadButton<typeof ourFileRouter, 'singleImageUploader'>
                  endpoint="singleImageUploader"
                  onClientUploadComplete={(res) => {
                    if (res && res[0]) {
                      const fileUrl = res[0].url || res[0].ufsUrl;
                      form.setValue("shopLogoImage", fileUrl);
                      toast.success("Logo uploaded!");
                    }
                  }}
                  onUploadError={(error) => {
                    toast.error(error.message);
                  }}
                  appearance={{
                    button: "w-full mt-2",
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload a logo for your shop
                </p>
              </div>
            </div>
          </div>
        </div>

        <Submitbutton title="Save Shop Information" isPending={isPending} />
      </CardContent>
    </form>
  );
};

export default SellerAboutForm; 