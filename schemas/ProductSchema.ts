import * as z from "zod";
import { 
  SUPPORTED_CURRENCIES, 
  SUPPORTED_WEIGHT_UNITS, 
  SUPPORTED_DIMENSION_UNITS,
  getCurrencyDecimals 
} from "@/data/units";

// JSON schema for product description
const descriptionJsonSchema = z.object({
  html: z.string(),
  text: z.string(),
}).nullable().refine((val) => !!val, {
  message: "Product description is required.",
});

// Create a base schema for monetary values
const createMonetarySchema = (fieldName: string) => {
  return z.preprocess(
    (val) => {
      if (typeof val === "string") return parseFloat(val);
      if (typeof val === "number") return val;
      return 0;
    },
    z.number()
      .min(0.01, `${fieldName} must be at least $0.01`)
      .refine((val) => Number.isFinite(val), {
        message: `${fieldName} must be a valid number`,
      })
  );
};

// Create a type for the product data
type ProductData = {
  currency: string;
  price: number;
  shippingCost: number;
  handlingFee: number;
};

export const ProductSchema = z
  .object({
    name: z.string().min(1, {
      message: "Please enter your product's name, required.",
    }),
    sku: z.string().optional(), // Optional SKU - will be auto-generated if not provided
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
    price: createMonetarySchema("price"),
    currency: z.enum(SUPPORTED_CURRENCIES.map(c => c.code) as [string, ...string[]], {
      required_error: "Please select a currency",
    }).default("USD"),
    status: z.string(),
    images: z.array(z.string().url()).min(1, {
      message: "Please add at least one image.",
    }),
    isDigital: z.boolean().default(false),
    shippingCost: createMonetarySchema("shippingCost").default(0),
    handlingFee: createMonetarySchema("handlingFee").default(0),
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
    tertiaryCategory: z.string().optional(),
    tags: z.array(z.string()).optional().default([]),
    materialTags: z.array(z.string()).optional().default([]),
    onSale: z.boolean().default(false),
    discount: z.number().int().optional(),
    freeShipping: z.boolean().default(false),
    itemWeight: z.number().optional(),
    itemWeightUnit: z.enum(SUPPORTED_WEIGHT_UNITS.map(u => u.code) as [string, ...string[]]).default("lbs"),
    itemLength: z.number().optional(),
    itemWidth: z.number().optional(),
    itemHeight: z.number().optional(),
    itemDimensionUnit: z.enum(SUPPORTED_DIMENSION_UNITS.map(u => u.code) as [string, ...string[]]).default("in"),
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
    dropTime: z.string().optional(),
    discountEndDate: z
      .union([z.date(), z.string()])
      .optional()
      .transform((value) => {
        if (typeof value === "string") {
          return new Date(value); // Convert string to Date
        }
        return value;
      }),
    discountEndTime: z.string().optional(),
    NSFW: z.boolean().default(false),
    taxCategory: z.enum([
      "PHYSICAL_GOODS",
      "DIGITAL_GOODS",
      "SERVICES",
      "SHIPPING",
      "HANDLING"
    ]).default("PHYSICAL_GOODS"),
    taxCode: z.string().optional(),
    taxExempt: z.boolean().default(false),
    shippingProfileId: z.string().nullable(),
  })
  .transform((data) => {
    // Convert all monetary values to smallest unit
    const decimals = getCurrencyDecimals(data.currency);
    const multiplier = Math.pow(10, decimals);

    return {
      ...data,
      price: Math.round(data.price * multiplier),
      shippingCost: Math.round(data.shippingCost * multiplier),
      handlingFee: Math.round(data.handlingFee * multiplier),
    };
  })
  .superRefine((data, ctx) => {
    // Validate tax category matches product type
    if (data.isDigital && data.taxCategory !== "DIGITAL_GOODS") {
      ctx.addIssue({
        code: "custom",
        message: "Digital products must use the DIGITAL_GOODS tax category.",
        path: ["taxCategory"],
      });
    }

    if (!data.isDigital && data.taxCategory === "DIGITAL_GOODS") {
      ctx.addIssue({
        code: "custom",
        message: "Physical products cannot use the DIGITAL_GOODS tax category.",
        path: ["taxCategory"],
      });
    }

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

    if (data.onSale && data.discountEndTime === undefined) {
      console.log("Validation Error: Discount end time required when on sale.");
      ctx.addIssue({
        code: "custom",
        message: "Discount end time is required when the product is on sale.",
        path: ["discountEndTime"],
      });
    }

    if (data.productDrop && data.dropTime === undefined) {
      console.log("Validation Error: Drop time required for product drops.");
      ctx.addIssue({
        code: "custom",
        message: "Drop time is required for product drops.",
        path: ["dropTime"],
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

    // Validate price based on currency
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === data.currency);
    if (currency) {
      const minPrice = 1 / Math.pow(10, currency.decimals);
      if (data.price < minPrice) {
        ctx.addIssue({
          code: "custom",
          message: `Price must be at least ${currency.symbol}${minPrice} for ${currency.code}`,
          path: ["price"],
        });
      }
    }
  });
