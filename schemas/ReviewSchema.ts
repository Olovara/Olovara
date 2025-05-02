import * as z from "zod";

export const ReviewSchema = z.object({
  orderId: z.string(),
  reviewerId: z.string(),
  reviewedId: z.string(),
  productId: z.string().optional(),
  rating: z.number().min(1).max(5, "Rating must be between 1 and 5"),
  comment: z.string().max(1000, "Comment must be less than 1000 characters").optional(),
  type: z.enum(["PRODUCT", "SELLER", "BUYER"]),
  status: z.enum(["PENDING", "COMPLETED", "PUBLISHED", "EXPIRED"]).default("PENDING"),
});

export type ReviewFormData = z.infer<typeof ReviewSchema>; 