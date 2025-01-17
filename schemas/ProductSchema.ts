import * as z from "zod";

export const ProductSchema = z.object({
  name: z.string().min(6, {
    message: "Please enter your product's name, required.",
  }),
  description: z.string().min(20, {
    message: "Please enter your product's description, required.",
  }),
  price: z.number().min(1, {
    message: "Please enter your product's price, required",
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
  productFile: z
    .string()
    .url({
      message: "Invalid URL format.",
    })
    .optional(),
});