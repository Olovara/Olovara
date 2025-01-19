import * as z from "zod";

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
  primaryCategory: z.string(),
  secondaryCategory: z.array(z.string()),
  onSale: z.boolean().default(false),
  discount: z
    .number()
    .optional(),
}).refine((data) => {
  // Validation that discount is required if onSale is true
  if (data.onSale && data.discount === undefined) {
    return false;
  }

  // Validation that shipping cost and stock are required for physical products
  if (!data.isDigital) {
    if (data.shippingCost === undefined || data.stock === undefined) {
      return false;
    }
  }

  // Validation for numberSold if digital product
  //if (data.isDigital && data.numberSold === undefined) {
  //  return false;
  //}

  return true;
}, {
  message: "Discount is required for onSale products, and shipping/stock are required for physical products.",
  path: ["discount"], // Specify the path where to report the error
});