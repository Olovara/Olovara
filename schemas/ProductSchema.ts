import * as z from "zod";
import { 
  SUPPORTED_CURRENCIES, 
  SUPPORTED_WEIGHT_UNITS, 
  SUPPORTED_DIMENSION_UNITS,
  getCurrencyDecimals 
} from "@/data/units";

// JSON schema for product description
const descriptionJsonSchema = z.object({
  html: z.string().max(1000, "Description must be 1000 characters or less"),
  text: z.string().max(1000, "Description must be 1000 characters or less"),
}).nullable().refine((val) => {
  if (!val) return false;
  // Check if text content is empty or only contains empty HTML tags
  const textContent = val.text?.trim() || "";
  const isEmpty = 
    textContent === "" || 
    textContent === "<p><br></p>" || 
    textContent === "<p></p>" ||
    textContent.replace(/<[^>]*>/g, "").trim() === "";
  return !isEmpty;
}, {
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
  currency: string
  price: number;
  shippingCost: number;
  handlingFee: number;
}

// Base product schema with common fields
const baseProductSchema = z.object({
  name: z.string().min(1, {
    message: "Please enter your product's name, required.",
  }),
  sku: z.string().optional(), // Optional SKU - will be auto-generated if not provided
  shortDescription: z.string().optional(), // Short description with bullet points for product overview (optional)
  shortDescriptionBullets: z.array(z.string()).max(5, "Maximum 5 bullet points allowed").default([]), // Array of bullet points for short description
  description: descriptionJsonSchema,
  options: z
    .array(
      z.object({
        label: z.string().min(1, "Option label is required"),
        values: z.array(
          z.object({
            name: z.string().min(1, "Option value name is required"),
            price: z.number().min(0, "Price must be non-negative"), // Price in cents
            stock: z.number().int().min(0, "Stock must be non-negative").default(0),
          })
        ).min(1, "At least one option value is required"),
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
  shippingCost: z.preprocess(
    (val) => {
      if (typeof val === "string") return parseFloat(val);
      if (typeof val === "number") return val;
      return 0;
    },
    z.number()
      .min(0, "shippingCost must be at least $0")
      .refine((val) => Number.isFinite(val), {
        message: "shippingCost must be a valid number",
      })
  ).default(0),
  handlingFee: z.preprocess(
    (val) => {
      if (typeof val === "string") return parseFloat(val);
      if (typeof val === "number") return val;
      return 0;
    },
    z.number()
      .min(0, "handlingFee must be at least $0")
      .refine((val) => Number.isFinite(val), {
        message: "handlingFee must be a valid number",
      })
  ).default(0),
  stock: z
    .number()
    .int()
    .min(0, "Stock must be non-negative")
    .optional()
    .nullable()
    .transform((stock) => (stock === null ? undefined : stock)),
  productFile: z.string().nullable().optional(),
  numberSold: z.number().int().optional().default(0),
  primaryCategory: z.string().min(1, "Primary category is required"),
  secondaryCategory: z.string().min(1, "Secondary category is required"),
  tertiaryCategory: z.string().nullable().optional(),
  tags: z.array(z.string()).optional().default([]),
  materialTags: z.array(z.string()).optional().default([]),
  onSale: z.boolean().default(false),
  discount: z.number().int().optional(),
  saleStartDate: z
    .union([z.date(), z.string()])
    .optional()
    .transform((value) => {
      if (!value || (typeof value === "string" && value.trim() === "")) {
        return undefined;
      }
      if (typeof value === "string") {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return undefined;
        }
        return date;
      }
      return value;
    }),
  saleEndDate: z
    .union([z.date(), z.string()])
    .optional()
    .transform((value) => {
      if (!value || (typeof value === "string" && value.trim() === "")) {
        return undefined;
      }
      if (typeof value === "string") {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return undefined;
        }
        return date;
      }
      return value;
    }),
  saleStartTime: z
    .string()
    .nullable()
    .optional()
    .transform((value) => {
      if (!value || (typeof value === "string" && value.trim() === "")) {
        return undefined;
      }
      return value;
    }),
  saleEndTime: z
    .string()
    .nullable()
    .optional()
    .transform((value) => {
      if (!value || (typeof value === "string" && value.trim() === "")) {
        return undefined;
      }
      return value;
    }),
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
  dropTime: z
    .string()
    .nullable()
    .optional()
    .transform((value) => {
      // Convert null or empty string to undefined
      if (!value || (typeof value === "string" && value.trim() === "")) {
        return undefined;
      }
      return value;
    }),
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
  shippingOptionId: z.string().nullable().optional(),
  isTestProduct: z.boolean().default(false),
  // SEO fields
  metaTitle: z.string().max(60, "Meta title must be 60 characters or less").optional(),
  metaDescription: z.string().max(160, "Meta description must be 160 characters or less").optional(),
  keywords: z.array(z.string()).default([]),
  ogTitle: z.string().max(60, "Social media title must be 60 characters or less").optional(),
  ogDescription: z.string().max(160, "Social media description must be 160 characters or less").optional(),
  ogImage: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  
  // GPSR (General Product Safety Regulation) compliance fields
  safetyWarnings: z.string().max(1000, "Safety warnings must be 1000 characters or less").optional(),
  materialsComposition: z.string().max(1000, "Materials composition must be 1000 characters or less").optional(),
  safeUseInstructions: z.string().max(1000, "Safe use instructions must be 1000 characters or less").optional(),
  ageRestriction: z.string().max(200, "Age restriction must be 200 characters or less").optional(),
  chokingHazard: z.boolean().default(false),
  smallPartsWarning: z.boolean().default(false),
  chemicalWarnings: z.string().max(500, "Chemical warnings must be 500 characters or less").optional(),
  careInstructions: z.string().max(1000, "Care instructions must be 1000 characters or less").optional(),
});

// Draft schema - allows incomplete products (only name is required)
export const ProductDraftSchema = baseProductSchema
  .partial()
  .extend({
    // Only name is required for drafts - override the partial to make it required
    name: z.string().min(1, "Product name is required even for drafts"),
    // Make description optional (override the required descriptionJsonSchema)
    description: z.object({
      html: z.string(),
      text: z.string(),
    }).nullable().optional(),
    // Make images optional
    images: z.array(z.string().url()).optional(),
    // Make categories optional
    primaryCategory: z.string().optional(),
    secondaryCategory: z.string().optional(),
    // Make price optional with default 0
    price: z.preprocess(
      (val) => {
        if (val === undefined || val === null || val === "") return 0;
        if (typeof val === "string") return parseFloat(val) || 0;
        if (typeof val === "number") return val;
        return 0;
      },
      z.number()
        .min(0, "Price must be at least $0 for drafts")
        .refine((val) => Number.isFinite(val), {
          message: "Price must be a valid number",
        })
        .default(0)
    ),
  })
  .transform((data) => {
    // Convert all monetary values to smallest unit (with defaults for drafts)
    const currency = data.currency || "USD";
    const decimals = getCurrencyDecimals(currency);
    const multiplier = Math.pow(10, decimals);

    return {
      ...data,
      price: Math.round((data.price || 0) * multiplier),
      shippingCost: Math.round((data.shippingCost || 0) * multiplier),
      handlingFee: Math.round((data.handlingFee || 0) * multiplier),
    };
  });

// Full product schema - requires all fields for active products
export const ProductSchema = baseProductSchema
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

    if (data.onSale) {
      // Check for saleEndDate/saleEndTime (products use these fields)
      const endDate = (data as any).saleEndDate;
      const endTime = (data as any).saleEndTime;
      
      if (!endDate || (endDate instanceof Date && isNaN(endDate.getTime()))) {
        console.log("Validation Error: Sale end date required when on sale.");
        ctx.addIssue({
          code: "custom",
          message: "Sale end date is required when the product is on sale.",
          path: ["saleEndDate"],
        });
      }
      if (!endTime || (typeof endTime === "string" && endTime.trim() === "")) {
        console.log("Validation Error: Sale end time required when on sale.");
        ctx.addIssue({
          code: "custom",
          message: "Sale end time is required when the product is on sale.",
          path: ["saleEndTime"],
        });
      }
    }

    if (data.productDrop) {
      if (!data.dropDate) {
        console.log("Validation Error: Drop date required for product drops.");
        ctx.addIssue({
          code: "custom",
          message: "Drop date is required for product drops.",
          path: ["dropDate"],
        });
      }
      if (!data.dropTime || data.dropTime.trim() === "") {
        console.log("Validation Error: Drop time required for product drops.");
        ctx.addIssue({
          code: "custom",
          message: "Drop time is required for product drops.",
          path: ["dropTime"],
        });
      }
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

      // Only require shipping cost if free shipping is not selected
      if (!data.freeShipping && (data.shippingCost === undefined || data.shippingCost <= 0)) {
        console.log("Validation Error: Shipping cost required when free shipping is not selected.");
        ctx.addIssue({
          code: "custom",
          message: "Shipping cost is required when free shipping is not selected.",
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

      // Require shipping option if free shipping is not selected
      if (!data.freeShipping && (!data.shippingOptionId || data.shippingOptionId === "")) {
        ctx.addIssue({
          code: "custom",
          message: "Shipping option is required when free shipping is not selected.",
          path: ["shippingOptionId"],
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

    // Additional validations for active products
    if (!data.description || !data.description.html || data.description.html.trim() === "") {
      ctx.addIssue({
        code: "custom",
        message: "Product description is required for active products.",
        path: ["description"],
      });
    }

    if (!data.images || data.images.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "At least one product image is required for active products.",
        path: ["images"],
      });
    }

    if (!data.isDigital && (!data.stock || data.stock < 1)) {
      ctx.addIssue({
        code: "custom",
        message: "Stock quantity is required and must be at least 1 for physical products.",
        path: ["stock"],
      });
    }

    if (data.isDigital && !data.productFile) {
      ctx.addIssue({
        code: "custom",
        message: "Product file is required for digital products.",
        path: ["productFile"],
      });
    }
  });
