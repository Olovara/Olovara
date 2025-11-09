"use client";

import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { ProductSchema, ProductDraftSchema } from "@/schemas/ProductSchema";
import {
  SUPPORTED_CURRENCIES,
  SUPPORTED_WEIGHT_UNITS,
  SUPPORTED_DIMENSION_UNITS,
  CurrencyCode,
  WeightUnit,
  DimensionUnit,
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
import { ProductSEOSection } from "../product/productSEO";
import GPSRComplianceForm from "../product/GPSRComplianceForm";
import { cleanupTempUploads } from "@/actions/cleanup-temp-uploads";
import { checkSellerApproval } from "@/actions/check-seller-approval";
import { getSellerPreferences } from "@/actions/getSellerPreferences";
import { getCountryExclusions } from "@/actions/countryExclusionsActions";
import { useTestEnvironment } from "@/hooks/useTestEnvironment";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { isGPSRComplianceRequired } from "@/lib/gpsr-compliance";

type ProductFormValues = z.infer<typeof ProductSchema> & {
  id?: string;
  isDraft?: boolean;
};

type ProductFormProps = {
  initialData?: ProductFormValues | null; // Null when creating
};

// This is the type expected by the ProductOptionsSection component
type DropdownOption = {
  label: string;
  values: { name: string; price?: number; stock: number }[];
};

// This is the type defined in the schema
type SchemaOption = {
  label: string;
  values: { name: string; price?: number; stock: number }[];
};

export function ProductForm({ initialData }: ProductFormProps) {
  console.log("[DEBUG] ProductForm - Initial data:", initialData);

  const [description, setDescription] = useState<string>(
    initialData?.description?.html || ""
  );
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [materialTags, setMaterialTags] = useState<string[]>(
    initialData?.materialTags || []
  );
  const [shortDescriptionBullets, setShortDescriptionBullets] = useState<
    string[]
  >(initialData?.shortDescriptionBullets || []);
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  // SEO state
  const [metaTitle, setMetaTitle] = useState<string>(
    initialData?.metaTitle || ""
  );
  const [metaDescription, setMetaDescription] = useState<string>(
    initialData?.metaDescription || ""
  );
  const [keywords, setKeywords] = useState<string[]>(
    initialData?.keywords || []
  );
  const [ogTitle, setOgTitle] = useState<string>(initialData?.ogTitle || "");
  const [ogDescription, setOgDescription] = useState<string>(
    initialData?.ogDescription || ""
  );
  const [ogImage, setOgImage] = useState<string>(initialData?.ogImage || "");
  const [tempImages, setTempImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Add state to track when temporary uploads are created
  const [tempUploadsCreated, setTempUploadsCreated] = useState(false);
  const [excludedCountries, setExcludedCountries] = useState<string[]>([]);
  const [isGPSRRequired, setIsGPSRRequired] = useState(false);

  // Add a ref to track if form was submitted successfully
  const formSubmittedRef = useRef(false);

  // Update images state when initialData changes
  useEffect(() => {
    if (initialData?.images && Array.isArray(initialData.images)) {
      console.log(
        "[DEBUG] Updating images state with initialData.images:",
        initialData.images
      );
      setImages(initialData.images);
    }
  }, [initialData]);

  // Convert schema options to dropdown options format
  const convertOptions = (
    schemaOptions: SchemaOption[] | null | undefined
  ): DropdownOption[] => {
    if (!schemaOptions) return [];

    // The new format is already compatible, just need to handle price conversion from cents
    return schemaOptions.map((option) => ({
      label: option.label,
      values: option.values.map((value) => ({
        name: value.name,
        price: value.price ? value.price / 100 : undefined, // Convert from cents to currency units
        stock: value.stock || 0,
      })),
    }));
  };

  const [dropdownOptions, setDropdownOptions] = useState<DropdownOption[]>(
    convertOptions(initialData?.options as SchemaOption[] | null | undefined)
  );

  // Update dropdown options when initialData changes
  useEffect(() => {
    if (initialData?.options) {
      const convertedOptions = convertOptions(
        initialData.options as SchemaOption[]
      );
      console.log(
        "[DEBUG] Updating dropdown options from initialData:",
        convertedOptions
      );
      setDropdownOptions(convertedOptions);
    }
  }, [initialData]);
  const isClient = useIsClient();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [tempFiles, setTempFiles] = useState<string[]>([]); // Track new file uploads
  const [isSellerApproved, setIsSellerApproved] = useState<boolean | null>(
    null
  );
  const [isPending, startTransition] = useTransition();
  const [sellerPreferences, setSellerPreferences] = useState({
    preferredCurrency: "USD" as CurrencyCode,
    preferredWeightUnit: "lbs" as WeightUnit,
    preferredDimensionUnit: "in" as DimensionUnit,
  });

  const { canAccessTest, loading: testAccessLoading } = useTestEnvironment();

  // Fetch excluded countries and determine GPSR requirements
  useEffect(() => {
    const fetchExcludedCountries = async () => {
      try {
        const result = await getCountryExclusions();
        if (result.data) {
          const excluded = result.data.excludedCountries || [];
          setExcludedCountries(excluded);

          // Determine if GPSR compliance is required
          const gpsrRequired = isGPSRComplianceRequired(excluded);
          setIsGPSRRequired(gpsrRequired);
        }
      } catch (error) {
        console.error("Error fetching excluded countries:", error);
        // Default to showing GPSR fields if we can't determine
        setIsGPSRRequired(true);
      }
    };

    fetchExcludedCountries();
  }, []);

  const form = useForm<z.infer<typeof ProductSchema>>({
    resolver: zodResolver(
      initialData?.status === "DRAFT" ? ProductDraftSchema : ProductSchema
    ),
    mode: "onChange",
    defaultValues: {
      name: initialData?.name || "",
      sku: initialData?.sku || "",
      shortDescription: initialData?.shortDescription || "",
      shortDescriptionBullets: initialData?.shortDescriptionBullets || [],
      price: initialData?.price ? initialData.price / 100 : 0,
      description: initialData?.description || { html: "", text: "" },
      images: initialData?.images || [],
      freeShipping: initialData?.freeShipping || false,
      handlingFee: initialData?.handlingFee ? initialData.handlingFee / 100 : 0,
      shippingCost: initialData?.shippingCost
        ? initialData.shippingCost / 100
        : 0,
      itemWeight: initialData?.itemWeight || 0,
      itemWeightUnit:
        initialData?.itemWeightUnit || sellerPreferences.preferredWeightUnit,
      itemLength: initialData?.itemLength || 0,
      itemWidth: initialData?.itemWidth || 0,
      itemHeight: initialData?.itemHeight || 0,
      itemDimensionUnit:
        initialData?.itemDimensionUnit ||
        sellerPreferences.preferredDimensionUnit,
      shippingNotes: initialData?.shippingNotes || "",
      status: initialData?.status || "DRAFT",
      isDigital: initialData?.isDigital || false,
      primaryCategory: initialData?.primaryCategory || "",
      secondaryCategory: initialData?.secondaryCategory,
      tertiaryCategory: initialData?.tertiaryCategory || null,
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
      shippingOptionId: initialData?.shippingOptionId || null,
      taxCategory: initialData?.taxCategory || "PHYSICAL_GOODS",
      taxCode: initialData?.taxCode || "",
      taxExempt: initialData?.taxExempt || false,
      // SEO fields
      metaTitle: initialData?.metaTitle || "",
      metaDescription: initialData?.metaDescription || "",
      keywords: initialData?.keywords || [],
      ogTitle: initialData?.ogTitle || "",
      ogDescription: initialData?.ogDescription || "",
      ogImage: initialData?.ogImage || "",
      // GPSR Compliance fields
      safetyWarnings: initialData?.safetyWarnings || "",
      materialsComposition: initialData?.materialsComposition || "",
      safeUseInstructions: initialData?.safeUseInstructions || "",
      ageRestriction: initialData?.ageRestriction || "",
      chokingHazard: initialData?.chokingHazard || false,
      smallPartsWarning: initialData?.smallPartsWarning || false,
      chemicalWarnings: initialData?.chemicalWarnings || "",
      careInstructions: initialData?.careInstructions || "",
      // Options field
      options: initialData?.options || null,
    },
  });

  // Add this console log to verify form initialization
  console.log("Form initialized with:", form);
  console.log("Form default values:", form.getValues());

  const formState = form.formState;
  console.log("Form state:", formState);

  const { setValue } = form;

  // Helper function to get errors for a specific card section
  const getCardErrors = (fieldNames: string[]) => {
    // Don't check for errors if status is DRAFT
    if (isDraft) {
      return [];
    }
    
    const errors: string[] = [];
    const formValues = form.getValues();
    const freeShipping = formValues.freeShipping as boolean;
    const isDigital = formValues.isDigital as boolean;
    
    fieldNames.forEach((fieldName) => {
      const error =
        formState.errors[fieldName as keyof typeof formState.errors];
      const value = formValues[fieldName as keyof typeof formValues];
      
      // Skip shippingOptionId if free shipping is selected
      if (fieldName === "shippingOptionId" && freeShipping) {
        return;
      }
      
      // Skip shipping fields if product is digital
      if (fieldName === "shippingOptionId" && isDigital) {
        return;
      }
      
      // Special handling for description field (Quill editor)
      if (fieldName === "description") {
        // Check the actual description state, not just the form value
        // This ensures we're checking the most up-to-date value
        const currentDescription = description; // Use the state variable directly
        
        let isEmpty = false;
        
        if (!currentDescription || currentDescription.trim() === "") {
          isEmpty = true;
        } else {
          // Strip HTML tags and check if there's actual text content
          const plainText = currentDescription.replace(/<[^>]*>/g, "").trim();
          
          // Check if content is empty or only contains empty HTML tags
          isEmpty = 
            plainText === "" ||
            currentDescription.trim() === "<p><br></p>" || 
            currentDescription.trim() === "<p></p>" ||
            currentDescription.trim() === "<br>" ||
            currentDescription.trim() === "<br/>";
        }
        
        if (error || isEmpty) {
          errors.push(fieldName);
        }
        return;
      }
      
      // Special handling for shippingOptionId - check if it's empty string or null
      if (fieldName === "shippingOptionId") {
        const isEmpty = 
          value === undefined || 
          value === null || 
          value === "" || 
          (typeof value === "string" && value.trim() === "");
        if (error || isEmpty) {
          errors.push(fieldName);
        }
        return;
      }
      
      // Check if there's a validation error OR if the field is empty/null
      // For select fields (primaryCategory, secondaryCategory), 
      // empty string means not selected
      // For numeric fields, 0 is a valid value, so we only check for undefined/null
      const isEmpty = 
        value === undefined || 
        value === null || 
        value === "" || 
        (typeof value === "string" && value.trim() === "");
      
      if (error || isEmpty) {
        errors.push(fieldName);
      }
    });
    return errors;
  };

  // Get current status to determine if we should show validation errors
  const currentStatus = form.watch("status");
  const isDraft = currentStatus === "DRAFT";

  // Clear errors on initial load if status is DRAFT
  useEffect(() => {
    if (currentStatus === "DRAFT") {
      // Clear all form errors on initial load with DRAFT status
      const fieldNames = Object.keys(form.formState.errors);
      fieldNames.forEach((fieldName) => {
        form.clearErrors(fieldName as any);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Re-validate form when status changes from DRAFT to non-DRAFT
  // Clear errors when switching back to DRAFT
  useEffect(() => {
    if (currentStatus && currentStatus !== "DRAFT") {
      // Trigger validation for non-draft status to show errors immediately
      // Specifically trigger shippingOptionId validation if free shipping is not selected
      const freeShippingValue = form.getValues("freeShipping");
      const isDigitalValue = form.getValues("isDigital");
      if (!freeShippingValue && !isDigitalValue) {
        form.trigger("shippingOptionId");
      }
      form.trigger();
    } else if (currentStatus === "DRAFT") {
      // Clear all form errors when switching back to draft
      const fieldNames = Object.keys(form.formState.errors);
      fieldNames.forEach((fieldName) => {
        form.clearErrors(fieldName as any);
      });
    }
  }, [currentStatus, form]);

  // Helper function to format status for display
  const formatStatus = (status: string) => {
    if (!status) return "Draft";
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  // Define field groups for each card section
  const basicInfoFields = [
    "name",
    "shortDescription",
    "description",
    "price",
    "primaryCategory",
    "secondaryCategory",
  ];
  const mediaFields = ["images"];
  const inventoryFields = ["stock"];
  const shippingFields = [
    "shippingCost",
    "itemWeight",
    "itemLength",
    "itemWidth",
    "itemHeight",
    "shippingOptionId",
  ];

  // Ensure shippingOptionId is set if it's missing
  useEffect(() => {
    const currentValue = form.getValues("shippingOptionId");
    if (currentValue === undefined) {
      form.setValue("shippingOptionId", null);
    }
  }, [form]);

  // Add this useEffect to monitor form errors
  useEffect(() => {
    if (Object.keys(formState.errors).length > 0) {
      console.log("Form errors:", formState.errors);
      console.log("Current form values:", form.getValues());
      console.log(
        "shippingOptionId value:",
        form.getValues("shippingOptionId")
      );
    }
  }, [formState.errors, form]);

  // Add this useEffect to sync images with form state
  useEffect(() => {
    console.log("[DEBUG] ProductForm - Current images state:", images);
    setValue("images", images);
  }, [images, setValue]);

  // Ensure shipping cost is 0 when free shipping is enabled
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "freeShipping" && value.freeShipping) {
        setValue("shippingCost", 0);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, setValue]);

  // Update the description handling useEffect
  useEffect(() => {
    // Always update the form value, even if description is empty
    // Only validate if status is not DRAFT
    const shouldValidate = !isDraft;
    form.setValue("description", {
      html: description || "",
      text: description ? description.replace(/<[^>]*>?/gm, "") : "",
    }, { shouldValidate });
  }, [description, form, isDraft]);

  // Update the form watch for description
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "description" && value.description) {
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
        console.log("[DEBUG] Cleanup result:", result);
        setTempImages([]); // Clear the temp images after cleanup
      } catch (error) {
        console.error("Error cleaning up temporary images:", error);
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

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [form.formState.isDirty, tempImages]);

  useEffect(() => {
    const checkApproval = async () => {
      const approved = await checkSellerApproval();
      setIsSellerApproved(approved);
    };

    void checkApproval();
  }, []);

  // Convert dropdown options back to schema format
  const convertDropdownOptionsToSchema = (
    dropdownOptions: DropdownOption[]
  ): SchemaOption[] => {
    return dropdownOptions.map((option) => ({
      label: option.label,
      values: option.values.map((value) => ({
        name: value.name,
        price: value.price ? Math.round(value.price * 100) : undefined, // Convert to cents
        stock: value.stock || 0,
      })),
    }));
  };

  const onSubmit = async (data: ProductFormValues) => {
    console.log("[DEBUG] onSubmit function called!");
    try {
      setIsLoading(true);
      console.log("[DEBUG] Submitting form with data:", data);

      // Determine if this should be saved as a draft
      const isDraft =
        initialData?.status === "DRAFT" || data.status === "DRAFT";

      // For non-draft products, validate all required fields
      if (!isDraft) {
        // If the form started as a draft, we need to validate against the full schema
        // Otherwise, the form resolver will handle validation
        if (initialData?.status === "DRAFT") {
          // Validate against the full schema manually
          const validationResult = ProductSchema.safeParse(data);
          if (!validationResult.success) {
            // Set errors manually to show them in the form
            validationResult.error.errors.forEach((error) => {
              const fieldName = error.path.join(
                "."
              ) as keyof typeof formState.errors;
              form.setError(fieldName, {
                type: "manual",
                message: error.message,
              });
            });
            toast.error(
              "Please fill in all required fields before saving. Check the highlighted fields and error messages above."
            );
            setIsLoading(false);
            return;
          }
        } else {
          // Form already uses full schema, just trigger validation
          const isValid = await form.trigger();
          if (!isValid) {
            toast.error(
              "Please fill in all required fields before saving. Check the highlighted fields and error messages above."
            );
            setIsLoading(false);
            return;
          }
        }
      }

      // Validate GPSR compliance if required
      if (isGPSRRequired) {
        const requiredGPSRFields = [
          "safetyWarnings",
          "materialsComposition",
          "safeUseInstructions",
        ];

        const missingFields = requiredGPSRFields.filter((field) => {
          const value = data[field as keyof typeof data];
          return !value || (typeof value === "string" && value.trim() === "");
        });

        if (missingFields.length > 0) {
          toast.error(
            `GPSR compliance required: Please fill in ${missingFields.join(", ")}`
          );
          setIsLoading(false);
          return;
        }
      }

      // The schema already handles the conversion to cents
      const formData = {
        ...data,
        status: isDraft ? "DRAFT" : data.status,
        options:
          dropdownOptions.length > 0
            ? convertDropdownOptionsToSchema(dropdownOptions)
            : null,
        // Remove these conversions since they're handled by the schema
        // price: Math.round(data.price * 100),
        // shippingCost: Math.round(data.shippingCost * 100),
        // handlingFee: Math.round(data.handlingFee * 100),
      };

      console.log("[DEBUG] Form data after conversion:", formData);

      const response = await fetch(
        initialData
          ? `/api/products/${initialData.id}`
          : "/api/products/create-product",
        {
          method: initialData ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        // Handle onboarding incomplete error
        if (responseData.onboardingIncomplete) {
          toast.error(
            "Please complete your seller onboarding before activating products"
          );
          return;
        }
        throw new Error(responseData.error || "Failed to save product");
      }

      // After successful product creation/update, call the cleanup server action
      if (responseData.product && responseData.product.id) {
        console.log(
          "[DEBUG] Product created/updated successfully, cleaning up temporary uploads"
        );

        // Set the flag to indicate successful submission
        formSubmittedRef.current = true;

        // Prepare the URLs for cleanup
        const urlsToCleanup = [...images];
        if (data.productFile) {
          urlsToCleanup.push(data.productFile);
        }

        // Call the cleanup server action with the product ID
        const cleanupResult = await cleanupTempUploads(
          responseData.product.id,
          urlsToCleanup
        );
        console.log("[DEBUG] Cleanup result:", cleanupResult);

        if (!cleanupResult.success) {
          console.error("[ERROR] Cleanup failed:", cleanupResult.error);
        }
      }

      // Show appropriate success message
      if (responseData.isDraft) {
        toast.success(
          "Product draft saved successfully! Complete all required fields to make it active."
        );
      } else {
        toast.success(initialData ? "Product updated" : "Product created");
      }

      // Only navigate if the update was successful
      router.replace("/seller/dashboard/products");
      router.refresh();
      setTempImages([]); // Clear temp images after successful submission
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!initialData?.id) return;

    try {
      setIsLoading(true);

      const response = await fetch("/api/products/update-status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: initialData.id,
          newStatus,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (responseData.onboardingIncomplete) {
          toast.error(
            "Please complete your seller onboarding before activating products"
          );
          return;
        }
        if (responseData.missingFields) {
          toast.error(
            `Please complete these required fields: ${responseData.missingFields.join(", ")}`
          );
          return;
        }
        throw new Error(
          responseData.error || "Failed to update product status"
        );
      }

      toast.success(responseData.message);
      router.refresh();
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("Failed to update product status");
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
      status: "DRAFT",
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

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {initialData ? "Edit Product" : "Create New Product"}
          </h1>
          <p className="text-gray-600">
            {initialData
              ? "Update your product information and settings"
              : "Fill out the information below to create your product listing"}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Grid Layout for Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Information Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Basic Information
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Essential product details that customers will see first
                  </p>
                  {!isDraft && getCardErrors(basicInfoFields).length > 0 && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm font-medium text-red-800">
                        Missing required fields:{" "}
                        {getCardErrors(basicInfoFields)
                          .map((field) => {
                            const fieldLabels: Record<string, string> = {
                              name: "Product Name",
                              shortDescription: "Short Description",
                              description: "Description",
                              price: "Price",
                              primaryCategory: "Primary Category",
                              secondaryCategory: "Secondary Category",
                            };
                            return fieldLabels[field] || field;
                          })
                          .join(", ")}
                      </p>
                    </div>
                  )}
                </div>
                <div className="p-6 space-y-6">
                  <ProductInfoSection
                    form={form}
                    description={description}
                    setDescription={setDescription}
                    tags={tags}
                    setTags={setTags}
                    materialTags={materialTags}
                    setMaterialTags={setMaterialTags}
                    shortDescriptionBullets={shortDescriptionBullets}
                    setShortDescriptionBullets={setShortDescriptionBullets}
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
                  {!isDraft && getCardErrors(mediaFields).length > 0 && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm font-medium text-red-800">
                        Missing required fields:{" "}
                        {getCardErrors(mediaFields)
                          .map((field) => {
                            const fieldLabels: Record<string, string> = {
                              images: "Product Images",
                            };
                            return fieldLabels[field] || field;
                          })
                          .join(", ")}
                      </p>
                    </div>
                  )}
                </div>
                <div className="p-6 space-y-6">
                  <ProductPhotosSection
                    images={images}
                    setImages={setImages}
                    setTempImages={setTempImages}
                    tempImages={tempImages}
                    form={form}
                    setTempUploadsCreated={setTempUploadsCreated}
                  />

                  <ProductFileSection
                    form={form}
                    tempFiles={tempFiles}
                    setTempFiles={setTempFiles}
                    setTempUploadsCreated={setTempUploadsCreated}
                  />
                </div>
              </div>

              {/* Inventory & Options Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Inventory & Options
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Stock levels, variants, and product options
                  </p>
                  {!isDraft &&
                    !form.watch("isDigital") &&
                    getCardErrors(inventoryFields).length > 0 && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm font-medium text-red-800">
                          Missing required fields:{" "}
                          {getCardErrors(inventoryFields)
                            .map((field) => {
                              const fieldLabels: Record<string, string> = {
                                stock: "Stock",
                              };
                              return fieldLabels[field] || field;
                            })
                            .join(", ")}
                        </p>
                      </div>
                    )}
                </div>
                <div className="p-6 space-y-6">
                  <ProductInventorySection form={form} />

                  <ProductOptionsSection
                    dropdownOptions={dropdownOptions}
                    setDropdownOptions={setDropdownOptions}
                  />
                </div>
              </div>

              {/* Shipping & Dimensions Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Shipping & Dimensions
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Shipping costs, dimensions, and handling information
                  </p>
                  {!isDraft &&
                    !form.watch("isDigital") &&
                    !form.watch("freeShipping") &&
                    getCardErrors(shippingFields).length > 0 && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm font-medium text-red-800">
                          Missing required fields:{" "}
                          {getCardErrors(shippingFields)
                            .map((field) => {
                              const fieldLabels: Record<string, string> = {
                                shippingCost: "Shipping Cost",
                                shippingOptionId: "Shipping Option",
                                itemWeight: "Item Weight",
                                itemLength: "Item Length",
                                itemWidth: "Item Width",
                                itemHeight: "Item Height",
                              };
                              return fieldLabels[field] || field;
                            })
                            .join(", ")}
                        </p>
                      </div>
                    )}
                </div>
                <div className="p-6 space-y-6">
                  <ProductShippingSection
                    form={form}
                    freeShipping={freeShipping}
                  />
                </div>
              </div>

              {/* Story & Details Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Story & Details
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Optional Section. Tell customers about your product and how it&apos;s made
                  </p>
                </div>
                <div className="p-6 space-y-6">
                  <ProductHowItsMadeSection form={form} />
                </div>
              </div>

              {/* Promotions & Scheduling Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Promotions & Scheduling
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Optional section. Discounts, sales, and product drops
                  </p>
                </div>
                <div className="p-6 space-y-6">
                  <ProductDiscountSection form={form} />
                  <ProductDropSection form={form} />
                </div>
              </div>
            </div>

            {/* Full Width Sections */}
            <div className="space-y-8">
              {/* SEO & Marketing Section - Full Width */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    SEO & Marketing
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Optional Section. Optimize your product for search and social media
                  </p>
                </div>
                <div className="p-6 space-y-6">
                  <ProductSEOSection
                    metaTitle={metaTitle}
                    setMetaTitle={setMetaTitle}
                    metaDescription={metaDescription}
                    setMetaDescription={setMetaDescription}
                    keywords={keywords}
                    setKeywords={setKeywords}
                    ogTitle={ogTitle}
                    setOgTitle={setOgTitle}
                    ogDescription={ogDescription}
                    setOgDescription={setOgDescription}
                    ogImage={ogImage}
                    setOgImage={setOgImage}
                  />
                </div>
              </div>

              {/* GPSR Compliance Section - Only show if GPSR compliance is required */}
              {isGPSRRequired && !form.watch("isDigital") ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      Product Safety & Compliance
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Ensure your product meets safety standards and regulatory
                      requirements
                    </p>
                  </div>
                  <div className="p-6">
                    <GPSRComplianceForm
                      safetyWarnings={form.watch("safetyWarnings") || ""}
                      materialsComposition={
                        form.watch("materialsComposition") || ""
                      }
                      safeUseInstructions={
                        form.watch("safeUseInstructions") || ""
                      }
                      ageRestriction={form.watch("ageRestriction") || ""}
                      chokingHazard={form.watch("chokingHazard") || false}
                      smallPartsWarning={
                        form.watch("smallPartsWarning") || false
                      }
                      chemicalWarnings={form.watch("chemicalWarnings") || ""}
                      careInstructions={form.watch("careInstructions") || ""}
                      onChange={(field, value) =>
                        form.setValue(field as any, value)
                      }
                      isRequired={true} // Now required since we only show when GPSR compliance is needed
                    />
                  </div>
                </div>
              ) : !form.watch("isDigital") ? (
                // Show message when GPSR compliance is not required (for physical products)
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      Product Safety & Compliance
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      GPSR compliance not required for your shipping
                      destinations
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="text-sm text-gray-600">
                      <p>
                        Since you have excluded all EU/EEA countries and
                        Northern Ireland from your shipping destinations, GPSR
                        (General Product Safety Regulation) compliance fields
                        are not required.
                      </p>
                      <p className="mt-2">
                        If you later decide to ship to EU/EEA countries or
                        Northern Ireland, you can update your shipping
                        exclusions in your seller settings, and these fields
                        will become available.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                // Show message for digital products
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      Digital Product
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      GPSR compliance not required for digital products
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="text-sm text-gray-600">
                      <p>
                        GPSR (General Product Safety Regulation) compliance
                        fields are not required for digital products since they
                        don&apos;t pose physical safety risks.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* GPSR Warning Section - Show when GPSR is required but fields are empty */}
              {isGPSRRequired &&
                !form.watch("isDigital") &&
                (() => {
                  const safetyWarnings = form.watch("safetyWarnings") || "";
                  const materialsComposition =
                    form.watch("materialsComposition") || "";
                  const safeUseInstructions =
                    form.watch("safeUseInstructions") || "";
                  const hasGPSRData =
                    safetyWarnings.trim() ||
                    materialsComposition.trim() ||
                    safeUseInstructions.trim();

                  if (!hasGPSRData) {
                    return (
                      <div className="bg-white rounded-xl shadow-sm border border-orange-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
                          <h2 className="text-lg font-semibold text-orange-900 flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            EU Compliance Required
                          </h2>
                          <p className="text-sm text-orange-700 mt-1">
                            Complete GPSR information to sell in EU/EEA
                            countries
                          </p>
                        </div>
                        <div className="p-6">
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                <svg
                                  className="w-5 h-5 text-orange-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                  />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <h3 className="text-sm font-medium text-orange-900 mb-1">
                                  GPSR Information Required
                                </h3>
                                <p className="text-sm text-orange-800 mb-3">
                                  Since you ship to EU/EEA countries, you must
                                  provide product safety information to comply
                                  with the General Product Safety Regulation
                                  (GPSR). Your product cannot be activated for
                                  EU sales without this information.
                                </p>
                                <div className="text-sm text-orange-800">
                                  <p className="font-medium mb-1">
                                    Required fields:
                                  </p>
                                  <ul className="list-disc list-inside space-y-1">
                                    <li>Safety warnings</li>
                                    <li>Materials composition</li>
                                    <li>Safe use instructions</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

              {/* Test Product Section - Full Width */}
              {canAccessTest && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                      Testing Options
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Configure test environment settings
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="isTestProduct"
                        checked={form.watch("isTestProduct") || false}
                        onCheckedChange={(checked) =>
                          form.setValue("isTestProduct", checked as boolean)
                        }
                      />
                      <div>
                        <Label
                          htmlFor="isTestProduct"
                          className="text-sm font-medium"
                        >
                          Mark as test product
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Only visible to users with test environment access
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="w-full sm:w-auto px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors h-12 flex items-center justify-center"
                >
                  Cancel
                </button>

                {initialData?.status === "DRAFT" && (
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate("ACTIVE")}
                    disabled={isLoading}
                    className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors flex items-center justify-center gap-2 h-12"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Activating...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Activate Product
                      </>
                    )}
                  </button>
                )}

                {initialData?.status === "ACTIVE" && (
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate("HIDDEN")}
                    disabled={isLoading}
                    className="w-full sm:w-auto px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 font-medium transition-colors h-12 flex items-center justify-center"
                  >
                    {isLoading ? "Hiding..." : "Hide Product"}
                  </button>
                )}

                <div className="flex flex-col items-center gap-2">
                  <Submitbutton
                    title={
                      initialData
                        ? `Update Product (Status: ${formatStatus(currentStatus || "DRAFT")})`
                        : `Create Product (Status: ${formatStatus(currentStatus || "DRAFT")})`
                    }
                    isPending={isLoading}
                  />
                  <p className="text-xs text-gray-500 text-center">
                    This will save all changes to your product
                  </p>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
