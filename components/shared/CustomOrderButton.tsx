"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  ImageIcon,
  Loader2,
  LogIn,
  X,
} from "lucide-react";
import { CUSTOM_ORDER_MAX_REFERENCE_IMAGES } from "@/lib/custom-order-reference-config";
import { compressImageForUpload } from "@/lib/images/compress-client-image";
import { uploadCustomOrderReferenceImages } from "@/lib/upload-custom-order-reference-images";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getPublicCustomOrderForm, submitCustomOrderForm } from "@/actions/customOrderFormActions";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { isZeroDecimalCurrency, majorToMinorAmount } from "@/data/units";
import { useCurrency } from "@/hooks/useCurrency";

/** Portal may render outside the site layout’s next/font wrapper — keep Jost explicit here. */
const MODAL_FONT = "font-jost";

const MODAL_SELECT_ITEM_CLASS =
  "cursor-pointer data-[highlighted]:bg-brand-primary-100 data-[highlighted]:text-brand-dark-neutral-900 focus:bg-brand-primary-100 focus:text-brand-dark-neutral-900";

const CHECKBOX_BRAND =
  "border-brand-dark-neutral-300 data-[state=checked]:bg-brand-primary-700 data-[state=checked]:border-brand-primary-700 data-[state=checked]:text-brand-light-neutral-50 focus-visible:ring-brand-primary-400 focus-visible:ring-offset-2";

const INPUT_BRAND =
  "border-brand-light-neutral-200 focus-visible:border-brand-primary-400 focus-visible:ring-brand-primary-400";

const SELECT_TRIGGER_BRAND =
  "w-full border-brand-light-neutral-200 bg-background text-brand-dark-neutral-900 hover:border-brand-primary-300 focus:ring-brand-primary-400 data-[state=open]:border-brand-primary-400";

/** Compressed file kept locally for thumbnail; uploaded to storage only after the form passes validation on submit. */
type CustomOrderReferenceItem = {
  id: string;
  /** Blob URL for the compressed image thumbnail. */
  previewUrl: string;
  /** Same pipeline as product photos — uploaded on submit only. */
  file: File;
};

function newReferenceItemId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `ref-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function parseYyyyMmDd(value: string): Date | undefined {
  if (!value?.trim()) return undefined;
  const parts = value.trim().split("-").map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (!y || !m || !d) return undefined;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

interface CustomOrderButtonProps {
  sellerId: string;
  sellerName: string;
  acceptsCustom: boolean;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "outlinePrimary"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export default function CustomOrderButton({
  sellerId,
  sellerName,
  acceptsCustom,
  variant = "outline",
  size = "default",
  className = "",
}: CustomOrderButtonProps) {
  const { data: session, status } = useSession();
  const buyerCurrency = useCurrency((s) => s.currency);
  const formatPriceForBuyer = useCurrency((s) => s.formatPrice);
  const [sellerMinAsBuyerText, setSellerMinAsBuyerText] = useState<string | null>(
    null,
  );
  /** Seller minimum converted to buyer footer currency (minor units); null if none or convert failed. */
  const [sellerMinInBuyerMinor, setSellerMinInBuyerMinor] = useState<number | null>(
    null,
  );
  const [minConvertLoading, setMinConvertLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [submissionData, setSubmissionData] = useState({
    customerEmail: session?.user?.email || "",
    customerName: session?.user?.name || "",
    responses: [] as Array<{ fieldId: string; value: string }>,
    budgetMajor: "",
    budgetFlexible: false,
  });

  /** Local previews + upload state; order is submission order for the seller. */
  const [referenceImageItems, setReferenceImageItems] = useState<CustomOrderReferenceItem[]>([]);
  const referenceImageItemsRef = useRef(referenceImageItems);
  referenceImageItemsRef.current = referenceImageItems;

  useEffect(() => {
    setSubmissionData((prev) => ({
      ...prev,
      customerEmail: session?.user?.email || prev.customerEmail,
      customerName: session?.user?.name || prev.customerName,
    }));
  }, [session?.user?.email, session?.user?.name]);

  const resetSubmissionState = () => {
    setReferenceImageItems((prev) => {
      for (const item of prev) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return [];
    });
    setSubmissionData({
      customerEmail: session?.user?.email || "",
      customerName: session?.user?.name || "",
      responses: [],
      budgetMajor: "",
      budgetFlexible: false,
    });
  };

  const referenceFileInputRef = useRef<HTMLInputElement>(null);
  const referenceListRef = useRef<HTMLUListElement>(null);
  const referenceSectionRef = useRef<HTMLDivElement>(null);
  /** True while compressing newly picked files into WebP thumbnails (not server upload). */
  const [referenceCompressBusy, setReferenceCompressBusy] = useState(false);

  useEffect(() => {
    if (referenceImageItems.length > 0) {
      referenceListRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [referenceImageItems.length]);

  const removeReferenceItem = useCallback((id: string) => {
    setReferenceImageItems((prev) =>
      prev.filter((item) => {
        if (item.id !== id) return true;
        URL.revokeObjectURL(item.previewUrl);
        return false;
      }),
    );
  }, []);

  const moveReferenceItem = useCallback((index: number, delta: -1 | 1) => {
    setReferenceImageItems((prev) => {
      const j = index + delta;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }, []);

  const handleReferenceFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;
    const picked = Array.from(fileList);
    e.target.value = "";

    const prev = referenceImageItemsRef.current;
    const remaining = CUSTOM_ORDER_MAX_REFERENCE_IMAGES - prev.length;
    const batch = picked.slice(0, remaining);
    if (!batch.length) return;

    setReferenceCompressBusy(true);
    try {
      const compressedFiles = await Promise.all(batch.map((f) => compressImageForUpload(f)));
      const newItems: CustomOrderReferenceItem[] = compressedFiles.map((file) => ({
        id: newReferenceItemId(),
        previewUrl: URL.createObjectURL(file),
        file,
      }));
      setReferenceImageItems((p) => [...p, ...newItems].slice(0, CUSTOM_ORDER_MAX_REFERENCE_IMAGES));
    } catch (err) {
      console.error("[CustomOrder] reference image compress:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not prepare images. Try different files or formats.",
      );
    } finally {
      setReferenceCompressBusy(false);
    }
  };

  // Seller minimum in buyer’s currency: display string + numeric minor units for submit validation.
  useEffect(() => {
    const minM = formData?.seller?.customOrderMinBudgetMinor;
    const sellerCur = formData?.seller?.preferredCurrency || "USD";
    if (minM == null || minM <= 0) {
      setSellerMinAsBuyerText(null);
      setSellerMinInBuyerMinor(null);
      setMinConvertLoading(false);
      return;
    }
    let cancelled = false;
    setMinConvertLoading(true);
    setSellerMinInBuyerMinor(null);

    void formatPriceForBuyer(minM, true, sellerCur).then((text) => {
      if (!cancelled) setSellerMinAsBuyerText(text);
    });

    void fetch("/api/currency/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: minM,
        fromCurrency: sellerCur,
        toCurrency: buyerCurrency,
        isCents: true,
      }),
    })
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json() as Promise<{ convertedAmount?: number }>;
      })
      .then((data) => {
        if (cancelled) return;
        if (data && typeof data.convertedAmount === "number") {
          setSellerMinInBuyerMinor(data.convertedAmount);
        }
      })
      .catch(() => {
        if (cancelled) return;
      })
      .finally(() => {
        if (!cancelled) setMinConvertLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    formData?.seller?.customOrderMinBudgetMinor,
    formData?.seller?.preferredCurrency,
    buyerCurrency,
    formatPriceForBuyer,
  ]);

  const handleCustomOrderClick = async () => {
    if (!acceptsCustom) {
      toast.error("This seller doesn't accept custom orders");
      return;
    }

    if (status === "loading") {
      return;
    }

    if (!session?.user) {
      toast.error("Please sign in to submit a custom order request");
      return;
    }

    setIsLoading(true);
    try {
      const result = await getPublicCustomOrderForm(sellerId);
      if (result.error) {
        toast.error("No custom order form available");
        return;
      }

      setFormData(result.data);
      setIsModalOpen(true);
    } catch (error) {
      toast.error("Failed to load custom order form");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!submissionData.customerEmail.trim()) {
      toast.error("Email is required to submit a custom order request");
      return;
    }

    const budgetParsed = parseFloat(
      submissionData.budgetMajor.trim().replace(",", "."),
    );
    if (!Number.isFinite(budgetParsed) || budgetParsed <= 0) {
      toast.error("Enter your budget for this custom order");
      return;
    }

    if (budgetBlocksSubmit) {
      toast.error(
        "Your budget is below this seller's minimum. Increase it or select flexible budget.",
      );
      return;
    }

    const requiredFields = formData.fields.filter((field: any) => field.required);
    for (const field of requiredFields) {
      const response = submissionData.responses.find((r) => r.fieldId === field.id);
      if (!response || !response.value.trim()) {
        toast.error(`Please fill in the required field: ${field.label}`);
        return;
      }
    }

    const referenceFiles = referenceImageItems.map((item) => item.file);

    setIsLoading(true);
    try {
      let referenceImageUrls: string[] = [];
      if (referenceFiles.length > 0) {
        try {
          const { urls } = await uploadCustomOrderReferenceImages(referenceFiles, {
            alreadyCompressed: true,
          });
          referenceImageUrls = urls;
        } catch (uploadErr) {
          toast.error(
            uploadErr instanceof Error
              ? uploadErr.message
              : "Could not upload reference images. Check your connection and try again.",
          );
          return;
        }
      }

      const result = await submitCustomOrderForm({
        formId: formData.id,
        customerEmail: submissionData.customerEmail.trim(),
        customerName: submissionData.customerName.trim(),
        customerBudgetMajor: budgetParsed,
        customerBudgetCurrency: buyerCurrency,
        budgetFlexible: submissionData.budgetFlexible,
        referenceImageUrls,
        responses: submissionData.responses,
      });

      if (result.error) {
        toast.error(result.error);
      } else if ("autoRejected" in result && result.autoRejected) {
        toast.error(
          "This shop requires a higher minimum budget for custom orders. Check your email for details.",
        );
        setIsModalOpen(false);
        setFormData(null);
        resetSubmissionState();
      } else {
        toast.success("Custom order request submitted successfully!");
        setIsModalOpen(false);
        setFormData(null);
        resetSubmissionState();
      }
    } catch (error) {
      toast.error("Failed to submit custom order request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    setSubmissionData((prev) => {
      const existingIndex = prev.responses.findIndex((r) => r.fieldId === fieldId);
      if (existingIndex >= 0) {
        const newResponses = [...prev.responses];
        newResponses[existingIndex] = { fieldId, value };
        return { ...prev, responses: newResponses };
      }
      return {
        ...prev,
        responses: [...prev.responses, { fieldId, value }],
      };
    });
  };

  const getResponseValue = (fieldId: string) =>
    submissionData.responses.find((r) => r.fieldId === fieldId)?.value ?? "";

  const minMinorSeller = formData?.seller?.customOrderMinBudgetMinor;
  const sellerHasMinimum =
    typeof minMinorSeller === "number" && minMinorSeller > 0;
  const budgetMajorParsed = parseFloat(
    submissionData.budgetMajor.trim().replace(",", "."),
  );
  const buyerBudgetMinor =
    Number.isFinite(budgetMajorParsed) && budgetMajorParsed > 0
      ? majorToMinorAmount(budgetMajorParsed, buyerCurrency)
      : null;
  const belowSellerMinimum =
    sellerHasMinimum &&
    !submissionData.budgetFlexible &&
    sellerMinInBuyerMinor != null &&
    buyerBudgetMinor != null &&
    buyerBudgetMinor < sellerMinInBuyerMinor;
  const budgetBlocksSubmit =
    belowSellerMinimum ||
    (sellerHasMinimum &&
      !submissionData.budgetFlexible &&
      minConvertLoading);

  if (!acceptsCustom) {
    return null;
  }

  if (status === "unauthenticated") {
    return (
      <Button
        asChild
        variant={variant}
        size={size}
        className={`flex items-center gap-2 ${className}`}
      >
        <Link href="/login">
          <LogIn className="h-4 w-4" />
          Sign In for Custom Orders
        </Link>
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={handleCustomOrderClick}
        disabled={isLoading || status === "loading"}
        variant={variant}
        size={size}
        className={`flex items-center gap-2 ${className}`}
      >
        <FileText className="h-4 w-4" />
        Custom Order
      </Button>

      <Dialog
        open={isModalOpen}
        onOpenChange={(next) => {
          setIsModalOpen(next);
          if (!next) {
            setFormData(null);
            resetSubmissionState();
          }
        }}
      >
        <DialogContent
          className={cn(
            MODAL_FONT,
            "max-h-[90vh] max-w-2xl overflow-y-auto"
          )}
        >
          <DialogHeader>
            <DialogTitle>Custom Order Request</DialogTitle>
            <DialogDescription>
              Fill out the form below to request a custom order from {sellerName}
            </DialogDescription>
          </DialogHeader>

          {formData && (
            <form onSubmit={handleSubmit} className={cn("space-y-6", MODAL_FONT)}>
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Your Information</h3>
                <div className="rounded-lg border border-brand-light-neutral-200 bg-brand-light-neutral-100 p-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="custom-order-customer-name">Name</Label>
                      <Input
                        id="custom-order-customer-name"
                        value={submissionData.customerName}
                        onChange={(e) =>
                          setSubmissionData((prev) => ({
                            ...prev,
                            customerName: e.target.value,
                          }))
                        }
                        className={INPUT_BRAND}
                        placeholder="Your name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="custom-order-customer-email">Email</Label>
                      <Input
                        id="custom-order-customer-email"
                        type="email"
                        value={submissionData.customerEmail}
                        onChange={(e) =>
                          setSubmissionData((prev) => ({
                            ...prev,
                            customerEmail: e.target.value,
                          }))
                        }
                        className={INPUT_BRAND}
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Your budget</h3>
                <div className="rounded-lg border border-brand-light-neutral-200 bg-brand-light-neutral-100 p-4 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="custom-order-budget">
                      How much are you planning to spend?{" "}
                      <span className="text-red-500">*</span>
                      <span className="ml-1 font-normal text-muted-foreground">
                        ({buyerCurrency})
                      </span>
                    </Label>
                    <Input
                      id="custom-order-budget"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={
                        isZeroDecimalCurrency(buyerCurrency) ? 1 : "0.01"
                      }
                      value={submissionData.budgetMajor}
                      onChange={(e) =>
                        setSubmissionData((prev) => ({
                          ...prev,
                          budgetMajor: e.target.value,
                        }))
                      }
                      className={INPUT_BRAND}
                      placeholder="Amount"
                      required
                    />
                    {sellerMinAsBuyerText && (
                      <p className="text-xs text-muted-foreground">
                        This seller typically accepts custom requests of at least{" "}
                        <span className="font-medium text-foreground">
                          {sellerMinAsBuyerText}
                        </span>{" "}
                        or higher{" "}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="custom-order-budget-flexible"
                      checked={submissionData.budgetFlexible}
                      onCheckedChange={(checked) =>
                        setSubmissionData((prev) => ({
                          ...prev,
                          budgetFlexible: checked === true,
                        }))
                      }
                      className={CHECKBOX_BRAND}
                    />
                    <Label
                      htmlFor="custom-order-budget-flexible"
                      className="text-sm font-normal leading-snug"
                    >
                      I&apos;m flexible on budget if the project needs it
                    </Label>
                  </div>
                  {sellerHasMinimum && !submissionData.budgetFlexible && minConvertLoading && (
                    <p className="text-xs text-muted-foreground">
                      Verifying minimum budget…
                    </p>
                  )}
                  {sellerHasMinimum &&
                    !submissionData.budgetFlexible &&
                    belowSellerMinimum &&
                    !minConvertLoading && (
                      <p className="text-xs text-destructive">
                        Your budget is below this seller&apos;s minimum. Raise it
                        or check flexible budget to submit.
                      </p>
                    )}
                </div>
              </div>

              <div ref={referenceSectionRef} className="space-y-4 scroll-mt-4">
                <h3 className="text-lg font-medium">Reference images</h3>
                <p className="text-xs text-muted-foreground">
                  Thumbnails show below after you pick files.
                </p>
                <div className="rounded-lg border border-brand-light-neutral-200 bg-brand-light-neutral-100 p-4 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Add up to {CUSTOM_ORDER_MAX_REFERENCE_IMAGES} images for style or inspiration.
                    Not required.
                  </p>
                  {referenceImageItems.length > 0 && (
                    <ul
                      ref={referenceListRef}
                      className="flex flex-wrap gap-4 list-none p-0 m-0 overflow-visible"
                    >
                      {referenceImageItems.map((item, index) => (
                          <li
                            key={item.id}
                            className="flex w-[8.5rem] flex-col gap-1.5"
                          >
                            <div
                              className="relative h-32 w-32 shrink-0 overflow-hidden rounded-md border border-brand-light-neutral-200 bg-muted/30"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                              <img
                                src={item.previewUrl}
                                alt={`Reference ${index + 1}`}
                                className="block h-32 w-32 object-cover"
                                width={128}
                                height={128}
                                loading="eager"
                                decoding="async"
                              />
                              <button
                                type="button"
                                onClick={() => removeReferenceItem(item.id)}
                                className="absolute right-1 top-1 z-10 rounded-full bg-brand-dark-neutral-900/85 p-1 text-brand-light-neutral-50 hover:bg-brand-dark-neutral-900"
                                aria-label="Remove image"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="flex justify-center gap-1">
                              <Button
                                type="button"
                                variant="outlinePrimary"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                disabled={index === 0}
                                onClick={() => moveReferenceItem(index, -1)}
                                aria-label="Move image earlier"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="outlinePrimary"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                disabled={index === referenceImageItems.length - 1}
                                onClick={() => moveReferenceItem(index, 1)}
                                aria-label="Move image later"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </li>
                      ))}
                    </ul>
                  )}
                  {referenceImageItems.length < CUSTOM_ORDER_MAX_REFERENCE_IMAGES && (
                    <div className="border border-dashed border-brand-light-neutral-200 rounded-lg p-4 text-center space-y-3">
                      <input
                        ref={referenceFileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        onChange={handleReferenceFilesChange}
                      />
                      <Button
                        type="button"
                        variant="outlinePrimary"
                        className={INPUT_BRAND}
                        disabled={
                          referenceCompressBusy ||
                          referenceImageItems.length >= CUSTOM_ORDER_MAX_REFERENCE_IMAGES
                        }
                        onClick={() => {
                          referenceSectionRef.current?.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                          referenceFileInputRef.current?.click();
                        }}
                      >
                        {referenceCompressBusy ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Preparing…
                          </>
                        ) : (
                          "Choose images"
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, WebP, etc. (max 16MB each).
                      </p>
                    </div>
                  )}
                  {referenceImageItems.length >= CUSTOM_ORDER_MAX_REFERENCE_IMAGES && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 shrink-0" />
                      Maximum of {CUSTOM_ORDER_MAX_REFERENCE_IMAGES} reference images. Remove one
                      to add another.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">{formData.title}</h3>
                {formData.description && (
                  <p className="text-sm text-muted-foreground">{formData.description}</p>
                )}

                {formData.fields.map((field: any) => {
                  const fieldInputId = `custom-order-field-${field.id}`;
                  const raw = getResponseValue(field.id);

                  return (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={fieldInputId}>
                        {field.label}
                        {field.required && <span className="ml-1 text-red-500">*</span>}
                      </Label>

                      {field.type === "text" && (
                        <Input
                          id={fieldInputId}
                          value={raw}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          className={INPUT_BRAND}
                          placeholder={field.placeholder || ""}
                          required={field.required}
                        />
                      )}

                      {field.type === "textarea" && (
                        <Textarea
                          id={fieldInputId}
                          value={raw}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          className={INPUT_BRAND}
                          placeholder={field.placeholder || ""}
                          rows={4}
                          required={field.required}
                        />
                      )}

                      {field.type === "number" && (
                        <Input
                          id={fieldInputId}
                          type="number"
                          value={raw}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          className={INPUT_BRAND}
                          placeholder={field.placeholder || ""}
                          required={field.required}
                        />
                      )}

                      {field.type === "email" && (
                        <Input
                          id={fieldInputId}
                          type="email"
                          value={raw}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          className={INPUT_BRAND}
                          placeholder={field.placeholder || ""}
                          required={field.required}
                        />
                      )}

                      {field.type === "phone" && (
                        <Input
                          id={fieldInputId}
                          type="tel"
                          value={raw}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          className={INPUT_BRAND}
                          placeholder={field.placeholder || ""}
                          required={field.required}
                        />
                      )}

                      {field.type === "select" && (
                        <Select
                          value={raw === "" ? undefined : raw}
                          onValueChange={(v) => handleFieldChange(field.id, v)}
                          required={field.required}
                        >
                          <SelectTrigger id={fieldInputId} className={SELECT_TRIGGER_BRAND}>
                            <SelectValue
                              placeholder={field.placeholder || "Select an option..."}
                            />
                          </SelectTrigger>
                          <SelectContent
                            className={cn(
                              MODAL_FONT,
                              "border-brand-light-neutral-200 bg-brand-light-neutral-50"
                            )}
                          >
                            {field.options.map((option: string, index: number) => (
                              <SelectItem
                                key={index}
                                value={option}
                                className={MODAL_SELECT_ITEM_CLASS}
                              >
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {field.type === "multiselect" && (
                        <div className="space-y-2">
                          {field.options.map((option: string, index: number) => {
                            const currentValue = raw;
                            const values = currentValue ? currentValue.split(", ") : [];
                            const checked = values.includes(option);
                            return (
                              <div key={index} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${fieldInputId}-opt-${index}`}
                                  checked={checked}
                                  onCheckedChange={(isChecked) => {
                                    const next = [...values];
                                    if (isChecked === true) {
                                      if (!next.includes(option)) next.push(option);
                                    } else {
                                      const i = next.indexOf(option);
                                      if (i > -1) next.splice(i, 1);
                                    }
                                    handleFieldChange(field.id, next.join(", "));
                                  }}
                                  className={CHECKBOX_BRAND}
                                />
                                <Label
                                  htmlFor={`${fieldInputId}-opt-${index}`}
                                  className="text-sm font-normal"
                                >
                                  {option}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {field.type === "date" && (
                        <DatePicker
                          id={fieldInputId}
                          brandPrimary
                          date={parseYyyyMmDd(raw)}
                          onDateChange={(d) =>
                            handleFieldChange(field.id, d ? format(d, "yyyy-MM-dd") : "")
                          }
                          placeholder={field.placeholder || "Select date"}
                          className={MODAL_FONT}
                        />
                      )}

                      {field.type === "boolean" && (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={fieldInputId}
                            checked={raw === "true"}
                            onCheckedChange={(checked) =>
                              handleFieldChange(field.id, checked === true ? "true" : "false")
                            }
                            className={CHECKBOX_BRAND}
                            required={field.required}
                          />
                          <Label htmlFor={fieldInputId} className="text-sm font-normal">
                            Yes
                          </Label>
                        </div>
                      )}

                      {field.helpText && (
                        <p className="text-xs text-muted-foreground">{field.helpText}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || budgetBlocksSubmit || referenceCompressBusy}
                >
                  {isLoading ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
