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

type ProductFormValues = z.infer<typeof ProductSchema>;
type ProductFormProps = {
  initialData?: ProductFormValues | null; // Null when creating
};
type DropdownOption = {
  label: string;
  values: { name: string; stock: number }[];
};

export function ProductForm({ initialData }: ProductFormProps) {
  const [descriptionJson, setDescriptionJson] = useState<any>({ ops: [] });
  const [tags, setTags] = useState<string[]>([]);
  const [materialTags, setMaterialTags] = useState<string[]>([]);
  const [images, setImages] = useState<null | string[]>(null);
  const [dropdownOptions, setDropdownOptions] = useState<DropdownOption[]>([]);
  const isClient = useIsClient();

  const [isPending, startTransition] = useTransition();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      name: initialData?.name || "",
      price: initialData?.price ?? 0,
      description: initialData?.description || { ops: [] },
      images: initialData?.images || [],
      freeShipping: initialData?.freeShipping || false,
      handlingFee: Number(initialData?.handlingFee ?? 0),
      shippingCost: Number(initialData?.shippingCost ?? 0),
      itemWeight: Number(initialData?.itemWeight ?? 0),
      itemLength: Number(initialData?.itemLength ?? 0),
      itemWidth: Number(initialData?.itemWidth ?? 0),
      itemHeight: Number(initialData?.itemHeight ?? 0),
      shippingNotes: initialData?.shippingNotes || "",
      status: initialData?.status || "HIDDEN",
      isDigital: initialData?.isDigital || false,
      primaryCategory: initialData?.primaryCategory || "",
      secondaryCategory: initialData?.secondaryCategory || "",
      stock: Number(initialData?.stock ?? 0),
      inStockProcessingTime: Number(initialData?.inStockProcessingTime ?? 0),
      outStockLeadTime: Number(initialData?.outStockLeadTime ?? 0),
      productDrop: initialData?.productDrop || false,
      dropDate: initialData?.dropDate || null,
      onSale: initialData?.onSale || false,
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

  const onSubmit = async (values: ProductFormValues) => {
    try {
      console.log("1. Submit started with values:", values);

      // Pre-process the values
      const processedValues = {
        ...values,
        images: images || [],
        shippingCost: Number(values.shippingCost || 0),
        handlingFee: Number(values.handlingFee || 0),
        stock: Number(values.stock || 0),
        inStockProcessingTime: Number(values.inStockProcessingTime || 0),
        outStockLeadTime: Number(values.outStockLeadTime || 0),
      };

      console.log("2. Processed values:", processedValues);

      const result = ProductSchema.safeParse(processedValues);

      if (!result.success) {
        console.error("3. Validation errors:", result.error.errors);
        toast.error("Validation error. Check form inputs.");
        return;
      }

      const payload = {
        ...result.data, // Use the validated and transformed data
        description: descriptionJson,
        tags,
        materialTags,
        options: dropdownOptions,
        howItsMade: values.howItsMade || "",
      };

      console.log("4. Final payload:", payload);

      const response = await fetch("/api/products/create-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("Submit started with values:", data);

      if (data.success) {
        toast.success("Product created successfully!");
        resetExternalStates();
      } else {
        toast.error(data.error || "Error creating product.");
      }
    } catch (error) {
      console.error("7. Error in submission:", error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  const resetExternalStates = () => {
    setDescriptionJson({ ops: [] });
    setDropdownOptions([]);
    setImages(null);
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
        <Submitbutton title="Create Product" isPending={isPending} />
      </form>
    </Form>
  );
}
