import { PrimaryCategoryTags, SecondaryCategoryTags } from "@prisma/client";
import * as z from "zod";

// Convert Prisma enum values into a Zod enum
const PrimaryCategoryEnum = z.enum(Object.values(PrimaryCategoryTags) as [string, ...string[]]);
const SecondaryCategoryEnum = z.enum(Object.values(SecondaryCategoryTags) as [string, ...string[]]);

export const ProductSchema = z.object({
  name: z.string().min(1, {
    message: "Please enter your product's name, required.",
  }),
  description: z.any(),
  price: z.number().min(1, {
    message: "Please enter your product's price, required",
  }),
  images: z.array(z.string().url()).min(1, {
    message: "Please add at least one image.",
  }),
  isDigital: z.boolean().default(false),
  shippingCost: z
    .number()
    .min(1, {
      message: "Please enter your product's shipping cost",
    })
    .optional(),
  stock: z
    .number()
    .min(1, {
      message: "Stock must be a positive value.",
    })
    .optional(),
  productFile: z.string().min(1).optional(),
  primaryCategory: PrimaryCategoryEnum,
  secondaryCategory: SecondaryCategoryEnum,
});