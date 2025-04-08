"use client";

import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { ProductSchema } from "@/schemas/ProductSchema";
import { useState, useTransition, useEffect } from "react";
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

type ProductFormValues = z.infer<typeof ProductSchema>;
type ProductFormProps = {
  initialData?: ProductFormValues | null; // Null when creating
};
type DropdownOption = {
  label: string;
  values: { name: string; stock: number }[];
};

export function ProductForm({ initialData }: ProductFormProps) {
  const [descriptionJson, setDescriptionJson] = useState<any>(
    initialData?.description || { ops: [] }
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
  const [dropdownOptions, setDropdownOptions] = useState<DropdownOption[]>(
    initialData?.options || []
  );
  const isClient = useIsClient();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [tempImages, setTempImages] = useState<string[]>([]); // Track new uploads

  const [isPending, startTransition] = useTransition();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      ...(initialData || {
        name: "",
        price: 0,
        description: { ops: [] },
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
      }),
      productFile: initialData?.productFile || null,
    }
  });

  // Add this console log to verify form initialization
  console.log("Form initialized with:", form);

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
    setValue('images', images);
  }, [images, setValue]);

  // Replace the route change effect with this
  useEffect(() => {

    // Cleanup on component unmount
    return () => {
      if (tempImages.length > 0) {
        cleanupTempImages();
      }
    };
  }, [tempImages]);

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

  const onSubmit = async (data: z.infer<typeof ProductSchema>) => {
    try {
      setIsLoading(true);
      
      const endpoint = initialData 
        ? "/api/products/edit-product"
        : "/api/products/create-product";
      
      const method = initialData ? "PATCH" : "POST";

      // Add console logs to track the process
      console.log('Starting submission with:', {
        endpoint,
        method,
        initialData: !!initialData,
        images,
        data
      });

      // Include all necessary data
      const submissionData = {
        ...data,
        id: initialData?.id,
        description: descriptionJson,
        images: images,
        tags: tags,
        materialTags: materialTags,
        options: dropdownOptions,
        productFile: data.productFile || null,
      };

      console.log('Submitting data:', submissionData);

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      // Add response debugging
      const responseData = await response.json();
      console.log('Response:', {
        ok: response.ok,
        status: response.status,
        data: responseData
      });

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to save product");
      }

      // Only navigate if the update was successful
      router.replace("/seller/dashboard/products");
      router.refresh();
      
      toast.success(initialData ? "Product updated" : "Product created");
      setTempImages([]); // Mark all temp images as committed
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error("Something went wrong");
      await cleanupTempImages();
    } finally {
      setIsLoading(false);
    }
  };

  // Update the cleanupTempImages function to be synchronous
  const cleanupTempImages = async () => {
    if (tempImages.length === 0) return;

    try {
      const response = await fetch("/api/upload/cleanup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ images: tempImages }),
      });

      if (!response.ok) {
        console.error("Failed to cleanup images");
        return;
      }

      setTempImages([]);
    } catch (error) {
      console.error("Failed to cleanup temporary images:", error);
    }
  };

  const resetExternalStates = () => {
    setDescriptionJson({ ops: [] });
    setDropdownOptions([]);
    setImages([]);
    setTags([]);
    setMaterialTags([]);
    form.reset({
      name: "",
      price: 0,
      description: { ops: [] },
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
    });
  };

  const freeShipping = useWatch({
    control: form.control,
    name: "freeShipping",
  });

  if (!isClient) return <Spinner />;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Product Information Section */}
        <ProductInfoSection
          form={form}
          descriptionJson={descriptionJson}
          setDescriptionJson={setDescriptionJson}
          tags={tags}
          setTags={setTags}
          materialTags={materialTags}
          setMaterialTags={setMaterialTags}
        />

        {/* Product Photos Section */}
        <ProductPhotosSection
          images={images}
          setImages={(newImages) => {
            setImages(newImages);
            setValue("images", newImages, { shouldValidate: true });
          }}
          setTempImages={setTempImages}
          tempImages={tempImages}
          form={form}
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
        <ProductFileSection form={form} />
        {/* Add hidden input to capture product file */}

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