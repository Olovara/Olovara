"use client";

import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { ProductSchema } from "@/schemas/ProductSchema";
import { 
  SUPPORTED_CURRENCIES, 
  SUPPORTED_WEIGHT_UNITS, 
  SUPPORTED_DIMENSION_UNITS,
  CurrencyCode,
  WeightUnit,
  DimensionUnit 
} from "@/data/units";
import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import { Submitbutton } from "../SubmitButtons";
import { useIsClient } from "@/hooks/use-is-client";
import Spinner from "../spinner";
import { ProductInfoSection } from "../product/productInformation";
import { ProductPhotosSection } from "../product/productPhotos";
import { ProductOptionsSection } from "../product/productOptions";
import { ProductShippingSection } from "../product/productShipping";
import { ProductDiscountSection } from "../product/productDiscount";
import { ProductDropSection } from "../product/productDrop";
import { ProductInventorySection } from "../product/productInventory";
import { ProductHowItsMadeSection } from "../product/productHowMade";
import { useRouter, usePathname } from "next/navigation";
import { ProductFileSection } from "../product/productFile";
import { cleanupTempUploads } from "@/actions/cleanup-temp-uploads";
import { checkSellerApproval } from "@/actions/check-seller-approval";
import { getSellerPreferences } from "@/actions/getSellerPreferences";
import { useTestEnvironment } from "@/hooks/useTestEnvironment";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

type ProductFormValues = z.infer<typeof ProductSchema> & {
  id?: string;
};

type ProductFormProps = {
  initialData?: ProductFormValues | null; // Null when creating
};

// This is the type expected by the ProductOptionsSection component
type DropdownOption = {
  label: string;
  values: { name: string; stock: number }[];
};

// This is the type defined in the schema
type SchemaOption = {
  name: string;
  value: string;
};

export function ProductForm({ initialData }: ProductFormProps) {
  console.log('[DEBUG] ProductForm - Initial data:', initialData);
  
  const [description, setDescription] = useState<string>(
    initialData?.description?.html || ""
  );
  const [tags, setTags] = useState<string[]>(
    initialData?.tags || []
  );
  const [materialTags, setMaterialTags] = useState<string[]>(
    initialData?.materialTags || []
  );
  const [images, setImages] = useState<string[]>(
    initialData?.images || []
  );
  const [tempImages, setTempImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Add state to track when temporary uploads are created
  const [tempUploadsCreated, setTempUploadsCreated] = useState(false);
  
  // Add a ref to track if form was submitted successfully
  const formSubmittedRef = useRef(false);
  
  // Update images state when initialData changes
  useEffect(() => {
    if (initialData?.images && Array.isArray(initialData.images)) {
      console.log('[DEBUG] Updating images state with initialData.images:', initialData.images);
      setImages(initialData.images);
    }
  }, [initialData]);
  
  // Convert schema options to dropdown options format
  const convertOptions = (schemaOptions: SchemaOption[] | null | undefined): DropdownOption[] => {
    if (!schemaOptions) return [];
    
    // Group options by name
    const groupedOptions = schemaOptions.reduce((acc, option) => {
      if (!acc[option.name]) {
        acc[option.name] = [];
      }
      acc[option.name].push({ name: option.value, stock: 0 });
      return acc;
    }, {} as Record<string, { name: string; stock: number }[]>);
    
    // Convert to DropdownOption format
    return Object.entries(groupedOptions).map(([label, values]) => ({
      label,
      values
    }));
  };
  
  const [dropdownOptions, setDropdownOptions] = useState<DropdownOption[]>(
    convertOptions(initialData?.options as SchemaOption[] | null | undefined)
  );
  const isClient = useIsClient();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [tempFiles, setTempFiles] = useState<string[]>([]); // Track new file uploads
  const [isSellerApproved, setIsSellerApproved] = useState<boolean | null>(null);
  const [isPending, startTransition] = useTransition();
  const [sellerPreferences, setSellerPreferences] = useState({
    preferredCurrency: "USD" as CurrencyCode,
    preferredWeightUnit: "lbs" as WeightUnit,
    preferredDimensionUnit: "in" as DimensionUnit,
  });

  const { canAccessTest, loading: testAccessLoading } = useTestEnvironment();

  const form = useForm<z.infer<typeof ProductSchema>>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      name: initialData?.name || "",
      sku: initialData?.sku || "",
      price: initialData?.price ? initialData.price / 100 : 0,
      description: initialData?.description || { html: "", text: "" },
      images: initialData?.images || [],
      freeShipping: initialData?.freeShipping || false,
      handlingFee: initialData?.handlingFee ? initialData.handlingFee / 100 : 0,
      shippingCost: initialData?.shippingCost ? initialData.shippingCost / 100 : 0,
      itemWeight: initialData?.itemWeight || 0,
      itemWeightUnit: initialData?.itemWeightUnit || sellerPreferences.preferredWeightUnit,
      itemLength: initialData?.itemLength || 0,
      itemWidth: initialData?.itemWidth || 0,
      itemHeight: initialData?.itemHeight || 0,
      itemDimensionUnit: initialData?.itemDimensionUnit || sellerPreferences.preferredDimensionUnit,
      shippingNotes: initialData?.shippingNotes || "",
      status: initialData?.status || "HIDDEN",
      isDigital: initialData?.isDigital || false,
      primaryCategory: initialData?.primaryCategory || "",
      secondaryCategory: initialData?.secondaryCategory || "",
      tertiaryCategory: initialData?.tertiaryCategory || "",
      stock: initialData?.stock || 0,
      inStockProcessingTime: initialData?.inStockProcessingTime || 0,
      outStockLeadTime: initialData?.outStockLeadTime || 0,
      productDrop: initialData?.productDrop || false,
      dropDate: initialData?.dropDate || null,
      dropTime: initialData?.dropTime || "",
      discountEndDate: initialData?.discountEndDate || undefined,
      discountEndTime: initialData?.discountEndTime || "",
      howItsMade: initialData?.howItsMade || "",
      productFile: initialData?.productFile || null,
      currency: initialData?.currency || sellerPreferences.preferredCurrency,
      isTestProduct: initialData?.isTestProduct || false,
    }
  });

  // Add this console log to verify form initialization
  console.log("Form initialized with:", form);
  console.log("Form default values:", form.getValues());

  const formState = form.formState;
  console.log("Form state:", formState);

  const { setValue } = form;

  // Add this useEffect to monitor form errors
  useEffect(() => {
    if (Object.keys(formState.errors).length > 0) {
      console.log("Form errors:", formState.errors);
    }
  }, [formState.errors]);

  // Add this useEffect to sync images with form state
  useEffect(() => {
    console.log('[DEBUG] ProductForm - Current images state:', images);
    setValue('images', images);
  }, [images, setValue]);

  // Ensure shipping cost is 0 when free shipping is enabled
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'freeShipping' && value.freeShipping) {
        setValue('shippingCost', 0);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, setValue]);

  // Update the description handling useEffect
  useEffect(() => {
    if (description) {
      // Update the form value with the proper structure
      form.setValue('description', {
        html: description,
        text: description.replace(/<[^>]*>?/gm, '')
      });
    }
  }, [description, form]);

  // Update the form watch for description
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'description' && value.description) {
        // Only update if the description has changed
        if (value.description.html !== description) {
          setDescription(value.description.html || ""); // Add fallback for undefined
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, description]);

  const cleanupTempImages = useCallback(async () => {
    // Only clean up if the form was submitted successfully
    if (tempImages.length > 0 && formSubmittedRef.current) {
      try {
        // For component unmount cleanup, we don't have a product ID yet
        const result = await cleanupTempUploads("", tempImages);
        console.log('[DEBUG] Cleanup result:', result);
        setTempImages([]); // Clear the temp images after cleanup
      } catch (error) {
        console.error('Error cleaning up temporary images:', error);
      }
    }
  }, [tempImages]);

  useEffect(() => {
    return () => {
      void cleanupTempImages();
    };
  }, [cleanupTempImages]);

  // Update the beforeunload handler
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty || tempImages.length > 0) {
        e.preventDefault();
        // Modern browsers ignore the return value, but we still need to call preventDefault()
        return "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [form.formState.isDirty, tempImages]);

  useEffect(() => {
    const checkApproval = async () => {
      const approved = await checkSellerApproval();
      setIsSellerApproved(approved);
    };

    void checkApproval();
  }, []);

  const onSubmit = async (data: ProductFormValues) => {
    try {
      setIsLoading(true);
      console.log("[DEBUG] Submitting form with data:", data);

      // The schema already handles the conversion to cents
      const formData = {
        ...data,
        // Remove these conversions since they're handled by the schema
        // price: Math.round(data.price * 100),
        // shippingCost: Math.round(data.shippingCost * 100),
        // handlingFee: Math.round(data.handlingFee * 100),
      };

      console.log("[DEBUG] Form data after conversion:", formData);

      const response = await fetch(initialData ? `/api/products/${initialData.id}` : "/api/products/create-product", {
        method: initialData ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to save product");
      }

      // After successful product creation/update, call the cleanup server action
      if (responseData.product && responseData.product.id) {
        console.log('[DEBUG] Product created/updated successfully, cleaning up temporary uploads');
        
        // Set the flag to indicate successful submission
        formSubmittedRef.current = true;
        
        // Prepare the URLs for cleanup
        const urlsToCleanup = [...images];
        if (data.productFile) {
          urlsToCleanup.push(data.productFile);
        }
        
        // Call the cleanup server action with the product ID
        const cleanupResult = await cleanupTempUploads(responseData.product.id, urlsToCleanup);
        console.log('[DEBUG] Cleanup result:', cleanupResult);
        
        if (!cleanupResult.success) {
          console.error('[ERROR] Cleanup failed:', cleanupResult.error);
        }
      }

      // Only navigate if the update was successful
      router.replace("/seller/dashboard/products");
      router.refresh();
      
      toast.success(initialData ? "Product updated" : "Product created");
      setTempImages([]); // Clear temp images after successful submission
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const resetExternalStates = () => {
    setDescription("");
    setDropdownOptions([]);
    setImages([]);
    setTags([]);
    setMaterialTags([]);
    form.reset({
      name: "",
      sku: "",
      price: 0,
      description: { html: "", text: "" },
      images: [],
      freeShipping: false,
      handlingFee: 0,
      shippingCost: 0,
      itemWeight: 0,
      itemLength: 0,
      itemWidth: 0,
      itemHeight: 0,
      shippingNotes: "",
      status: "HIDDEN",
      isDigital: false,
      primaryCategory: "",
      secondaryCategory: "",
      tertiaryCategory: "",
      stock: 0,
      inStockProcessingTime: 0,
      outStockLeadTime: 0,
      productDrop: false,
      dropDate: null,
      dropTime: "",
      discountEndDate: undefined,
      discountEndTime: "",
      howItsMade: "",
      productFile: null,
      isTestProduct: false,
    });
  };

  const freeShipping = useWatch({
    control: form.control,
    name: "freeShipping",
  });

  if (!isClient) return <Spinner />;

  // Show loading state while checking approval
  if (isSellerApproved === null) {
    return <Spinner />;
  }

  if (!isSellerApproved) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Application Pending</h2>
        <p className="text-gray-600 text-center max-w-md">
          Your seller application is still pending approval. You can set up your shop profile, but you won&apos;t be able to create products until your application is approved.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Product Information Section */}
        <ProductInfoSection
          form={form}
          description={description}
          setDescription={setDescription}
          tags={tags}
          setTags={setTags}
          materialTags={materialTags}
          setMaterialTags={setMaterialTags}
        />

        {/* Product Photos Section */}
        <ProductPhotosSection
          images={images}
          setImages={setImages}
          setTempImages={setTempImages}
          tempImages={tempImages}
          form={form}
          setTempUploadsCreated={setTempUploadsCreated}
        />

        {/* Product Options Section */}
        <ProductOptionsSection
          dropdownOptions={dropdownOptions}
          setDropdownOptions={setDropdownOptions}
        />

        {/* Product Inventory Section */}
        <ProductInventorySection form={form} />

        {/* Product How It's Made Section */}
        <ProductHowItsMadeSection form={form} />

        {/* Product Shipping Section */}
        <ProductShippingSection form={form} freeShipping={freeShipping} />

        {/* Product File Section */}
        <ProductFileSection 
          form={form} 
          tempFiles={tempFiles} 
          setTempFiles={setTempFiles}
          setTempUploadsCreated={setTempUploadsCreated}
        />

        {/* Product Discount Section */}
        <ProductDiscountSection form={form} />

        {/* Product Drop Section */}
        <ProductDropSection form={form} />

        {canAccessTest && (
          <div className="space-y-2">
            <Label htmlFor="isTestProduct">Test Product</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isTestProduct"
                checked={form.watch("isTestProduct") || false}
                onCheckedChange={(checked) => form.setValue("isTestProduct", checked as boolean)}
              />
              <Label htmlFor="isTestProduct" className="text-sm font-normal">
                Mark as test product (only visible to test users)
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Test products are only visible to users with test environment access.
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Submitbutton 
          title={initialData ? "Update Product" : "Create Product"} 
          isPending={isLoading} 
        />
      </form>
    </Form>
  );
}