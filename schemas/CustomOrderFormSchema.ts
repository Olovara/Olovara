import * as z from "zod";
import { SUPPORTED_CURRENCIES } from "@/data/units";
import { CUSTOM_ORDER_MAX_REFERENCE_IMAGES } from "@/lib/custom-order-reference-config";

const SUBMISSION_CURRENCY_CODES = SUPPORTED_CURRENCIES.map(
  (c) => c.code,
) as [string, ...string[]];

// Schema for individual form fields
export const CustomOrderFormFieldSchema = z.object({
  id: z.string().optional(), // Optional for new fields
  label: z.string().min(1, "Field label is required").max(100, "Field label must be less than 100 characters"),
  type: z.enum(["text", "textarea", "number", "select", "multiselect", "file", "date", "boolean"], {
    required_error: "Please select a field type",
  }),
  required: z.boolean().default(false),
  placeholder: z.string().max(200, "Placeholder must be less than 200 characters").optional(),
  helpText: z.string().max(500, "Help text must be less than 500 characters").optional(),
  options: z.array(z.string().min(1, "Option cannot be empty")).default([]),
  validation: z.record(z.any()).optional(),
  order: z.number().min(0, "Order must be 0 or greater"),
  isActive: z.boolean().default(true),
});

// Schema for the entire form
export const CustomOrderFormSchema = z.object({
  id: z.string().optional(), // Optional for new forms
  title: z.string().min(1, "Form title is required").max(100, "Form title must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  isActive: z.boolean().default(true),
  fields: z.array(CustomOrderFormFieldSchema).min(1, "At least one field is required"),
});

// Schema for form submission
export const CustomOrderSubmissionSchema = z.object({
  formId: z.string().min(1, "Form ID is required"),
  customerEmail: z.string().email("Valid email is required"), // Will be set from authenticated user
  customerName: z.string().max(100, "Name must be less than 100 characters").optional(), // Optional since we have user data
  /** Major-unit amount in the buyer’s selected (footer) currency. */
  customerBudgetMajor: z
    .number()
    .positive("Enter a budget greater than zero"),
  /** ISO code matching the site footer currency selector when the buyer submitted. */
  customerBudgetCurrency: z.enum(SUBMISSION_CURRENCY_CODES),
  budgetFlexible: z.boolean().default(false),
  /** Reference image URLs from the standard upload (UploadThing), capped per `CUSTOM_ORDER_MAX_REFERENCE_IMAGES`. */
  referenceImageUrls: z
    .array(z.string().url())
    .max(CUSTOM_ORDER_MAX_REFERENCE_IMAGES)
    .default([]),
  responses: z.array(z.object({
    fieldId: z.string().min(1, "Field ID is required"),
    value: z.string().min(1, "Response is required"),
  })),
});

// Schema for updating submission status
export const CustomOrderSubmissionStatusSchema = z
  .object({
    submissionId: z.string().min(1, "Submission ID is required"),
    status: z.enum(["PENDING", "REVIEWED", "APPROVED", "REJECTED", "COMPLETED"], {
      required_error: "Please select a valid status",
    }),
    notes: z.string().max(1000, "Notes must be less than 1000 characters").optional(),
    rejectionReason: z
      .string()
      .max(2000, "Reason must be less than 2000 characters")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "REJECTED") {
      const r = data.rejectionReason?.trim() ?? "";
      if (r.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Please explain why you are rejecting this request - the buyer will see this message",
          path: ["rejectionReason"],
        });
      }
    }
  });

export type CustomOrderFormData = z.infer<typeof CustomOrderFormSchema>;
export type CustomOrderFormFieldData = z.infer<typeof CustomOrderFormFieldSchema>;
export type CustomOrderSubmissionData = z.infer<typeof CustomOrderSubmissionSchema>;
export type CustomOrderSubmissionStatusData = z.infer<typeof CustomOrderSubmissionStatusSchema>; 