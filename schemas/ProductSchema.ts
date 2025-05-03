import * as z from "zod";

// JSON schema for product description
const descriptionJsonSchema = z.object({
  html: z.string(),
  text: z.string(),
}).nullable().refine((val) => !!val, {
  message: "Product description is required.",
});

export const ProductSchema = z
  .object({
    name: z.string().min(1, {
      message: "Please enter your product's name, required.",
    }),
    description: descriptionJsonSchema,
    options: z
      .array(
        z.object({
          name: z.string().min(1, "Option name is required"),
          value: z.string().min(1, "Option value is required"),
        })
      )
      .nullable()
      .optional(),
    price: z
      .number()
      .min(0.01, "Price must be at least $0.01")
      .or(z.string().transform(Number)),
    status: z.string(),
    images: z.array(z.string().url()).min(1, {
      message: "Please add at least one image.",
    }),
    isDigital: z.boolean().default(false),
    shippingCost: z
      .number()
      .min(0)
      .default(0)
      .or(z.string().transform((val) => Number(val || 0))),
    handlingFee: z
      .number()
      .min(0)
      .default(0)
      .or(z.string().transform((val) => Number(val || 0))),
    stock: z
      .number()
      .int()
      .min(1, "Stock is required and must be at least 1 for physical products.")
      .optional()
      .nullable()
      .transform((stock) => (stock === null ? undefined : stock)),
    productFile: z.string().nullable().optional(),
    numberSold: z.number().int().optional().default(0),
    primaryCategory: z.string(),
    secondaryCategory: z.string(),
    tags: z.array(z.string()).optional().default([]),
    materialTags: z.array(z.string()).optional().default([]),
    onSale: z.boolean().default(false),
    discount: z.number().int().optional(),
    freeShipping: z.boolean().default(false),
    itemWeight: z.number().optional(),
    itemLength: z.number().optional(),
    itemWidth: z.number().optional(),
    itemHeight: z.number().optional(),
    shippingNotes: z.string().optional(),
    inStockProcessingTime: z.number().optional(),
    outStockLeadTime: z.number().optional(),
    howItsMade: z.string().optional(),
    productDrop: z.boolean().default(false),
    dropDate: z
      .date()
      .nullable()
      .optional()
      .transform((date) => (date ? date.toISOString() : null)),
    discountEndDate: z
      .union([z.date(), z.string()])
      .optional()
      .transform((value) => {
        if (typeof value === "string") {
          return new Date(value); // Convert string to Date
        }
        return value;
      }),
    NSFW: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    console.log("Refining product data:", data);

    if (data.onSale && data.discount === undefined) {
      console.log("Validation Error: Discount required when on sale.");
      ctx.addIssue({
        code: "custom",
        message: "Discount is required when the product is on sale.",
        path: ["discount"],
      });
    }

    if (data.onSale && data.discountEndDate === undefined) {
      console.log("Validation Error: Discount end date required when on sale.");
      ctx.addIssue({
        code: "custom",
        message: "Discount end date is required when the product is on sale.",
        path: ["discount"],
      });
    }

    if (
      !data.isDigital &&
      !data.freeShipping &&
      (data.shippingCost === undefined || data.shippingCost < 0)
    ) {
      console.log(
        "Validation Error: Shipping cost required for physical products without free shipping."
      );
      ctx.addIssue({
        code: "custom",
        message:
          "Shipping cost is required and must be a positive value when free shipping is not selected.",
        path: ["shippingCost"],
      });
    }

    if (!data.isDigital) {
      console.log("Validating physical product fields...");

      if (data.shippingCost === undefined) {
        console.log("Validation Error: Shipping cost missing.");
        ctx.addIssue({
          code: "custom",
          message: "Shipping cost is required for physical products.",
          path: ["shippingCost"],
        });
      }

      if (!data.isDigital && !data.stock) {
        ctx.addIssue({
          code: "custom",
          message: "Stock is required for physical products.",
          path: ["stock"],
        });
      }

      if (data.itemWeight === undefined) {
        console.log("Validation Error: Item weight missing.");
        ctx.addIssue({
          code: "custom",
          message: "Item weight is required for physical products.",
          path: ["itemWeight"],
        });
      }

      if (data.itemLength === undefined) {
        console.log("Validation Error: Item length missing.");
        ctx.addIssue({
          code: "custom",
          message: "Item length is required for physical products.",
          path: ["itemLength"],
        });
      }

      if (data.itemWidth === undefined) {
        console.log("Validation Error: Item width missing.");
        ctx.addIssue({
          code: "custom",
          message: "Item width is required for physical products.",
          path: ["itemWidth"],
        });
      }

      if (data.itemHeight === undefined) {
        console.log("Validation Error: Item height missing.");
        ctx.addIssue({
          code: "custom",
          message: "Item height is required for physical products.",
          path: ["itemHeight"],
        });
      }
    }
  });
