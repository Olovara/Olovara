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
import { ProcessedImage } from "../product/ImageProcessor";
import { uploadProcessedImages } from "@/lib/upload-images";
import { ProductOptionsSection } from "../product/productOptions";
import { ProductShippingSection } from "../product/productShipping";
import { ProductPromotionsSection } from "../product/productPromotions";
import { ProductInventorySection } from "../product/productInventory";
import { ProductHowItsMadeSection } from "../product/productHowMade";
import { useRouter, usePathname } from "next/navigation";
import { ProductFileSection, ProcessedFile } from "../product/productFile";
import { ProductSEOSection } from "../product/productSEO";
import GPSRComplianceForm from "../product/GPSRComplianceForm";
import { cleanupTempUploads } from "@/actions/cleanup-temp-uploads";
import { checkSellerApproval } from "@/actions/check-seller-approval";
import { getCountryExclusions } from "@/actions/countryExclusionsActions";
import { useTestEnvironment } from "@/hooks/useTestEnvironment";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { isGPSRComplianceRequired } from "@/lib/gpsr-compliance";
import { uploadProcessedFiles } from "@/lib/upload-files";
import { logQaStep } from "@/lib/qa-logger";
import { getQaSessionId } from "@/lib/qa-session";
import { PRODUCT_STEPS, QA_EVENTS } from "@/lib/qa-steps";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { usePermissions } from "@/components/providers/PermissionProvider";
import { PERMISSIONS } from "@/data/roles-and-permissions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Lock } from "lucide-react";
import { isSellerGPSRComplianceRequired } from "@/lib/gpsr-compliance";

type ProductFormValues = z.infer<typeof ProductSchema> & {
  id?: string;
  isDraft?: boolean;
  selectedSellerId?: string; // For admin product creation
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

  // QA logging setup
  const { data: session } = useSession();
  const sessionId = getQaSessionId();
  const userId = session?.user?.id;
  const { hasPermission } = usePermissions();

  // Check if user has permission to create products for sellers
  const canCreateForSellers = hasPermission(
    PERMISSIONS.CREATE_PRODUCTS_FOR_SELLERS.value
  );

  // Admin seller selection state
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [sellerLocked, setSellerLocked] = useState(false);
  const [activeSellers, setActiveSellers] = useState<
    Array<{
      id: string;
      userId: string;
      shopName: string;
      shopNameSlug: string;
      shopTagLine: string | null;
      preferredCurrency: string;
      preferredWeightUnit: string;
      preferredDimensionUnit: string;
      preferredDistanceUnit: string;
      shopCountry: string;
      excludedCountries: string[];
      user: {
        id: string;
        username: string | null;
        email: string | null;
        image: string | null;
      };
    }>
  >([]);
  const [selectedSeller, setSelectedSeller] = useState<
    (typeof activeSellers)[0] | null
  >(null);
  const [loadingSellers, setLoadingSellers] = useState(false);

  // Safely extract description HTML, handling various formats
  const getDescriptionHtml = (): string => {
    if (!initialData?.description) return "";
    if (typeof initialData.description === "string")
      return initialData.description;
    if (typeof initialData.description === "object") {
      // Prefer html, but fall back to text if html doesn't exist
      if (initialData.description.html) {
        return initialData.description.html;
      }
      if (initialData.description.text) {
        return initialData.description.text; // Use text as html if html is missing
      }
    }
    return "";
  };

  const [description, setDescription] = useState<string>(getDescriptionHtml());
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

  // Store processed images (before upload)
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);

  // Track removed existing images (URLs that should be deleted from Uploadthing)
  const [removedExistingImages, setRemovedExistingImages] = useState<string[]>(
    []
  );

  // Store processed file (before upload) - similar to processedImages
  const [processedFile, setProcessedFile] = useState<ProcessedFile | null>(
    null
  );

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
    schemaOptions: SchemaOption[] | null | undefined,
    currency: string = "USD"
  ): DropdownOption[] => {
    if (!schemaOptions) return [];

    // Get currency decimals to properly convert from smallest unit to currency units
    const currencyInfo = SUPPORTED_CURRENCIES.find((c) => c.code === currency);
    const decimals = currencyInfo?.decimals || 2;
    const divisor = Math.pow(10, decimals);

    // The new format is already compatible, just need to handle price conversion from smallest unit
    return schemaOptions.map((option) => ({
      label: option.label,
      values: option.values.map((value) => ({
        name: value.name,
        price: value.price ? value.price / divisor : undefined, // Convert from smallest unit to currency units
        stock: value.stock || 0,
      })),
    }));
  };

  const [dropdownOptions, setDropdownOptions] = useState<DropdownOption[]>(
    convertOptions(
      initialData?.options as SchemaOption[] | null | undefined,
      initialData?.currency || "USD"
    )
  );

  // Update dropdown options when initialData changes
  useEffect(() => {
    if (initialData?.options) {
      const convertedOptions = convertOptions(
        initialData.options as SchemaOption[],
        initialData.currency || "USD"
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

  // Fetch active sellers for admin product creation
  useEffect(() => {
    if (canCreateForSellers && !initialData) {
      // Only fetch if admin and creating new product
      const fetchActiveSellers = async () => {
        setLoadingSellers(true);
        try {
          const response = await fetch("/api/admin/sellers/active");
          const result = await response.json();
          if (result.success && result.data) {
            setActiveSellers(result.data);
          }
        } catch (error) {
          console.error("Error fetching active sellers:", error);
          toast.error("Failed to load sellers. Please refresh the page.");
        } finally {
          setLoadingSellers(false);
        }
      };
      fetchActiveSellers();
    }
  }, [canCreateForSellers, initialData]);

  // Handle seller selection - lock seller and load preferences
  const handleSellerSelect = async (sellerUserId: string) => {
    if (sellerLocked) {
      toast.error("Seller cannot be changed after selection");
      return;
    }

    const seller = activeSellers.find((s) => s.userId === sellerUserId);
    if (!seller) {
      toast.error("Selected seller not found");
      return;
    }

    setSelectedSellerId(sellerUserId);
    setSelectedSeller(seller);
    setSellerLocked(true);

    // Load seller preferences
    setSellerPreferences({
      preferredCurrency: (seller.preferredCurrency || "USD") as CurrencyCode,
      preferredWeightUnit: (seller.preferredWeightUnit || "lbs") as WeightUnit,
      preferredDimensionUnit: (seller.preferredDimensionUnit ||
        "in") as DimensionUnit,
    });

    // Update form with seller preferences
    form.setValue("currency", seller.preferredCurrency || "USD");
    form.setValue("itemWeightUnit", seller.preferredWeightUnit || "lbs");
    form.setValue("itemDimensionUnit", seller.preferredDimensionUnit || "in");

    // Load excluded countries and determine GPSR requirement
    const excluded = seller.excludedCountries || [];
    setExcludedCountries(excluded);
    const gpsrRequired = isSellerGPSRComplianceRequired(
      seller.shopCountry,
      excluded
    );
    setIsGPSRRequired(gpsrRequired);

    toast.success(`Creating product for ${seller.shopName}`);
  };

  // Fetch seller preferences on mount (for regular sellers)
  useEffect(() => {
    if (!canCreateForSellers || initialData) {
      // Only fetch for regular sellers or when editing
      const fetchSellerPreferences = async () => {
        try {
          const response = await fetchWithRetry("/api/seller/preferences");
          const preferences = await response.json();

          if (preferences && preferences.preferredCurrency) {
            setSellerPreferences({
              preferredCurrency: (preferences.preferredCurrency ||
                "USD") as CurrencyCode,
              preferredWeightUnit: (preferences.preferredWeightUnit ||
                "lbs") as WeightUnit,
              preferredDimensionUnit: (preferences.preferredDimensionUnit ||
                "in") as DimensionUnit,
            });

            // For new products (no initialData), always use seller's preferred currency
            // For existing products, only update if no currency was set
            if (!initialData) {
              // New product - always set to preferred currency
              form.setValue("currency", preferences.preferredCurrency);
            } else if (!initialData.currency) {
              // Existing product but no currency set - use preferred currency
              form.setValue("currency", preferences.preferredCurrency);
            }
          }
        } catch (error) {
          console.error(
            "Error fetching seller preferences after retries:",
            error
          );
          // Fallback to defaults if all retries fail
          console.warn("Using default currency (USD) due to fetch failure");
        }
      };

      fetchSellerPreferences();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canCreateForSellers, initialData]);

  // Fetch excluded countries and determine GPSR requirements (for regular sellers)
  useEffect(() => {
    if (!canCreateForSellers || !selectedSellerId) {
      // Only fetch for regular sellers or when not creating for a seller
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
          // Enhanced error logging for international sellers
          console.error(
            "[PRODUCT FORM ERROR] Error fetching excluded countries:",
            {
              error:
                error instanceof Error
                  ? {
                      name: error.name,
                      message: error.message,
                      stack: error.stack,
                    }
                  : error,
              productId: initialData?.id || "new",
              timestamp: new Date().toISOString(),
            }
          );

          // CRITICAL: Default to requiring GPSR compliance if we can't determine
          // This is safer for international sellers - better to require compliance than miss it
          // However, log this clearly so sellers know why GPSR fields are showing
          setIsGPSRRequired(true);
          console.warn(
            "[PRODUCT FORM WARNING] Could not determine GPSR requirement. " +
              "Defaulting to requiring GPSR compliance for safety. " +
              "If you don't ship to EU/EEA, you can exclude those countries in your seller settings."
          );
        }
      };

      fetchExcludedCountries();
    }
  }, [initialData?.id, canCreateForSellers, selectedSellerId]);

  // QA logging: Log when user enters product form
  useEffect(() => {
    if (!userId) return;

    logQaStep({
      userId,
      sessionId,
      event: initialData ? QA_EVENTS.PRODUCT_EDIT : QA_EVENTS.PRODUCT_CREATE,
      step: PRODUCT_STEPS.DETAILS,
      status: "started",
      route:
        typeof window !== "undefined" ? window.location.pathname : "/sell/new",
      metadata: {
        isEdit: !!initialData,
        productId: initialData?.id,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, sessionId]); // Only log once when component mounts, not on every initialData change

  // Determine initial schema based on initial status (defaults to DRAFT for new products)
  const initialStatus = initialData?.status || "DRAFT";
  const form = useForm<z.infer<typeof ProductSchema>>({
    resolver: zodResolver(
      initialStatus === "DRAFT" ? ProductDraftSchema : ProductSchema
    ),
    mode: "onChange",
    defaultValues: {
      name: initialData?.name || "",
      sku: initialData?.sku || "",
      shortDescription: initialData?.shortDescription || "",
      shortDescriptionBullets: initialData?.shortDescriptionBullets || [],
      price: initialData?.price ? initialData.price / 100 : 0,
      description: (() => {
        const desc = initialData?.description;
        // Check if it's already in the correct object format
        if (desc && typeof desc === "object" && "html" in desc) {
          return desc;
        }
        // Check if it's a string and convert it
        if (desc && typeof desc === "string") {
          const descString = desc as string; // Type assertion to help TypeScript
          return {
            html: descString,
            text: descString.replace(/<[^>]*>?/gm, ""),
          };
        }
        // Default to empty
        return { html: "", text: "" };
      })(),
      images: initialData?.images || [],
      freeShipping: initialData?.freeShipping || false,
      handlingFee: initialData?.handlingFee ? initialData.handlingFee / 100 : 0,
      shippingCost: initialData?.shippingCost
        ? initialData.shippingCost / 100
        : 0,
      // CRITICAL: Dimensions are optional - use undefined instead of 0
      // This prevents validation errors since 0 is invalid (must be > 0 if provided)
      itemWeight: initialData?.itemWeight ?? undefined,
      itemWeightUnit:
        initialData?.itemWeightUnit || sellerPreferences.preferredWeightUnit,
      itemLength: initialData?.itemLength ?? undefined,
      itemWidth: initialData?.itemWidth ?? undefined,
      itemHeight: initialData?.itemHeight ?? undefined,
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
      howItsMade: initialData?.howItsMade || "",
      productFile: initialData?.productFile || null,
      currency: initialData?.currency || "USD", // Will be updated by useEffect when preferences load
      isTestProduct: initialData?.isTestProduct || false,
      shippingOptionId: initialData?.shippingOptionId || null,
      taxCategory: initialData?.taxCategory || "PHYSICAL_GOODS",
      // taxCode is optional - convert null/undefined to empty string for form, will be converted to null on submit if empty
      taxCode: initialData?.taxCode ?? "",
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
      // Sale-related fields
      onSale: initialData?.onSale || false,
      discount: initialData?.discount || undefined,
      saleStartDate: initialData?.saleStartDate
        ? typeof initialData.saleStartDate === "string"
          ? new Date(initialData.saleStartDate)
          : initialData.saleStartDate instanceof Date
            ? initialData.saleStartDate
            : undefined
        : undefined,
      saleEndDate: initialData?.saleEndDate
        ? typeof initialData.saleEndDate === "string"
          ? new Date(initialData.saleEndDate)
          : initialData.saleEndDate instanceof Date
            ? initialData.saleEndDate
            : undefined
        : undefined,
      saleStartTime: initialData?.saleStartTime || "",
      saleEndTime: initialData?.saleEndTime || "",
    },
  });

  // Add this console log to verify form initialization
  console.log("Form initialized with:", form);
  console.log("Form default values:", form.getValues());

  const formState = form.formState;
  console.log("Form state:", formState);

  const { setValue } = form;

  // Update sale-related fields when initialData changes (after form is initialized)
  useEffect(() => {
    if (initialData) {
      // Update onSale
      if (initialData.onSale !== undefined) {
        form.setValue("onSale", initialData.onSale);
      }
      // Update discount
      if (initialData.discount !== undefined) {
        form.setValue("discount", initialData.discount);
      }
      // Update saleEndDate - handle both string and Date types
      if (initialData.saleEndDate) {
        const dateValue =
          typeof initialData.saleEndDate === "string"
            ? new Date(initialData.saleEndDate)
            : initialData.saleEndDate instanceof Date
              ? initialData.saleEndDate
              : undefined;
        if (dateValue && !isNaN(dateValue.getTime())) {
          form.setValue("saleEndDate", dateValue);
        }
      }
      // Update saleEndTime
      if (initialData.saleEndTime !== undefined) {
        form.setValue("saleEndTime", initialData.saleEndTime || "");
      }
      // Update saleStartDate
      if (initialData.saleStartDate) {
        const dateValue =
          typeof initialData.saleStartDate === "string"
            ? new Date(initialData.saleStartDate)
            : initialData.saleStartDate instanceof Date
              ? initialData.saleStartDate
              : undefined;
        if (dateValue && !isNaN(dateValue.getTime())) {
          form.setValue("saleStartDate", dateValue);
        }
      }
      // Update saleStartTime
      if (initialData.saleStartTime !== undefined) {
        form.setValue("saleStartTime", initialData.saleStartTime || "");
      }
    }
  }, [initialData, form]);

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
    "description",
    "price",
    "primaryCategory",
    "secondaryCategory",
  ];
  const mediaFields = ["images"];
  const inventoryFields = ["stock"];
  // CRITICAL: Dimensions (itemWeight, itemLength, itemWidth, itemHeight) are OPTIONAL
  // They are not required for physical products, so they should not be in the required fields list
  // Only include fields that are actually required for product submission
  const shippingFields = [
    "shippingCost",
    "shippingOptionId", // Only required if freeShipping is false and product is not digital
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
    form.setValue(
      "description",
      {
        html: description || "",
        text: description ? description.replace(/<[^>]*>?/gm, "") : "",
      },
      { shouldValidate }
    );
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

  // Cleanup blob URLs for processed file on unmount
  useEffect(() => {
    return () => {
      // Clean up blob URL if it exists
      if (processedFile) {
        const currentValue = form.getValues("productFile");
        if (currentValue && currentValue.startsWith("blob:")) {
          URL.revokeObjectURL(currentValue);
        }
      }
    };
  }, [processedFile, form]);

  // Update the beforeunload handler
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty || tempImages.length > 0 || processedFile) {
        e.preventDefault();
        // Modern browsers ignore the return value, but we still need to call preventDefault()
        return "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [form.formState.isDirty, tempImages, processedFile]);

  useEffect(() => {
    const checkApproval = async () => {
      const approved = await checkSellerApproval();
      setIsSellerApproved(approved);
    };

    void checkApproval();
  }, []);

  // Convert dropdown options back to schema format
  const convertDropdownOptionsToSchema = (
    dropdownOptions: DropdownOption[],
    currency: string = "USD"
  ): SchemaOption[] => {
    // Get currency decimals to properly convert from currency units to smallest unit
    const currencyInfo = SUPPORTED_CURRENCIES.find((c) => c.code === currency);
    const decimals = currencyInfo?.decimals || 2;
    const multiplier = Math.pow(10, decimals);

    return dropdownOptions.map((option) => ({
      label: option.label,
      values: option.values.map((value) => ({
        name: value.name,
        price: value.price ? Math.round(value.price * multiplier) : undefined, // Convert to smallest unit
        stock: value.stock || 0,
      })),
    }));
  };

  const onSubmit = async (data: ProductFormValues) => {
    console.log("[DEBUG] onSubmit function called!");

    // CRITICAL: Prevent submission if admin hasn't selected a seller
    if (canCreateForSellers && !initialData && !selectedSellerId) {
      toast.error("Please select a seller before submitting the form");
      return;
    }

    // CRITICAL: Prevent submission if uploads are in progress
    // This prevents race conditions where form submits before images/files are uploaded
    if (isUploading) {
      console.warn(
        "[PRODUCT FORM WARNING] Form submission blocked - uploads in progress:",
        {
          isUploading,
          processedImagesCount: processedImages.length,
          hasProcessedFile: !!processedFile,
          productId: initialData?.id || "new",
          timestamp: new Date().toISOString(),
        }
      );
      toast.error(
        "Please wait for image and file uploads to complete before submitting the form."
      );
      return;
    }

    try {
      setIsLoading(true);
      console.log("[DEBUG] Submitting form with data:", data);

      // Determine if this should be saved as a draft (only check current form value, not initial status)
      const isDraft = data.status === "DRAFT";

      // Check if product was originally a draft (for validation purposes only)
      const wasOriginallyDraft = initialData?.status === "DRAFT";

      // For non-draft products, validate all required fields
      if (!isDraft) {
        // If the form started as a draft, we need to validate against the full schema
        // Otherwise, the form resolver will handle validation
        if (wasOriginallyDraft) {
          // Validate against the full schema manually
          const validationResult = ProductSchema.safeParse(data);
          if (!validationResult.success) {
            console.error("[PRODUCT FORM ERROR] Validation failed:", {
              errors: validationResult.error.errors,
              productId: initialData?.id || "new",
              isDraft,
              formData: {
                name: data.name,
                status: data.status,
                isDigital: data.isDigital,
                price: data.price,
                primaryCategory: data.primaryCategory,
                imagesCount: data.images?.length || 0,
              },
              timestamp: new Date().toISOString(),
            });

            // Set errors manually to show them in the form
            const errorMessages: string[] = [];
            validationResult.error.errors.forEach((error) => {
              const fieldName = error.path.join(
                "."
              ) as keyof typeof formState.errors;
              form.setError(fieldName, {
                type: "manual",
                message: error.message,
              });
              // Collect specific error messages for toast
              if (error.message) {
                errorMessages.push(error.message);
              }
            });

            // Show specific error messages in toast
            if (errorMessages.length > 0) {
              const uniqueErrors = Array.from(new Set(errorMessages));
              if (uniqueErrors.length === 1) {
                toast.error(uniqueErrors[0]);
              } else {
                toast.error(
                  `Validation errors: ${uniqueErrors.slice(0, 3).join(", ")}${uniqueErrors.length > 3 ? "..." : ""}`
                );
              }
            } else {
              toast.error(
                "Please fill in all required fields before saving. Check the highlighted fields and error messages above."
              );
            }
            setIsLoading(false);
            return;
          }
        } else {
          // Form already uses full schema, just trigger validation
          const isValid = await form.trigger();
          if (!isValid) {
            console.error("[PRODUCT FORM ERROR] Form validation failed:", {
              errors: form.formState.errors,
              productId: initialData?.id || "new",
              isDraft,
              formData: {
                name: data.name,
                status: data.status,
                isDigital: data.isDigital,
                price: data.price,
                primaryCategory: data.primaryCategory,
                imagesCount: data.images?.length || 0,
              },
              timestamp: new Date().toISOString(),
            });

            // Show specific error messages from form validation
            const errorMessages = Object.values(form.formState.errors)
              .map((error) => error?.message)
              .filter((msg): msg is string => !!msg);

            if (errorMessages.length > 0) {
              const uniqueErrors = Array.from(new Set(errorMessages));
              if (uniqueErrors.length === 1) {
                toast.error(uniqueErrors[0]);
              } else {
                toast.error(
                  `Validation errors: ${uniqueErrors.slice(0, 3).join(", ")}${uniqueErrors.length > 3 ? "..." : ""}`
                );
              }
            } else {
              toast.error(
                "Please fill in all required fields before saving. Check the highlighted fields and error messages above."
              );
            }
            setIsLoading(false);
            return;
          }
        }
      }

      // Validate GPSR compliance if required (only for physical products and non-draft products)
      // GPSR compliance is not required for digital items, even if seller ships to EU/EEA
      // GPSR compliance is also not required for drafts - sellers can save incomplete products
      if (isGPSRRequired && !data.isDigital && !isDraft) {
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

      // CRITICAL: Validation flow order to prevent orphaned images:
      // 1. Client-side validation (react-hook-form) - happens automatically via handleSubmit
      // 2. Additional validation checks (GPSR, draft status, etc.) - completed above
      // 3. Server-side validation (validate data WITHOUT images) - happens NOW
      // 4. Image/file uploads - happens ONLY after server validation passes
      // 5. Product creation - happens after uploads succeed
      //
      // This prevents orphaned images by validating on the server before uploading.

      // Step 3: Validate data on server BEFORE uploading images
      // Send form data without images to validate first
      console.log(
        "[PRODUCT FORM] Validating data on server before image uploads..."
      );
      const validationData = {
        ...data,
        images: [], // Don't send images for validation - we'll add them after upload
        productFile: null, // Don't send file for validation - we'll add it after upload
      };

      const validationResponse = await fetch("/api/products/validate-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validationData),
      });

      if (!validationResponse.ok) {
        const validationError = await validationResponse.json();
        console.error("[PRODUCT FORM ERROR] Server validation failed:", {
          status: validationResponse.status,
          error: validationError,
          productId: initialData?.id || "new",
          timestamp: new Date().toISOString(),
        });

        // Show validation errors
        if (validationError.details && Array.isArray(validationError.details)) {
          const errorMessages = validationError.details
            .map((err: any) => err?.message)
            .filter(
              (msg: any): msg is string =>
                typeof msg === "string" && msg.length > 0
            );

          if (errorMessages.length > 0) {
            const uniqueErrors = Array.from(new Set(errorMessages));
            toast.error(
              `Validation failed: ${uniqueErrors.slice(0, 3).join(", ")}${uniqueErrors.length > 3 ? "..." : ""}`
            );
          } else {
            toast.error(
              validationError.error ||
                "Validation failed. Please check your form data."
            );
          }
        } else {
          toast.error(
            validationError.error ||
              "Validation failed. Please check your form data."
          );
        }
        setIsLoading(false);
        return;
      }

      console.log(
        "[PRODUCT FORM] Server validation passed. Proceeding with image uploads..."
      );

      // Step 4: Upload processed images (only after server validation passes)
      // Upload processed images first (if any)
      // Extract existing images (already uploaded HTTP URLs) from the images state
      // This preserves all existing images even when new ones are added
      // Filter out any images that have been removed
      const existingImageUrls = images
        .filter(
          (url) => url.startsWith("http://") || url.startsWith("https://")
        )
        .filter((url) => !removedExistingImages.includes(url)); // Exclude removed images

      // Get new processed images that need to be uploaded
      // CRITICAL: Simplify the filter - blob URLs with valid files are ALWAYS new images
      // Don't overthink this - if it has a blob URL and a file, it needs uploading
      let newProcessedImages: typeof processedImages = [];

      for (const img of processedImages) {
        // Skip if missing required properties
        if (!img || !img.preview || !img.file) {
          continue;
        }

        // Skip existing images (already uploaded)
        if (img.id && img.id.startsWith("existing-")) {
          continue;
        }

        // CRITICAL: Blob URLs = new images that need uploading
        if (img.preview.startsWith("blob:")) {
          // Validate file is actually a File instance with size
          if (img.file instanceof File && img.file.size > 0) {
            newProcessedImages.push(img);
            continue;
          }
        }

        // Fallback: If not a blob URL but also not in existing URLs, might be new
        if (
          !existingImageUrls.includes(img.preview) &&
          img.file instanceof File &&
          img.file.size > 0
        ) {
          newProcessedImages.push(img);
        }
      }

      // CRITICAL FALLBACK: If we still have no images but processedImages has blob URLs, force include them
      // This is a safety net in case the loop above missed something
      // Use a more lenient check - if it has a blob URL and any file-like object, include it
      if (newProcessedImages.length === 0 && processedImages.length > 0) {
        const blobImages: typeof processedImages = [];

        for (const img of processedImages) {
          if (!img || !img.preview) continue;

          const isBlob = img.preview.startsWith("blob:");
          const isNotExisting = !img.id || !img.id.startsWith("existing-");

          if (isBlob && isNotExisting) {
            // More lenient file check - just check if file exists and has size
            if (img.file) {
              const fileSize = (img.file as any)?.size || 0;
              // Include if it's a File instance OR if it has a size property (might be a different file-like object)
              if (img.file instanceof File || fileSize > 0) {
                blobImages.push(img);
              }
            }
          }
        }

        if (blobImages.length > 0) {
          console.warn(
            "[PRODUCT FORM WARNING] Fallback caught blob images that were missed:",
            {
              blobImagesCount: blobImages.length,
              originalFilterResult: newProcessedImages.length,
              processedImagesCount: processedImages.length,
              blobImagesDetails: blobImages.map((img) => ({
                id: img.id,
                preview: img.preview?.substring(0, 50),
                fileSize: (img.file as any)?.size,
                isBlob: img.preview?.startsWith("blob:"),
                isFile: img.file instanceof File,
                fileType: typeof img.file,
                fileConstructor: img.file?.constructor?.name,
              })),
              productId: initialData?.id || "new",
            }
          );
          newProcessedImages = blobImages;
        } else {
          // Log detailed analysis if even fallback failed
          console.warn(
            "[PRODUCT FORM WARNING] Processed images found but none detected for upload:",
            {
              processedImagesCount: processedImages.length,
              processedImagesAnalysis: processedImages.map((img) => ({
                id: img.id,
                hasPreview: !!img.preview,
                previewType: img.preview
                  ? img.preview.startsWith("blob:")
                    ? "blob"
                    : img.preview.startsWith("http")
                      ? "http"
                      : "other"
                  : "none",
                previewStart: img.preview?.substring(0, 50),
                hasFile: !!img.file,
                isFileInstance: img.file instanceof File,
                fileSize: (img.file as any)?.size,
                fileType: typeof img.file,
                fileConstructor: img.file?.constructor?.name,
                isExisting: img.id?.startsWith("existing-"),
                wouldBeIncluded:
                  img.preview?.startsWith("blob:") &&
                  !!img.file &&
                  !img.id?.startsWith("existing-"),
              })),
              existingImageUrlsCount: existingImageUrls.length,
              productId: initialData?.id || "new",
            }
          );
        }
      }

      // Validate existing images are valid URLs
      const validExistingImageUrls = existingImageUrls.filter(
        (url) =>
          url &&
          typeof url === "string" &&
          (url.startsWith("http://") || url.startsWith("https://"))
      );

      // Debug logging to help diagnose image upload issues
      console.log("[PRODUCT FORM DEBUG] Image state before upload:", {
        imagesStateCount: images.length,
        imagesState: images.map((url) => url?.substring(0, 50)),
        processedImagesCount: processedImages.length,
        processedImagesPreviews: processedImages.map((img) => ({
          id: img.id,
          preview: img.preview?.substring(0, 50),
          isBlob: img.preview?.startsWith("blob:"),
          hasFile: !!img.file,
          isFileInstance: img.file instanceof File,
          fileSize: img.file?.size,
          isExisting: img.id?.startsWith("existing-"),
        })),
        existingImageUrlsCount: existingImageUrls.length,
        existingImageUrls: existingImageUrls.map((url) =>
          url?.substring(0, 50)
        ),
        newProcessedImagesCount: newProcessedImages.length,
        newProcessedImagesDetails: newProcessedImages.map((img) => ({
          id: img.id,
          preview: img.preview?.substring(0, 50),
          fileSize: img.file?.size,
        })),
        productId: initialData?.id || "new",
        isDraft,
        timestamp: new Date().toISOString(),
      });

      // CRITICAL: If we have processed images with blob URLs but newProcessedImages is empty,
      // something is wrong with the filter - force include them
      if (processedImages.length > 0 && newProcessedImages.length === 0) {
        const blobImages = processedImages.filter(
          (img) =>
            img &&
            img.preview &&
            img.preview.startsWith("blob:") &&
            img.file &&
            img.file instanceof File &&
            img.file.size > 0 &&
            (!img.id || !img.id.startsWith("existing-"))
        );

        if (blobImages.length > 0) {
          console.warn(
            "[PRODUCT FORM WARNING] Filter missed blob images, forcing inclusion:",
            {
              blobImagesCount: blobImages.length,
              originalFilterResult: newProcessedImages.length,
              blobImagesDetails: blobImages.map((img) => ({
                id: img.id,
                preview: img.preview?.substring(0, 50),
                fileSize: img.file?.size,
              })),
            }
          );
          // Force include blob images that were missed
          newProcessedImages.push(...blobImages);
        }
      }

      let finalImageUrls = [...validExistingImageUrls]; // Start with valid existing images

      if (newProcessedImages.length > 0) {
        // Set uploading flag BEFORE starting upload to prevent form submission
        setIsUploading(true);
        const uploadToastId = toast.loading(
          `Uploading ${newProcessedImages.length} image${newProcessedImages.length === 1 ? "" : "s"}...`
        );

        try {
          // Upload only new processed images
          // CRITICAL: Convert file-like objects to File instances for upload
          // The upload function requires File instances, but processedImages might have Blob or other types
          const filesToUpload: File[] = [];

          for (const img of newProcessedImages) {
            if (!img.file) {
              console.warn(
                "[PRODUCT FORM WARNING] Processed image missing file:",
                {
                  id: img.id,
                  preview: img.preview?.substring(0, 50),
                }
              );
              continue;
            }

            // CRITICAL: Cast to any first to handle type mismatches
            // The ProcessedImage type says file: File, but in practice it might be Blob or other types
            const fileObj: any = img.file;
            let file: File;

            // If it's already a File instance, use it directly
            if (
              fileObj &&
              typeof fileObj === "object" &&
              fileObj instanceof File
            ) {
              file = fileObj as File;
            }
            // If it's a Blob, convert to File
            else if (
              fileObj &&
              typeof fileObj === "object" &&
              fileObj instanceof Blob
            ) {
              // Get original name from processed image if available
              const fileName = img.originalName || `image-${Date.now()}.jpg`;
              const blobType = (fileObj as Blob).type || "image/jpeg";
              file = new File([fileObj as Blob], fileName, {
                type: blobType,
                lastModified: Date.now(),
              });
            }
            // If it's a file-like object (has size, name, type properties)
            else {
              // Log detailed info about the file-like object
              console.warn(
                "[PRODUCT FORM WARNING] Converting file-like object to File:",
                {
                  fileType: typeof fileObj,
                  fileConstructor: fileObj?.constructor?.name,
                  hasSize: "size" in fileObj,
                  hasName: "name" in fileObj,
                  hasType: "type" in fileObj,
                  size: fileObj.size,
                  name: fileObj.name,
                  type: fileObj.type,
                }
              );

              // Try to convert to File using arrayBuffer or stream
              if (fileObj.size > 0) {
                // If it has an arrayBuffer method, use it
                if (typeof fileObj.arrayBuffer === "function") {
                  const arrayBuffer = await fileObj.arrayBuffer();
                  file = new File(
                    [arrayBuffer],
                    fileObj.name ||
                      img.originalName ||
                      `image-${Date.now()}.jpg`,
                    {
                      type: fileObj.type || "image/jpeg",
                      lastModified: fileObj.lastModified || Date.now(),
                    }
                  );
                }
                // Otherwise, try to create a File wrapper from the object
                else {
                  // This is a fallback - try to create a File wrapper
                  // Note: This might not work for all file-like objects
                  file = new File(
                    [fileObj],
                    fileObj.name ||
                      img.originalName ||
                      `image-${Date.now()}.jpg`,
                    {
                      type: fileObj.type || "image/jpeg",
                      lastModified: fileObj.lastModified || Date.now(),
                    }
                  );
                }
              } else {
                console.error(
                  "[PRODUCT FORM ERROR] File-like object has no size:",
                  {
                    fileObj,
                    imgId: img.id,
                  }
                );
                continue;
              }
            }

            filesToUpload.push(file);
          }

          // Validate we have files to upload
          if (filesToUpload.length === 0) {
            console.error(
              "[PRODUCT FORM ERROR] No valid files extracted from processed images:",
              {
                newProcessedImagesCount: newProcessedImages.length,
                newProcessedImagesDetails: newProcessedImages.map((img) => ({
                  id: img.id,
                  hasFile: !!img.file,
                  fileType: typeof img.file,
                  fileConstructor: img.file?.constructor?.name,
                  isFile: img.file instanceof File,
                  isBlob: img.file instanceof Blob,
                  hasSize: img.file && "size" in img.file,
                  size: (img.file as any)?.size,
                })),
                productId: initialData?.id || "new",
              }
            );
            throw new Error("No valid files to upload");
          }

          if (filesToUpload.length !== newProcessedImages.length) {
            console.warn(
              "[PRODUCT FORM WARNING] Some processed images had invalid files:",
              {
                expectedCount: newProcessedImages.length,
                validFilesCount: filesToUpload.length,
                productId: initialData?.id || "new",
              }
            );
          }

          console.log("[PRODUCT FORM] Starting image upload:", {
            filesCount: filesToUpload.length,
            fileNames: filesToUpload.map((f) => f.name),
            fileSizes: filesToUpload.map(
              (f) => `${(f.size / 1024).toFixed(2)}KB`
            ),
            existingImagesCount: validExistingImageUrls.length,
            productId: initialData?.id || "new",
            timestamp: new Date().toISOString(),
          });

          const uploadedUrls = await uploadProcessedImages(filesToUpload);

          // Validate uploaded URLs
          const validUploadedUrls = uploadedUrls.filter(
            (url) =>
              url &&
              typeof url === "string" &&
              (url.startsWith("http://") || url.startsWith("https://"))
          );

          if (validUploadedUrls.length === 0) {
            throw new Error("No valid URLs returned from upload");
          }

          if (validUploadedUrls.length !== uploadedUrls.length) {
            console.warn(
              "[PRODUCT FORM WARNING] Some uploaded URLs are invalid:",
              {
                expectedCount: uploadedUrls.length,
                validUrlsCount: validUploadedUrls.length,
                invalidUrls: uploadedUrls.filter(
                  (url) =>
                    !url ||
                    typeof url !== "string" ||
                    (!url.startsWith("http://") && !url.startsWith("https://"))
                ),
                productId: initialData?.id || "new",
              }
            );
          }

          // Clean up blob URLs for successfully uploaded images
          newProcessedImages.forEach((img, index) => {
            if (
              index < validUploadedUrls.length &&
              img.preview.startsWith("blob:")
            ) {
              try {
                URL.revokeObjectURL(img.preview);
              } catch (e) {
                // Ignore errors if URL was already revoked
                console.warn("[PRODUCT FORM] Error revoking blob URL:", e);
              }
            }
          });

          // Append newly uploaded URLs to existing ones (preserve existing images)
          finalImageUrls = [...validExistingImageUrls, ...validUploadedUrls];

          // Update images state
          setImages(finalImageUrls);

          toast.dismiss(uploadToastId);

          if (validUploadedUrls.length < filesToUpload.length) {
            toast.warning(
              `${validUploadedUrls.length} of ${filesToUpload.length} image${filesToUpload.length === 1 ? "" : "s"} uploaded successfully. Some images failed to upload.`
            );
          } else {
            toast.success(
              `${validUploadedUrls.length} image${validUploadedUrls.length === 1 ? "" : "s"} uploaded successfully`
            );
          }

          // QA logging: Log successful image upload
          if (userId) {
            logQaStep({
              userId,
              sessionId,
              event: initialData
                ? QA_EVENTS.PRODUCT_EDIT
                : QA_EVENTS.PRODUCT_CREATE,
              step: PRODUCT_STEPS.IMAGES,
              status: "completed",
              route:
                typeof window !== "undefined"
                  ? window.location.pathname
                  : "/sell/new",
              metadata: {
                imageCount: validUploadedUrls.length,
                totalImages: finalImageUrls.length,
              },
            });
          }
        } catch (uploadError) {
          // Clean up blob URLs on error to prevent memory leaks
          newProcessedImages.forEach((img) => {
            if (img.preview && img.preview.startsWith("blob:")) {
              try {
                URL.revokeObjectURL(img.preview);
              } catch (e) {
                // Ignore errors if URL was already revoked
              }
            }
          });

          console.error("[PRODUCT FORM ERROR] Image upload failed:", {
            error:
              uploadError instanceof Error
                ? {
                    name: uploadError.name,
                    message: uploadError.message,
                    stack: uploadError.stack,
                  }
                : uploadError,
            imagesCount: newProcessedImages.length,
            fileNames: newProcessedImages.map(
              (img) => img.originalName || "unknown"
            ),
            fileSizes: newProcessedImages.map((img) =>
              img.file ? `${(img.file.size / 1024).toFixed(2)}KB` : "unknown"
            ),
            existingImagesCount: validExistingImageUrls.length,
            productId: initialData?.id || "new",
            isDraft,
            timestamp: new Date().toISOString(),
          });

          // QA logging: Log image upload failure
          if (userId) {
            logQaStep({
              userId,
              sessionId,
              event: initialData
                ? QA_EVENTS.PRODUCT_EDIT
                : QA_EVENTS.PRODUCT_CREATE,
              step: PRODUCT_STEPS.IMAGES,
              status: "failed",
              route:
                typeof window !== "undefined"
                  ? window.location.pathname
                  : "/sell/new",
              metadata: {
                error:
                  uploadError instanceof Error
                    ? uploadError.message
                    : String(uploadError),
                imageCount: newProcessedImages.length,
              },
            });
          }

          toast.dismiss(uploadToastId);

          const errorMessage =
            uploadError instanceof Error
              ? uploadError.message
              : "Failed to upload images. Please try again.";

          toast.error(errorMessage);
          setIsLoading(false);
          setIsUploading(false);
          return;
        } finally {
          setIsUploading(false);
        }
      } else {
        // No new images to upload, just use existing URLs
        finalImageUrls = validExistingImageUrls;

        // CRITICAL: Check if we have processed images that should have been uploaded
        // This handles the case where images were added but the upload path wasn't taken
        if (processedImages.length > 0 && finalImageUrls.length === 0) {
          console.error(
            "[PRODUCT FORM ERROR] Images in processedImages but not uploaded:",
            {
              processedImagesCount: processedImages.length,
              processedImagesDetails: processedImages.map((img) => ({
                id: img.id,
                preview: img.preview?.substring(0, 50),
                isBlob: img.preview?.startsWith("blob:"),
                hasFile: !!img.file,
                fileSize: img.file?.size,
              })),
              existingImageUrlsCount: existingImageUrls.length,
              validExistingImageUrlsCount: validExistingImageUrls.length,
              imagesStateCount: images.length,
              productId: initialData?.id || "new",
              timestamp: new Date().toISOString(),
            }
          );
          toast.error(
            "Images were added but not properly processed. Please try adding the images again."
          );
          setIsLoading(false);
          return;
        }

        // Validate we have at least one image for non-draft products
        if (!isDraft && finalImageUrls.length === 0) {
          console.error(
            "[PRODUCT FORM ERROR] No images available for active product:",
            {
              existingImageUrlsCount: existingImageUrls.length,
              validExistingImageUrlsCount: validExistingImageUrls.length,
              processedImagesCount: processedImages.length,
              newProcessedImagesCount: newProcessedImages.length,
              imagesState: images,
              productId: initialData?.id || "new",
              timestamp: new Date().toISOString(),
            }
          );
          toast.error(
            "At least one product image is required for active products."
          );
          setIsLoading(false);
          return;
        }
      }

      // Handle file upload (similar to images)
      let finalFileUrl = data.productFile || null;

      // Check if there's a new processed file to upload
      if (processedFile && processedFile.file) {
        // Set uploading flag BEFORE starting upload to prevent form submission
        // Note: This should already be false from image upload, but set it again for safety
        if (!isUploading) {
          setIsUploading(true);
        }
        const fileUploadToastId = toast.loading("Uploading product file...");
        try {
          // Upload the processed file
          const uploadedUrls = await uploadProcessedFiles([processedFile.file]);

          if (uploadedUrls.length > 0) {
            finalFileUrl = uploadedUrls[0];

            // Revoke the blob URL to prevent memory leaks
            const currentValue = form.getValues("productFile");
            if (currentValue && currentValue.startsWith("blob:")) {
              URL.revokeObjectURL(currentValue);
            }

            // Clear the processed file after successful upload
            setProcessedFile(null);
          }
          toast.dismiss(fileUploadToastId);
        } catch (uploadError) {
          console.error("[PRODUCT FORM ERROR] File upload failed:", {
            error:
              uploadError instanceof Error
                ? {
                    name: uploadError.name,
                    message: uploadError.message,
                    stack: uploadError.stack,
                  }
                : uploadError,
            fileName: processedFile?.originalName,
            fileSize: processedFile?.file?.size,
            productId: initialData?.id || "new",
            timestamp: new Date().toISOString(),
          });
          toast.dismiss(fileUploadToastId);
          toast.error("Failed to upload product file. Please try again.");
          setIsLoading(false);
          setIsUploading(false);
          return;
        } finally {
          // Always clear uploading flag, even on error
          setIsUploading(false);
        }
      } else {
        // No new file to upload, use existing URL if it's an HTTP URL
        // If it's a blob URL, it means the file was removed or never uploaded
        if (finalFileUrl && finalFileUrl.startsWith("blob:")) {
          // Blob URL means file was selected but not uploaded - clear it
          finalFileUrl = null;
        } else if (finalFileUrl && !finalFileUrl.startsWith("http")) {
          // Invalid URL format, clear it
          finalFileUrl = null;
        }
      }

      // The schema already handles the conversion to cents/smallest unit
      // Log currency information for debugging
      const currencyInfo = SUPPORTED_CURRENCIES.find(
        (c) => c.code === data.currency
      );
      console.log("[DEBUG] Form data before API call:", {
        currency: data.currency,
        currencyInfo: currencyInfo
          ? {
              name: currencyInfo.name,
              symbol: currencyInfo.symbol,
              decimals: currencyInfo.decimals,
            }
          : "Currency not found",
        price: {
          original: data.price,
          currency: data.currency,
        },
        shippingCost: {
          original: data.shippingCost,
          currency: data.currency,
        },
        handlingFee: {
          original: data.handlingFee,
          currency: data.currency,
        },
        isDraft,
        productId: initialData?.id || "new",
      });

      // Add admin product creation fields if applicable
      const adminFields: {
        createdBy?: string;
        createdVia?: string;
        userId?: string;
      } = {};
      if (canCreateForSellers && selectedSellerId) {
        adminFields.createdBy = userId || "";
        adminFields.createdVia = "ADMIN";
        adminFields.userId = selectedSellerId; // Set to selected seller's userId
      } else if (!canCreateForSellers) {
        // Regular seller creating their own product
        adminFields.createdVia = "SELLER";
      }

      const formData = {
        ...data,
        ...adminFields, // Include admin fields
        images: finalImageUrls, // Use uploaded URLs
        productFile: finalFileUrl, // Use uploaded file URL or null
        status: isDraft ? "DRAFT" : data.status,
        options:
          dropdownOptions.length > 0
            ? convertDropdownOptionsToSchema(dropdownOptions, data.currency)
            : null,
        // Convert empty taxCode to null (taxCode is optional and nullable)
        taxCode:
          data.taxCode && data.taxCode.trim() !== "" ? data.taxCode : null,
        // Schema will handle currency conversion to smallest unit
      };

      console.log(
        "[DEBUG] Form data after conversion (schema will convert monetary values):",
        {
          ...formData,
          // Don't log full formData to avoid cluttering, just key fields
          price: formData.price,
          shippingCost: formData.shippingCost,
          handlingFee: formData.handlingFee,
          currency: formData.currency,
        }
      );

      // CRITICAL: Create product AFTER images are uploaded
      // If this fails, we'll have orphaned images, but at least validation passed
      console.log("[PRODUCT FORM] Creating product with uploaded images...");

      // QA logging: Log submission start
      if (userId) {
        logQaStep({
          userId,
          sessionId,
          event: initialData
            ? QA_EVENTS.PRODUCT_EDIT
            : QA_EVENTS.PRODUCT_CREATE,
          step: PRODUCT_STEPS.SUBMIT,
          status: "started",
          route:
            typeof window !== "undefined"
              ? window.location.pathname
              : "/sell/new",
          metadata: {
            isDraft: isDraft,
            isDigital: data.isDigital,
            imageCount: finalImageUrls.length,
            hasProductFile: !!finalFileUrl,
            isEdit: !!initialData,
          },
        });
      }

      const response = await fetch(
        initialData
          ? `/api/products/${initialData.id}`
          : "/api/products/create-product",
        {
          method: initialData ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            "x-qa-session-id": sessionId, // Send session ID to server
          },
          body: JSON.stringify(formData),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        // CRITICAL: Product creation failed after images were uploaded
        // Log warning about orphaned images (we can't easily delete them from UploadThing)
        if (finalImageUrls.length > validExistingImageUrls.length) {
          const orphanedImageCount =
            finalImageUrls.length - validExistingImageUrls.length;
          console.warn(
            "[PRODUCT FORM WARNING] Product creation failed after image upload. Orphaned images may exist:",
            {
              orphanedImageCount,
              uploadedImageUrls: finalImageUrls.slice(
                validExistingImageUrls.length
              ),
              error: responseData.error || responseData.message,
              productId: initialData?.id || "new",
              timestamp: new Date().toISOString(),
            }
          );
        }
        // Enhanced error logging with currency context
        const currencyInfo = SUPPORTED_CURRENCIES.find(
          (c) => c.code === data.currency
        );
        console.error("[PRODUCT FORM ERROR] API response error:", {
          status: response.status,
          statusText: response.statusText,
          responseData,
          productId: initialData?.id || "new",
          isDraft,
          currency: data.currency,
          currencyInfo: currencyInfo
            ? {
                name: currencyInfo.name,
                symbol: currencyInfo.symbol,
                decimals: currencyInfo.decimals,
              }
            : "Currency not found",
          monetaryValues: {
            price: data.price,
            shippingCost: data.shippingCost,
            handlingFee: data.handlingFee,
          },
          formData: {
            name: data.name,
            status: data.status,
            isDigital: data.isDigital,
            primaryCategory: data.primaryCategory,
            secondaryCategory: data.secondaryCategory,
            imagesCount: finalImageUrls.length,
            hasProductFile: !!finalFileUrl,
          },
          timestamp: new Date().toISOString(),
        });

        // Handle onboarding incomplete error
        if (responseData.onboardingIncomplete) {
          toast.error(
            "Please complete your seller onboarding before activating products"
          );
          return;
        }

        // Handle Zod validation errors from server
        if (responseData.details && Array.isArray(responseData.details)) {
          // This is a ZodError - extract specific error messages
          const errorMessages = responseData.details
            .map((err: any) => err?.message)
            .filter(
              (msg: any): msg is string =>
                typeof msg === "string" && msg.length > 0
            );

          console.error("[PRODUCT FORM ERROR] Server validation errors:", {
            errors: responseData.details,
            errorMessages,
            currency: data.currency,
            productId: initialData?.id || "new",
            timestamp: new Date().toISOString(),
          });

          if (errorMessages.length > 0) {
            const uniqueErrors: string[] = Array.from(new Set(errorMessages));
            // Provide helpful error messages for currency-related issues
            const currencyRelatedErrors = uniqueErrors.filter(
              (err) =>
                err.toLowerCase().includes("currency") ||
                err.toLowerCase().includes("price") ||
                err.toLowerCase().includes("decimal")
            );

            if (currencyRelatedErrors.length > 0 && currencyInfo) {
              toast.error(
                `Currency error (${currencyInfo.name}): ${currencyRelatedErrors[0]}. Please check your price, shipping cost, and handling fee values.`
              );
            } else if (uniqueErrors.length === 1) {
              toast.error(uniqueErrors[0]);
            } else {
              toast.error(
                `Validation errors: ${uniqueErrors.slice(0, 3).join(", ")}${uniqueErrors.length > 3 ? "..." : ""}`
              );
            }
            setIsLoading(false);
            return;
          }
        }

        const errorMessage =
          responseData.error ||
          responseData.message ||
          "Failed to save product";
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      // After successful product creation/update, call the cleanup server action
      if (responseData.product && responseData.product.id) {
        console.log(
          "[DEBUG] Product created/updated successfully, cleaning up temporary uploads"
        );

        // QA logging: Log successful submission
        if (userId) {
          logQaStep({
            userId,
            sessionId,
            event: initialData
              ? QA_EVENTS.PRODUCT_EDIT
              : QA_EVENTS.PRODUCT_CREATE,
            step: PRODUCT_STEPS.SUBMIT,
            status: "completed",
            route:
              typeof window !== "undefined"
                ? window.location.pathname
                : "/sell/new",
            metadata: {
              productId: responseData.product.id,
              isDraft: isDraft,
              isDigital: data.isDigital,
              imageCount: finalImageUrls.length,
              hasProductFile: !!finalFileUrl,
              isEdit: !!initialData,
            },
          });
        }

        // Set the flag to indicate successful submission
        formSubmittedRef.current = true;

        // Prepare the URLs for cleanup
        const urlsToCleanup = [...finalImageUrls];
        if (finalFileUrl) {
          urlsToCleanup.push(finalFileUrl);
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
      setProcessedFile(null); // Clear processed file after successful submission
    } catch (error) {
      // QA logging: Log catch block error
      if (userId) {
        logQaStep({
          userId,
          sessionId,
          event: initialData
            ? QA_EVENTS.PRODUCT_EDIT
            : QA_EVENTS.PRODUCT_CREATE,
          step: PRODUCT_STEPS.SUBMIT,
          status: "failed",
          route:
            typeof window !== "undefined"
              ? window.location.pathname
              : "/sell/new",
          metadata: {
            error: error instanceof Error ? error.message : String(error),
            isDraft: isDraft,
            isEdit: !!initialData,
          },
        });
      }

      // Enhanced error logging with full context
      const currencyInfo = SUPPORTED_CURRENCIES.find(
        (c) => c.code === data.currency
      );
      console.error("[PRODUCT FORM ERROR] Form submission failed:", {
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : error,
        currency: data.currency,
        currencyInfo: currencyInfo
          ? {
              name: currencyInfo.name,
              symbol: currencyInfo.symbol,
              decimals: currencyInfo.decimals,
            }
          : "Currency not found",
        formData: {
          name: data.name,
          status: data.status,
          isDraft,
          isDigital: data.isDigital,
          price: data.price,
          shippingCost: data.shippingCost,
          handlingFee: data.handlingFee,
          currency: data.currency,
          primaryCategory: data.primaryCategory,
          secondaryCategory: data.secondaryCategory,
          imagesCount: data.images?.length || 0,
          hasProductFile: !!data.productFile,
          productId: initialData?.id || "new",
        },
        formErrors: form.formState.errors,
        timestamp: new Date().toISOString(),
      });

      // Check if it's a ZodError
      if (error && typeof error === "object" && "issues" in error) {
        const zodError = error as {
          issues: Array<{ message: string; path: (string | number)[] }>;
        };
        const errorMessages = zodError.issues.map((issue) => issue.message);
        if (errorMessages.length > 0) {
          const uniqueErrors = Array.from(new Set(errorMessages));
          if (uniqueErrors.length === 1) {
            toast.error(uniqueErrors[0]);
          } else {
            toast.error(
              `Validation errors: ${uniqueErrors.slice(0, 3).join(", ")}${uniqueErrors.length > 3 ? "..." : ""}`
            );
          }
        } else {
          toast.error("Validation failed. Please check your input.");
        }
      } else {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";

        toast.error(`Failed to save product: ${errorMessage}`);
      }
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
      console.error("[PRODUCT FORM ERROR] Status update failed:", {
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : error,
        productId: initialData?.id,
        newStatus,
        timestamp: new Date().toISOString(),
      });

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update product status";

      toast.error(errorMessage);
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
      // CRITICAL: Dimensions are optional - use undefined instead of 0
      // This prevents validation errors since 0 is invalid (must be > 0 if provided)
      itemWeight: undefined,
      itemLength: undefined,
      itemWidth: undefined,
      itemHeight: undefined,
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

        {/* Admin Seller Selector - Only shown for admins creating new products */}
        {canCreateForSellers && !initialData && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-blue-200 bg-blue-50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-blue-900">
                  Creating Product on Behalf of Seller
                </h2>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Select a seller to create this product for. Once selected, the
                seller cannot be changed.
              </p>
            </div>
            <div className="p-6">
              {selectedSeller && sellerLocked ? (
                <div className="space-y-4">
                  <Alert className="bg-blue-50 border-blue-200">
                    <Lock className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">
                            Seller Locked: {selectedSeller.shopName}
                          </p>
                          <p className="text-sm mt-1">
                            {selectedSeller.shopTagLine || "No tagline"}
                          </p>
                        </div>
                        <div className="text-right text-sm text-blue-600">
                          <p>Currency: {selectedSeller.preferredCurrency}</p>
                          <p>
                            Units: {selectedSeller.preferredWeightUnit} /{" "}
                            {selectedSeller.preferredDimensionUnit}
                          </p>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                  <div className="bg-white border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      <strong className="text-blue-900">Warning:</strong> This
                      product will appear in{" "}
                      <strong>{selectedSeller.shopName}</strong>&apos;s shop and
                      will be associated with their Stripe account. All sales
                      will go to the seller, not to Yarnnu.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="seller-select"
                      className="text-sm font-medium text-gray-700 mb-2 block"
                    >
                      Select Seller *
                    </Label>
                    <Select
                      value={selectedSellerId || ""}
                      onValueChange={handleSellerSelect}
                      disabled={sellerLocked || loadingSellers}
                    >
                      <SelectTrigger id="seller-select" className="w-full">
                        <SelectValue
                          placeholder={
                            loadingSellers
                              ? "Loading sellers..."
                              : "Choose a seller"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {activeSellers.length === 0 ? (
                          <div className="p-4 text-center text-sm text-gray-500">
                            {loadingSellers
                              ? "Loading..."
                              : "No active sellers found"}
                          </div>
                        ) : (
                          activeSellers.map((seller) => (
                            <SelectItem
                              key={seller.userId}
                              value={seller.userId}
                            >
                              <div className="flex items-center gap-2">
                                {seller.user.image && (
                                  <Image
                                    src={seller.user.image}
                                    alt={seller.shopName}
                                    width={24}
                                    height={24}
                                    className="w-6 h-6 rounded-full"
                                  />
                                )}
                                <div>
                                  <p className="font-medium">
                                    {seller.shopName}
                                  </p>
                                  {seller.user.username && (
                                    <p className="text-xs text-gray-500">
                                      @{seller.user.username}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {!selectedSellerId && (
                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800">
                        You must select a seller before proceeding. The form
                        will load the seller&apos;s preferences (currency,
                        units, GPSR requirements) once selected.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Prevent form submission if admin hasn't selected seller */}
        {canCreateForSellers && !initialData && !selectedSellerId && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Please select a seller above before filling out the product form.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8"
            // Prevent form submission if uploads are in progress
            onKeyDown={(e) => {
              if (e.key === "Enter" && isUploading) {
                e.preventDefault();
                toast.error(
                  "Please wait for uploads to complete before submitting."
                );
              }
            }}
          >
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
                    setProcessedImages={setProcessedImages}
                    processedImages={processedImages}
                    onExistingImagesRemoved={setRemovedExistingImages}
                  />

                  <ProductFileSection
                    form={form}
                    processedFile={processedFile}
                    setProcessedFile={setProcessedFile}
                    existingFileUrl={initialData?.productFile || null}
                  />
                </div>
              </div>

              {/* Inventory & Options Section - Hidden for digital products */}
              {!form.watch("isDigital") && (
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
                    <ProductInventorySection form={form}>
                      <ProductOptionsSection
                        dropdownOptions={dropdownOptions}
                        setDropdownOptions={setDropdownOptions}
                      />
                    </ProductInventorySection>
                  </div>
                </div>
              )}

              {/* Shipping & Dimensions Section - Hidden for digital products */}
              {!form.watch("isDigital") && (
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
                                  // Note: Dimensions (itemWeight, itemLength, itemWidth, itemHeight) are optional
                                  // and no longer included in shippingFields array
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
                      sellerId={selectedSellerId}
                    />
                  </div>
                </div>
              )}

              {/* Story & Details Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Story & Details
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Optional Section. Tell customers about your product and how
                    it&apos;s made
                  </p>
                </div>
                <div className="p-6">
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
                <div className="p-6">
                  <ProductPromotionsSection form={form} />
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
                    Optional Section. Optimize your product for search and
                    social media
                  </p>
                </div>
                <div className="p-6">
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
                      isUploading
                        ? "Uploading images/files..."
                        : initialData
                          ? `Update Product (Status: ${formatStatus(currentStatus || "DRAFT")})`
                          : `Create Product (Status: ${formatStatus(currentStatus || "DRAFT")})`
                    }
                    isPending={isLoading || isUploading}
                  />
                  <p className="text-xs text-gray-500 text-center">
                    {isUploading
                      ? "Please wait for uploads to complete before submitting"
                      : "This will save all changes to your product"}
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
