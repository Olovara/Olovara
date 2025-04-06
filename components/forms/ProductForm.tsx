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
import ProductFileSection from "../product/productFile";
import { ProductDiscountSection } from "../product/productDiscount";
import { ProductDropSection } from "../product/productDrop";
import { ProductInventorySection } from "../product/productInventory";
import { ProductHowItsMadeSection } from "../product/productHowMade";
import { useRouter } from "next/navigation";

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
  const [isLoading, setIsLoading] = useState(false);

  const [isPending, startTransition] = useTransition();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(ProductSchema),
    defaultValues: initialData || {
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
    },
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

  const onSubmit = async (data: z.infer<typeof ProductSchema>) => {
    try {
      setIsLoading(true);
      
      const endpoint = initialData 
        ? "/api/products/edit-product"
        : "/api/products/create-product";
      
      const method = initialData ? "PATCH" : "POST";
      
      // If editing, include the product ID
      if (initialData) {
        data.id = initialData.id;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save product");
      }

      router.push("/seller/dashboard/products");
      router.refresh();
      
      toast.success(initialData ? "Product updated" : "Product created");
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
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
        <input type="hidden" {...form.register("productFile")} />

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
