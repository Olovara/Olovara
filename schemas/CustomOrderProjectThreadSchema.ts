import * as z from "zod";
import { CUSTOM_ORDER_MAX_PROGRESS_IMAGES } from "@/lib/custom-order-progress-config";

export const CreateProgressUpdateSchema = z
  .object({
    submissionId: z.string().min(1),
    body: z.string().max(8000).optional(),
    imageUrls: z
      .array(z.string().min(1))
      .max(CUSTOM_ORDER_MAX_PROGRESS_IMAGES)
      .optional()
      .default([]),
    requiresApproval: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const text = data.body?.trim() ?? "";
    const imgs = data.imageUrls ?? [];
    if (text.length === 0 && imgs.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add a note and/or at least one image",
        path: ["body"],
      });
    }
  });

export const ProgressCommentSchema = z.object({
  updateId: z.string().min(1),
  body: z.string().trim().min(1).max(4000),
});

export const ProgressApprovalResponseSchema = z.object({
  updateId: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
  note: z.string().max(2000).optional(),
});
