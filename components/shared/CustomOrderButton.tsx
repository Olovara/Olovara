"use client";

import { useEffect, useState } from "react";
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
import { FileText, LogIn } from "lucide-react";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [submissionData, setSubmissionData] = useState({
    customerEmail: session?.user?.email || "",
    customerName: session?.user?.name || "",
    responses: [] as Array<{ fieldId: string; value: string }>,
  });

  useEffect(() => {
    setSubmissionData((prev) => ({
      ...prev,
      customerEmail: session?.user?.email || prev.customerEmail,
      customerName: session?.user?.name || prev.customerName,
    }));
  }, [session?.user?.email, session?.user?.name]);

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

    const requiredFields = formData.fields.filter((field: any) => field.required);
    for (const field of requiredFields) {
      const response = submissionData.responses.find((r) => r.fieldId === field.id);
      if (!response || !response.value.trim()) {
        toast.error(`Please fill in the required field: ${field.label}`);
        return;
      }
    }

    setIsLoading(true);
    try {
      const result = await submitCustomOrderForm({
        formId: formData.id,
        customerEmail: submissionData.customerEmail.trim(),
        customerName: submissionData.customerName.trim(),
        responses: submissionData.responses,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Custom order request submitted successfully!");
        setIsModalOpen(false);
        setSubmissionData({
          customerEmail: "",
          customerName: "",
          responses: [],
        });
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
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
                <Button type="submit" disabled={isLoading}>
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
