import * as z from "zod";

export const ShopPoliciesSchema = z.object({
  processingTime: z.string().min(1, "Processing time is required").max(500, "Processing time must be less than 500 characters"),
  returnsPolicy: z.string().min(1, "Returns policy is required").max(2000, "Returns policy must be less than 2000 characters"),
  exchangesPolicy: z.string().min(1, "Exchanges policy is required").max(2000, "Exchanges policy must be less than 2000 characters"),
  damagesPolicy: z.string().min(1, "Damages policy is required").max(2000, "Damages policy must be less than 2000 characters"),
  nonReturnableItems: z.string().min(1, "Non-returnable items policy is required").max(2000, "Non-returnable items policy must be less than 2000 characters"),
  refundPolicy: z.string().min(1, "Refund policy is required").max(2000, "Refund policy must be less than 2000 characters"),
});

export type ShopPoliciesFormData = z.infer<typeof ShopPoliciesSchema>; 