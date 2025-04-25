import * as z from "zod";

export const SellerSchema = z.object({
  shopName: z.string().min(3, "Shop name is required"),
  shopDescription: z.string().min(6, "Shop description is required"),
  isWomanOwned: z.boolean().default(false),
  isMinorityOwned: z.boolean().default(false),
  isLGBTQOwned: z.boolean().default(false),
  isVeteranOwned: z.boolean().default(false),
  isSustainable: z.boolean().default(false),
  isCharitable: z.boolean().default(false),
  valuesPreferNotToSay: z.boolean().default(false),
});