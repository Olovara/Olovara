"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Package,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";

import { createFirstProduct } from "@/actions/onboardingActions";
import { toast } from "sonner";
import { EEA_COUNTRIES } from "@/lib/gpsr-compliance";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StepIndicator } from "@/components/onboarding/StepIndicator";

// Import the same components as the main product form
import { ProductInfoSection } from "@/components/product/productInformation";
import { ProductPhotosSection } from "@/components/product/productPhotos";
import { ProductOptionsSection } from "@/components/product/productOptions";
import { ProductShippingSection } from "@/components/product/productShipping";
import { ProductInventorySection } from "@/components/product/productInventory";
import { ProductHowItsMadeSection } from "@/components/product/productHowMade";
import { ProductFileSection, ProcessedFile } from "@/components/product/productFile";

// Create a simplified schema that matches the product components but excludes advanced features
const FirstProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(100),
  sku: z.string().optional(),
  shortDescription: z.string().optional().default(""),
  description: z.object({
    html: z.string().optional().default(""),
    text: z.string().optional().default(""),
  }).refine(
    (data) => data.html?.trim() || data.text?.trim(),
    {
      message: "Description is required",
      path: ["text"], // Show error on text field
    }
  ),
  options: z
    .array(
      z.object({
        label: z.string().min(1, "Option label is required"),
        values: z.array(
          z.object({
            name: z.string().min(1, "Option value name is required"),
            price: z.number().min(0, "Price must be non-negative"),
            stock: z.number().int().min(0, "Stock must be non-negative").default(0),
          })
        ).min(1, "At least one option value is required"),
      })
    )
    .nullable()
    .optional(),
  price: z.number().min(0.01, "Price must be greater than 0"),
  currency: z.string().default("USD"),
  status: z.string().default("draft"),
  images: z.array(z.string().url()).min(1, "Please add at least one image."),
  isDigital: z.boolean().default(false),
  shippingCost: z.number().min(0).default(0),
  handlingFee: z.number().min(0).default(0),
  stock: z.number().int().min(1).optional(),
  productFile: z.string().nullable().optional(),
  numberSold: z.number().int().optional().default(0),
  primaryCategory: z.string().min(1, "Primary category is required"),
  secondaryCategory: z.string().min(1, "Secondary category is required"),
  tertiaryCategory: z.string().optional(),
  tags: z.array(z.string()).default([]),
  materialTags: z.array(z.string()).default([]),
  itemWeight: z.number().optional(),
  itemLength: z.number().optional(),
  itemWidth: z.number().optional(),
  itemHeight: z.number().optional(),
  weightUnit: z.string().default("lbs"),
  dimensionUnit: z.string().default("in"),
  processingTime: z.string().default("3-5"),
  careInstructions: z.string().optional(),
  howItsMade: z.string().optional(),
  story: z.string().optional(),
  materials: z.string().optional(),
  techniques: z.string().optional(),
  tools: z.string().optional(),
  timeToMake: z.string().optional(),
  skillLevel: z.string().optional(),
  freeShipping: z.boolean().default(false),
  shippingOptionId: z.string().optional(),
  // Add missing fields that ProductSchema expects
  itemWeightUnit: z.string().default("lbs"),
  itemDimensionUnit: z.string().default("in"),
  shippingNotes: z.string().optional(),
  inStockProcessingTime: z.number().optional(),
  outStockLeadTime: z.number().optional(),
  productDrop: z.boolean().default(false),
  dropDate: z.string().nullable().optional(),
  dropTime: z.string().optional(),
  discountEndDate: z.string().optional(),
  discountEndTime: z.string().optional(),
  isTestProduct: z.boolean().default(false),
  taxCategory: z
    .enum([
      "PHYSICAL_GOODS",
      "DIGITAL_GOODS",
      "SERVICES",
      "SHIPPING",
      "HANDLING",
    ])
    .default("PHYSICAL_GOODS"),
  taxCode: z.string().optional(),
  taxExempt: z.boolean().default(false),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  safetyWarnings: z.string().optional(),
  materialsComposition: z.string().optional(),
  safeUseInstructions: z.string().optional(),
  ageRestriction: z.string().optional(),
  chokingHazard: z.boolean().default(false),
  smallPartsWarning: z.boolean().default(false),
  chemicalWarnings: z.string().optional(),
  onSale: z.boolean().default(false),
  discount: z.number().int().optional(),
  NSFW: z.boolean().default(false),
}).superRefine((data, ctx) => {
  // Validate product drop fields when productDrop is true
  if (data.productDrop) {
    if (!data.dropDate || (typeof data.dropDate === "string" && data.dropDate.trim() === "")) {
      ctx.addIssue({
        code: "custom",
        message: "Drop date is required for product drops.",
        path: ["dropDate"],
      });
    }
    if (!data.dropTime || data.dropTime.trim() === "") {
      ctx.addIssue({
        code: "custom",
        message: "Drop time is required for product drops.",
        path: ["dropTime"],
      });
    }
  }

  // Validate discount fields when onSale is true
  if (data.onSale) {
    if (data.discount === undefined || data.discount === null) {
      ctx.addIssue({
        code: "custom",
        message: "Discount is required when the product is on sale.",
        path: ["discount"],
      });
    }
    if (!data.discountEndDate || (typeof data.discountEndDate === "string" && data.discountEndDate.trim() === "")) {
      ctx.addIssue({
        code: "custom",
        message: "Discount end date is required when the product is on sale.",
        path: ["discountEndDate"],
      });
    }
    if (!data.discountEndTime || data.discountEndTime.trim() === "") {
      ctx.addIssue({
        code: "custom",
        message: "Discount end time is required when the product is on sale.",
        path: ["discountEndTime"],
      });
    }
  }
});

type FirstProductFormValues = z.infer<typeof FirstProductSchema>;

// This is the type expected by the ProductOptionsSection component
type DropdownOption = {
  label: string;
  values: { name: string; price?: number; stock: number }[];
};

export default function CreateFirstProductForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sellerCountry, setSellerCountry] = useState<string>("");

  // State for form components (same as main product form)
  const [description, setDescription] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [materialTags, setMaterialTags] = useState<string[]>([]);
  const [shortDescriptionBullets, setShortDescriptionBullets] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [tempImages, setTempImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [tempUploadsCreated, setTempUploadsCreated] = useState(false);
  const [processedFile, setProcessedFile] = useState<ProcessedFile | null>(null);
  const [dropdownOptions, setDropdownOptions] = useState<DropdownOption[]>([]);

  const form = useForm<FirstProductFormValues>({
    resolver: zodResolver(FirstProductSchema),
    defaultValues: {
      name: "",
      sku: "",
      shortDescription: "",
      description: { html: "", text: "" },
      options: null,
      price: 0,
      currency: "USD",
      status: "draft",
      images: [],
      isDigital: false,
      shippingCost: 0,
      handlingFee: 0,
      stock: undefined,
      productFile: null,
      numberSold: 0,
      primaryCategory: "",
      secondaryCategory: "",
      tertiaryCategory: "",
      tags: [],
      materialTags: [],
      itemWeight: undefined,
      itemLength: undefined,
      itemWidth: undefined,
      itemHeight: undefined,
      weightUnit: "lbs",
      dimensionUnit: "in",
      processingTime: "3-5",
      careInstructions: "",
      howItsMade: "",
      story: "",
      materials: "",
      techniques: "",
      tools: "",
      timeToMake: "",
      skillLevel: "",
      freeShipping: false,
      shippingOptionId: "",
      productDrop: false,
      dropDate: null,
      dropTime: "",
      discountEndDate: "",
      discountEndTime: "",
      isTestProduct: false,
      taxCategory: "PHYSICAL_GOODS",
      taxExempt: false,
      onSale: false,
      discount: undefined,
      NSFW: false,
      chokingHazard: false,
      smallPartsWarning: false,
    },
  });

  const { watch, setValue } = form;
  const isDigital = watch("isDigital");
  const freeShipping = watch("freeShipping");

  // Sync description state to form (similar to ProductForm)
  useEffect(() => {
    // Always update the form value with both html and text versions
    form.setValue(
      "description",
      {
        html: description || "",
        text: description ? description.replace(/<[^>]*>?/gm, "") : "",
      },
      { shouldValidate: false } // Don't trigger validation on sync
    );
  }, [description, form, setValue]);

  // Sync images to form
  useEffect(() => {
    form.setValue("images", images, { shouldValidate: false });
  }, [images, form, setValue]);

  // Helper function to retry API calls
  const fetchWithRetry = async (
    url: string,
    options: RequestInit = {},
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<Response> => {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) {
          return response;
        }
        // If response is not ok, throw to trigger retry
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry on the last attempt
        if (attempt < maxRetries) {
          const waitTime = delay * attempt; // Exponential backoff
          console.warn(
            `Failed to fetch ${url} (attempt ${attempt}/${maxRetries}), retrying in ${waitTime}ms...`,
            error
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }
    
    // All retries failed, throw the last error
    throw lastError || new Error("Failed to fetch after all retries");
  };

  // Fetch seller's country and preferences
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch seller country with retry
        try {
          const countryResponse = await fetchWithRetry("/api/seller/country");
          const countryData = await countryResponse.json();
          setSellerCountry(countryData.country);
        } catch (error) {
          console.error("Error fetching seller country after retries:", error);
        }

        // Fetch seller preferences to set default currency with retry
        try {
          const preferencesResponse = await fetchWithRetry("/api/seller/preferences");
          const preferences = await preferencesResponse.json();
          if (preferences?.preferredCurrency) {
            form.setValue("currency", preferences.preferredCurrency);
          }
        } catch (error) {
          console.error("Error fetching seller preferences after retries:", error);
          console.warn("Using default currency (USD) due to fetch failure");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [form]);

  // Check if seller is in EU/EEA
  const isSellerInEU =
    sellerCountry && EEA_COUNTRIES.includes(sellerCountry.toUpperCase());

  const handleSubmit = async (data: any) => {
    console.log("[CreateFirstProduct] Form submitted with data:", data);
    console.log("[CreateFirstProduct] Form values:", form.getValues());
    console.log("[CreateFirstProduct] Form errors:", form.formState.errors);
    setIsSubmitting(true);

    try {
      const result = await createFirstProduct({
        name: data.name.trim(),
        category: data.primaryCategory, // Keep using category for backward compatibility
        description: data.description?.text || data.description?.html || "",
        shortDescription: data.shortDescription || "",
        shortDescriptionBullets: shortDescriptionBullets,
        price: data.price,
        materials: materialTags.join(", "),
        dimensions: "",
        weight: "",
        processingTime: data.processingTime,
        isDigital: data.isDigital,
        freeShipping: data.freeShipping,
        shippingCost: data.shippingCost,
        shippingOptionId: data.shippingOptionId,
      });

      console.log("[CreateFirstProduct] Result:", result);

      if (result.error) {
        toast.error(result.error);
        setIsSubmitting(false);
        return;
      }

      // Show appropriate message based on product status
      if (result.isDraft) {
        toast.success("Product created as draft! Complete onboarding to activate it.");
      } else {
        toast.success("Product created successfully!");
      }
      
      router.push("/onboarding/payment-setup");
    } catch (error) {
      console.error("Error creating first product:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form validation errors
  const handleSubmitError = (errors: any) => {
    console.error("[CreateFirstProduct] Form validation errors:", errors);
    
    // Get all error messages
    const errorMessages: string[] = [];
    Object.entries(errors).forEach(([field, error]: [string, any]) => {
      if (error?.message) {
        // Format field name to be more readable
        const fieldName = field
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase())
          .trim();
        errorMessages.push(`${fieldName}: ${error.message}`);
      }
    });

    if (errorMessages.length > 0) {
      // Show first error, or all if there are multiple
      if (errorMessages.length === 1) {
        toast.error(errorMessages[0]);
      } else {
        toast.error(`Please fix the following: ${errorMessages.join(", ")}`);
      }
    } else {
      toast.error("Please fill in all required fields");
    }
  };

  const handleBack = () => {
    router.push("/onboarding/shop-naming");
  };

  const handleSkip = () => {
    router.push("/onboarding/payment-setup");
  };

  return (
    <div className="space-y-8 w-full">
      {/* Step Indicator */}
      <div className="w-full max-w-4xl mx-auto">
        <StepIndicator currentStep="create-first-product" className="mb-8" />
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl mx-auto"
      >
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm w-full max-w-full min-w-0 overflow-hidden">
          <CardHeader className="text-center pb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full">
                <Package className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Create Your First Product
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 max-w-2xl mx-auto">
              Let&apos;s get you started! Create your first product listing to
              begin your selling journey.
            </CardDescription>
          </CardHeader>

                     <CardContent className="space-y-8 w-full min-w-0 max-w-full">
             <FormProvider {...form}>
               <form
                 onSubmit={form.handleSubmit(handleSubmit, handleSubmitError)}
                 className="space-y-8 w-full min-w-0 max-w-full"
               >
              {/* Basic Information Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full min-w-0">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Basic Information
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Essential product details that customers will see first
                  </p>
                </div>
                <div className="p-6 space-y-6 w-full min-w-0 max-w-full">
                  <ProductInfoSection
                    form={form as any}
                    description={description}
                    setDescription={setDescription}
                    tags={tags}
                    setTags={setTags}
                    materialTags={materialTags}
                    setMaterialTags={setMaterialTags}
                    shortDescriptionBullets={shortDescriptionBullets}
                    setShortDescriptionBullets={setShortDescriptionBullets}
                    showAdvancedOptions={false}
                  />
                </div>
              </div>

              {/* Media Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Media & Visuals
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Images and files that showcase your product
                  </p>
                </div>
                <div className="p-6 space-y-6">
                  <ProductPhotosSection
                    images={images}
                    setImages={setImages}
                    setTempImages={setTempImages}
                    tempImages={tempImages}
                    form={form as any}
                    setTempUploadsCreated={setTempUploadsCreated}
                  />

                  <ProductFileSection
                    form={form as any}
                    processedFile={processedFile}
                    setProcessedFile={setProcessedFile}
                    existingFileUrl={null}
                  />
                </div>
              </div>

              {/* Inventory & Options Section - Hidden for digital products */}
              {!isDigital && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      Inventory & Options
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Stock levels, variants, and product options
                    </p>
                  </div>
                  <div className="p-6 space-y-6">
                    <ProductInventorySection 
                      form={form as any} 
                      showAdvancedOptions={false}
                    />
                  </div>
                </div>
              )}

              {/* Shipping & Dimensions Section - Hidden for digital products */}
              {!isDigital && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      Shipping & Dimensions
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Shipping costs, dimensions, and handling information
                    </p>
                  </div>
                  <div className="p-6 space-y-6">
                    <ProductShippingSection
                      form={form as any}
                      freeShipping={freeShipping}
                      showAdvancedOptions={false}
                    />
                  </div>
                </div>
              )}

              {/* Story & Details Section - Hidden in onboarding */}
              {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Story & Details
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Tell customers about your product and how it&apos;s made
                  </p>
                </div>
                <div className="p-6 space-y-6">
                  <ProductHowItsMadeSection form={form as any} />
                </div>
              </div> */}

              {/* EU Compliance Alert */}
              {isSellerInEU && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Selling to EU buyers?</strong> You&apos;ll need to
                    provide GPSR product safety details before your products can
                    go live in those countries. You can still sell elsewhere
                    without this step.
                  </AlertDescription>
                </Alert>
              )}

              {/* Tips */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Pro Tips for Your First Product
                </h3>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>
                    • Use clear, high-quality photos to showcase your product
                  </li>
                  <li>• Be honest about materials and craftsmanship</li>
                  <li>• Include all relevant measurements and details</li>
                  <li>• Set a realistic processing time</li>
                  <li>
                    • Price competitively but don&apos;t undervalue your work
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSkip}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Skip for now
                  </Button>

                  <Button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !form.watch("name")?.trim() ||
                      !form.watch("primaryCategory") ||
                      !form.watch("secondaryCategory") ||
                      (!form.watch("description")?.text?.trim() && !form.watch("description")?.html?.trim()) ||
                      !form.watch("price") ||
                      images.length === 0
                    }
                    onClick={(e) => {
                      // Prevent double submission
                      if (isSubmitting) {
                        e.preventDefault();
                        return;
                      }
                      // Log for debugging
                      console.log("[CreateFirstProduct] Button clicked");
                      console.log("[CreateFirstProduct] Form state:", {
                        name: form.watch("name"),
                        primaryCategory: form.watch("primaryCategory"),
                        secondaryCategory: form.watch("secondaryCategory"),
                        description: form.watch("description"),
                        price: form.watch("price"),
                        images: images.length,
                        errors: form.formState.errors,
                      });
                    }}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-2"
                  >
                    {isSubmitting ? (
                      "Creating..."
                    ) : (
                      <>
                        Create Product
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
                             </div>
             </form>
           </FormProvider>
         </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
