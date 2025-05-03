"use client";

import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { ProductSchema } from "@/schemas/ProductSchema";
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

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      name: initialData?.name || "",
      price: initialData?.price || 0,
      description: initialData?.description || { html: "", text: "" },
      images: initialData?.images || [],
      freeShipping: initialData?.freeShipping || false,
      handlingFee: initialData?.handlingFee || 0,
      shippingCost: initialData?.shippingCost || 0,
      itemWeight: initialData?.itemWeight || 0,
      itemLength: initialData?.itemLength || 0,
      itemWidth: initialData?.itemWidth || 0,
      itemHeight: initialData?.itemHeight || 0,
      shippingNotes: initialData?.shippingNotes || "",
      status: initialData?.status || "HIDDEN",
      isDigital: initialData?.isDigital || false,
      primaryCategory: initialData?.primaryCategory || "",
      secondaryCategory: initialData?.secondaryCategory || "",
      stock: initialData?.stock || 0,
      inStockProcessingTime: initialData?.inStockProcessingTime || 0,
      outStockLeadTime: initialData?.outStockLeadTime || 0,
      productDrop: initialData?.productDrop || false,
      dropDate: initialData?.dropDate || null,
      discountEndDate: initialData?.discountEndDate || undefined,
      howItsMade: initialData?.howItsMade || "",
      productFile: initialData?.productFile || null,
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
        const message = "You have unsaved changes. Are you sure you want to leave?";
        e.returnValue = message;
        return message;
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

  const onSubmit = async (data: z.infer<typeof ProductSchema>) => {
    try {
      // Check if we have temporary uploads that haven't been created yet
      if ((tempImages.length > 0 || tempFiles.length > 0) && !tempUploadsCreated) {
        toast.error("Please wait for all uploads to complete before submitting");
        return;
      }
      
      setIsLoading(true);
      
      const endpoint = initialData 
        ? "/api/products/edit-product"
        : "/api/products/create-product";
      
      const method = initialData ? "PATCH" : "POST";

      // Convert dropdownOptions back to schema format
      const schemaOptions = dropdownOptions.flatMap(option => 
        option.values.map(value => ({
          name: option.label,
          value: value.name
        }))
      );

      // Include all necessary data
      const submissionData = {
        ...data,
        ...(initialData && { id: initialData.id }),
        description: description,
        images: images,
        tags: tags,
        materialTags: materialTags,
        options: schemaOptions,
        productFile: data.productFile || null,
      };

      console.log('[DEBUG] Submitting data:', submissionData);

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
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
      stock: 0,
      inStockProcessingTime: 0,
      outStockLeadTime: 0,
      productDrop: false,
      dropDate: null,
      discountEndDate: undefined,
      howItsMade: "",
      productFile: null,
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

        {/* Submit Button */}
        <Submitbutton 
          title={initialData ? "Update Product" : "Create Product"} 
          isPending={isLoading} 
        />
      </form>
    </Form>
  );
}