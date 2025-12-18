import * as z from "zod";
import {
  SUPPORTED_CURRENCIES,
  SUPPORTED_WEIGHT_UNITS,
  SUPPORTED_DIMENSION_UNITS,
  getCurrencyDecimals,
} from "@/data/units";

// JSON schema for product description
const descriptionJsonSchema = z
  .object({
    html: z.string().max(2000, "Description must be 2000 characters or less"),
    text: z.string().max(2000, "Description must be 2000 characters or less"),
  })
  .nullable()
  .refine(
    (val) => {
      if (!val) return false;
      // Check if text content is empty or only contains empty HTML tags
      const textContent = val.text?.trim() || "";
      const isEmpty =
        textContent === "" ||
        textContent === "<p><br></p>" ||
        textContent === "<p></p>" ||
        textContent.replace(/<[^>]*>/g, "").trim() === "";
      return !isEmpty;
    },
    {
      message: "Product description is required.",
    }
  );

// Create a base schema for monetary values
// Note: Currency-specific validation happens in superRefine after currency is known
const createMonetarySchema = (fieldName: string) => {
  return z.preprocess(
    (val) => {
      if (typeof val === "string") {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0 : parsed;
      }
      if (typeof val === "number") return val;
      return 0;
    },
    z
      .number()
      .min(0, `${fieldName} must be non-negative`)
      .refine((val) => Number.isFinite(val), {
        message: `${fieldName} must be a valid number`,
      })
      .refine((val) => !isNaN(val), {
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

// Base product schema with common fields
const baseProductSchema = z.object({
  name: z.string().min(1, {
    message: "Please enter your product's name, required.",
  }),
  sku: z
    .string()
    .optional()
    .transform((val) =>
      val && typeof val === "string" && val.trim() !== "" ? val : undefined
    ), // Optional SKU - will be auto-generated if not provided
  shortDescription: z
    .string()
    .optional()
    .transform((val) =>
      val && typeof val === "string" && val.trim() !== "" ? val : undefined
    ), // Short description with bullet points for product overview (optional)
  shortDescriptionBullets: z
    .array(z.string())
    .max(5, "Maximum 5 bullet points allowed")
    .default([]), // Array of bullet points for short description
  description: descriptionJsonSchema,
  options: z
    .array(
      z.object({
        label: z.string().min(1, "Option label is required"),
        values: z
          .array(
            z.object({
              name: z.string().min(1, "Option value name is required"),
              price: z.number().min(0, "Price must be non-negative").default(0), // Optional additional price in cents - defaults to 0 (base price only) if not provided
              stock: z
                .number()
                .int()
                .min(0, "Stock must be non-negative")
                .default(0),
            })
          )
          .min(1, "At least one option value is required"),
      })
    )
    .nullable()
    .optional(),
  price: createMonetarySchema("price"),
  currency: z
    .enum(SUPPORTED_CURRENCIES.map((c) => c.code) as [string, ...string[]], {
      required_error: "Please select a currency",
    })
    .default("USD"),
  status: z.string(),
  images: z.array(z.string().url()).min(1, {
    message: "Please add at least one image.",
  }),
  isDigital: z.boolean().default(false),
  shippingCost: z
    .preprocess(
      (val) => {
        if (typeof val === "string") return parseFloat(val);
        if (typeof val === "number") return val;
        return 0;
      },
      z
        .number()
        .min(0, "shippingCost must be at least $0")
        .refine((val) => Number.isFinite(val), {
          message: "shippingCost must be a valid number",
        })
    )
    .default(0),
  handlingFee: z
    .preprocess(
      (val) => {
        if (typeof val === "string") return parseFloat(val);
        if (typeof val === "number") return val;
        return 0;
      },
      z
        .number()
        .min(0, "handlingFee must be at least $0")
        .refine((val) => Number.isFinite(val), {
          message: "handlingFee must be a valid number",
        })
    )
    .default(0),
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
  tertiaryCategory: z
    .string()
    .nullable()
    .optional()
    .transform((val) =>
      val && typeof val === "string" && val.trim() !== "" ? val : null
    ),
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
  // CRITICAL: If itemWeight is provided (not undefined), it must be greater than 0
  // This prevents sellers from entering 0, which is invalid for shipping calculations
  // Transform 0 to undefined so it's treated as "not provided" rather than invalid
  itemWeight: z
    .number()
    .optional()
    .transform((val) => (val === 0 ? undefined : val))
    .refine((val) => val === undefined || val > 0, {
      message: "Item weight must be greater than 0 if provided.",
    }),
  itemWeightUnit: z
    .enum(SUPPORTED_WEIGHT_UNITS.map((u) => u.code) as [string, ...string[]])
    .default("lbs"),
  // CRITICAL: If dimensions are provided (not undefined), they must be greater than 0
  // This prevents sellers from entering 0, which is invalid for shipping calculations
  // Transform 0 to undefined so it's treated as "not provided" rather than invalid
  itemLength: z
    .number()
    .optional()
    .transform((val) => (val === 0 ? undefined : val))
    .refine((val) => val === undefined || val > 0, {
      message: "Item length must be greater than 0 if provided.",
    }),
  itemWidth: z
    .number()
    .optional()
    .transform((val) => (val === 0 ? undefined : val))
    .refine((val) => val === undefined || val > 0, {
      message: "Item width must be greater than 0 if provided.",
    }),
  itemHeight: z
    .number()
    .optional()
    .transform((val) => (val === 0 ? undefined : val))
    .refine((val) => val === undefined || val > 0, {
      message: "Item height must be greater than 0 if provided.",
    }),
  itemDimensionUnit: z
    .enum(SUPPORTED_DIMENSION_UNITS.map((u) => u.code) as [string, ...string[]])
    .default("in"),
  shippingNotes: z
    .string()
    .optional()
    .transform((val) =>
      val && typeof val === "string" && val.trim() !== "" ? val : undefined
    ),
  inStockProcessingTime: z.number().optional(),
  outStockLeadTime: z.number().optional(),
  howItsMade: z
    .string()
    .optional()
    .transform((val) =>
      val && typeof val === "string" && val.trim() !== "" ? val : undefined
    ),
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
  taxCategory: z
    .enum([
      "PHYSICAL_GOODS",
      "DIGITAL_GOODS",
      "SERVICES",
      "SHIPPING",
      "HANDLING",
    ])
    .default("PHYSICAL_GOODS"),
  taxCode: z
    .string()
    .optional()
    .transform((val) =>
      val && typeof val === "string" && val.trim() !== "" ? val : undefined
    ),
  taxExempt: z.boolean().default(false),
  shippingOptionId: z.string().nullable().optional(),
  isTestProduct: z.boolean().default(false),
  // SEO fields
  metaTitle: z
    .string()
    .max(60, "Meta title must be 60 characters or less")
    .optional()
    .transform((val) =>
      val && typeof val === "string" && val.trim() !== "" ? val : undefined
    ),
  metaDescription: z
    .string()
    .max(160, "Meta description must be 160 characters or less")
    .optional()
    .transform((val) =>
      val && typeof val === "string" && val.trim() !== "" ? val : undefined
    ),
  keywords: z.array(z.string()).default([]),
  ogTitle: z
    .string()
    .max(60, "Social media title must be 60 characters or less")
    .optional()
    .transform((val) =>
      val && typeof val === "string" && val.trim() !== "" ? val : undefined
    ),
  ogDescription: z
    .string()
    .max(160, "Social media description must be 160 characters or less")
    .optional()
    .transform((val) =>
      val && typeof val === "string" && val.trim() !== "" ? val : undefined
    ),
  ogImage: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal(""))
    .transform((val) =>
      val && typeof val === "string" && val.trim() !== "" ? val : undefined
    ),

  // GPSR (General Product Safety Regulation) compliance fields
  safetyWarnings: z
    .string()
    .max(1000, "Safety warnings must be 1000 characters or less")
    .optional()
    .transform((val) =>
      val && typeof val === "string" && val.trim() !== "" ? val : undefined
    ),
  materialsComposition: z
    .string()
    .max(1000, "Materials composition must be 1000 characters or less")
    .optional()
    .transform((val) =>
      val && typeof val === "string" && val.trim() !== "" ? val : undefined
    ),
  safeUseInstructions: z
    .string()
    .max(1000, "Safe use instructions must be 1000 characters or less")
    .optional()
    .transform((val) =>
      val && typeof val === "string" && val.trim() !== "" ? val : undefined
    ),
  ageRestriction: z
    .string()
    .max(200, "Age restriction must be 200 characters or less")
    .optional()
    .transform((val) =>
      val && typeof val === "string" && val.trim() !== "" ? val : undefined
    ),
  chokingHazard: z.boolean().default(false),
  smallPartsWarning: z.boolean().default(false),
  chemicalWarnings: z
    .string()
    .max(500, "Chemical warnings must be 500 characters or less")
    .optional()
    .transform((val) =>
      val && typeof val === "string" && val.trim() !== "" ? val : undefined
    ),
  careInstructions: z
    .string()
    .max(1000, "Care instructions must be 1000 characters or less")
    .optional()
    .transform((val) =>
      val && typeof val === "string" && val.trim() !== "" ? val : undefined
    ),
});

// Draft schema - allows incomplete products (only name is required)
export const ProductDraftSchema = baseProductSchema
  .partial()
  .extend({
    // Only name is required for drafts - override the partial to make it required
    name: z.string().min(1, "Product name is required even for drafts"),
    // Make description optional (override the required descriptionJsonSchema)
    description: z
      .object({
        html: z.string(),
        text: z.string(),
      })
      .nullable()
      .optional(),
    // Make images optional
    images: z.array(z.string().url()).optional(),
    // Make categories optional
    primaryCategory: z.string().optional(),
    secondaryCategory: z.string().optional(),
    // Make price optional with default 0
    price: z.preprocess(
      (val) => {
        if (val === undefined || val === null || val === "") return 0;
        if (typeof val === "string") {
          const parsed = parseFloat(val);
          return isNaN(parsed) ? 0 : parsed;
        }
        if (typeof val === "number") return val;
        return 0;
      },
      z
        .number()
        .min(0, "Price must be non-negative for drafts")
        .refine((val) => Number.isFinite(val), {
          message: "Price must be a valid number",
        })
        .refine((val) => !isNaN(val), {
          message: "Price must be a valid number",
        })
        .default(0)
    ),
  })
  .transform((data) => {
    // Convert all monetary values to smallest unit (with defaults for drafts)
    // For currencies with 2 decimals (USD, EUR, etc.): multiplier = 100, converts dollars to cents
    // For currencies with 0 decimals (JPY, HUF, IDR, XOF): multiplier = 1, no conversion needed
    // Math.round() handles both cases correctly - see ProductSchema transform for details
    try {
      const currency = data.currency || "USD";
      const decimals = getCurrencyDecimals(currency);
      const multiplier = Math.pow(10, decimals);

      // Validate multiplier is valid
      if (!Number.isFinite(multiplier) || multiplier <= 0) {
        console.error(
          "[PRODUCT DRAFT SCHEMA ERROR] Invalid currency multiplier:",
          {
            currency,
            decimals,
            multiplier,
          }
        );
        throw new Error(`Invalid currency configuration for ${currency}`);
      }

      // Round to avoid floating point errors (e.g., 10.99 * 100 = 1098.9999999999999)
      // Math.round ensures we get the correct integer value
      const convertedPrice = Math.round((data.price || 0) * multiplier);
      const convertedShippingCost = Math.round(
        (data.shippingCost || 0) * multiplier
      );
      const convertedHandlingFee = Math.round(
        (data.handlingFee || 0) * multiplier
      );

      // Validate conversions are valid numbers
      if (
        !Number.isFinite(convertedPrice) ||
        !Number.isFinite(convertedShippingCost) ||
        !Number.isFinite(convertedHandlingFee)
      ) {
        console.error(
          "[PRODUCT DRAFT SCHEMA ERROR] Currency conversion produced invalid values:",
          {
            currency,
            decimals,
            originalPrice: data.price || 0,
            originalShippingCost: data.shippingCost || 0,
            originalHandlingFee: data.handlingFee || 0,
            convertedPrice,
            convertedShippingCost,
            convertedHandlingFee,
          }
        );
        throw new Error(`Currency conversion failed for ${currency}`);
      }

      return {
        ...data,
        price: convertedPrice,
        shippingCost: convertedShippingCost,
        handlingFee: convertedHandlingFee,
      };
    } catch (error) {
      console.error(
        "[PRODUCT DRAFT SCHEMA ERROR] Error in currency conversion transform:",
        {
          error:
            error instanceof Error
              ? {
                  name: error.name,
                  message: error.message,
                  stack: error.stack,
                }
              : error,
          currency: data.currency || "USD",
          price: data.price || 0,
          shippingCost: data.shippingCost || 0,
          handlingFee: data.handlingFee || 0,
          timestamp: new Date().toISOString(),
        }
      );
      throw error;
    }
  });

// Full product schema - requires all fields for active products
export const ProductSchema = baseProductSchema
  .transform((data) => {
    // Convert all monetary values to smallest unit
    // For currencies with 2 decimals (USD, EUR, etc.): multiplier = 100, converts dollars to cents
    // For currencies with 0 decimals (JPY, HUF, IDR, XOF): multiplier = 1, no conversion needed
    // Math.round() handles both cases correctly:
    //   - JPY: Math.round(1000 * 1) = 1000 (no change, already in smallest unit)
    //   - USD: Math.round(10.99 * 100) = 1099 (converts dollars to cents)
    try {
      const decimals = getCurrencyDecimals(data.currency);
      const multiplier = Math.pow(10, decimals);

      // Validate multiplier is valid
      if (!Number.isFinite(multiplier) || multiplier <= 0) {
        console.error("[PRODUCT SCHEMA ERROR] Invalid currency multiplier:", {
          currency: data.currency,
          decimals,
          multiplier,
        });
        throw new Error(`Invalid currency configuration for ${data.currency}`);
      }

      // Round to avoid floating point errors (e.g., 10.99 * 100 = 1098.9999999999999)
      // Math.round ensures we get the correct integer value
      const convertedPrice = Math.round(data.price * multiplier);
      const convertedShippingCost = Math.round(data.shippingCost * multiplier);
      const convertedHandlingFee = Math.round(data.handlingFee * multiplier);

      // Validate conversions are valid numbers
      if (
        !Number.isFinite(convertedPrice) ||
        !Number.isFinite(convertedShippingCost) ||
        !Number.isFinite(convertedHandlingFee)
      ) {
        console.error(
          "[PRODUCT SCHEMA ERROR] Currency conversion produced invalid values:",
          {
            currency: data.currency,
            decimals,
            originalPrice: data.price,
            originalShippingCost: data.shippingCost,
            originalHandlingFee: data.handlingFee,
            convertedPrice,
            convertedShippingCost,
            convertedHandlingFee,
          }
        );
        throw new Error(`Currency conversion failed for ${data.currency}`);
      }

      return {
        ...data,
        price: convertedPrice,
        shippingCost: convertedShippingCost,
        handlingFee: convertedHandlingFee,
      };
    } catch (error) {
      console.error(
        "[PRODUCT SCHEMA ERROR] Error in currency conversion transform:",
        {
          error:
            error instanceof Error
              ? {
                  name: error.name,
                  message: error.message,
                  stack: error.stack,
                }
              : error,
          currency: data.currency,
          price: data.price,
          shippingCost: data.shippingCost,
          handlingFee: data.handlingFee,
          timestamp: new Date().toISOString(),
        }
      );
      throw error;
    }
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

    // Note: Discount validation is now handled in the onSale block below
    // This ensures discount is validated along with other sale-related fields

    if (data.onSale) {
      // Validate discount is provided and valid
      if (data.discount === undefined || data.discount === null) {
        console.log("Validation Error: Discount required when on sale.");
        ctx.addIssue({
          code: "custom",
          message:
            "Discount percentage is required when the product is on sale.",
          path: ["discount"],
        });
      } else if (data.discount < 0 || data.discount > 100) {
        console.log("Validation Error: Discount must be between 0 and 100.");
        ctx.addIssue({
          code: "custom",
          message: "Discount percentage must be between 0 and 100.",
          path: ["discount"],
        });
      }

      // Validate sale end date and time (required for active sales)
      const endDate = (data as any).saleEndDate;
      const endTime = (data as any).saleEndTime;

      // Handle both Date objects and ISO strings
      let isValidEndDate = false;
      let endDateValue: Date | null = null;

      if (endDate) {
        if (endDate instanceof Date) {
          isValidEndDate = !isNaN(endDate.getTime());
          endDateValue = endDate;
        } else if (typeof endDate === "string" && endDate.trim() !== "") {
          const parsedDate = new Date(endDate);
          isValidEndDate = !isNaN(parsedDate.getTime());
          endDateValue = parsedDate;
        }
      }

      if (!isValidEndDate) {
        console.log("Validation Error: Sale end date required when on sale.");
        ctx.addIssue({
          code: "custom",
          message:
            "Sale end date is required and must be a valid date when the product is on sale.",
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

      // Validate sale start date and time if provided (optional but must be valid if provided)
      const startDate = (data as any).saleStartDate;
      const startTime = (data as any).saleStartTime;

      if (startDate) {
        let isValidStartDate = false;
        let startDateValue: Date | null = null;

        if (startDate instanceof Date) {
          isValidStartDate = !isNaN(startDate.getTime());
          startDateValue = startDate;
        } else if (typeof startDate === "string" && startDate.trim() !== "") {
          const parsedDate = new Date(startDate);
          isValidStartDate = !isNaN(parsedDate.getTime());
          startDateValue = parsedDate;
        }

        if (!isValidStartDate) {
          console.log(
            "Validation Error: Sale start date must be a valid date if provided."
          );
          ctx.addIssue({
            code: "custom",
            message: "Sale start date must be a valid date if provided.",
            path: ["saleStartDate"],
          });
        }

        // If start date is provided, validate it's before end date
        if (
          isValidStartDate &&
          isValidEndDate &&
          startDateValue &&
          endDateValue
        ) {
          if (startDateValue >= endDateValue) {
            ctx.addIssue({
              code: "custom",
              message: "Sale start date must be before the sale end date.",
              path: ["saleStartDate"],
            });
          }
        }
      }
    }

    if (data.productDrop) {
      // Validate drop date - after transform, dropDate is an ISO string or null
      let isValidDropDate = false;
      let dropDateValue: Date | null = null;

      // dropDate is transformed to ISO string in schema, so it's string | null here
      const dropDate = data.dropDate as string | null | undefined;

      if (dropDate && typeof dropDate === "string" && dropDate.trim() !== "") {
        const parsedDate = new Date(dropDate);
        isValidDropDate = !isNaN(parsedDate.getTime());
        if (isValidDropDate) {
          dropDateValue = parsedDate;
        }
      }

      if (!isValidDropDate || !dropDateValue) {
        console.log("Validation Error: Drop date required for product drops.");
        ctx.addIssue({
          code: "custom",
          message:
            "Drop date is required and must be a valid date for product drops.",
          path: ["dropDate"],
        });
      }

      if (
        !data.dropTime ||
        (typeof data.dropTime === "string" && data.dropTime.trim() === "")
      ) {
        console.log("Validation Error: Drop time required for product drops.");
        ctx.addIssue({
          code: "custom",
          message: "Drop time is required for product drops.",
          path: ["dropTime"],
        });
      }

      // Validate drop date is in the future
      if (isValidDropDate && dropDateValue) {
        const now = new Date();
        if (dropDateValue <= now) {
          ctx.addIssue({
            code: "custom",
            message: "Drop date must be in the future.",
            path: ["dropDate"],
          });
        }
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
      if (
        !data.freeShipping &&
        (data.shippingCost === undefined || data.shippingCost <= 0)
      ) {
        console.log(
          "Validation Error: Shipping cost required when free shipping is not selected."
        );
        ctx.addIssue({
          code: "custom",
          message:
            "Shipping cost is required when free shipping is not selected.",
          path: ["shippingCost"],
        });
      }

      // Validate shipping cost and handling fee decimal places match currency
      const currency = SUPPORTED_CURRENCIES.find(
        (c) => c.code === data.currency
      );
      if (currency && !data.freeShipping && data.shippingCost > 0) {
        const shippingCostString = data.shippingCost.toString();
        const decimalIndex = shippingCostString.indexOf(".");
        if (decimalIndex !== -1) {
          const decimalPlaces = shippingCostString.length - decimalIndex - 1;
          if (decimalPlaces > currency.decimals) {
            ctx.addIssue({
              code: "custom",
              message: `Shipping cost for ${currency.name} (${currency.code}) only supports ${currency.decimals} decimal place${currency.decimals === 0 ? "" : "s"}. Please enter a whole number or use up to ${currency.decimals} decimal place${currency.decimals === 0 ? "" : "s"}.`,
              path: ["shippingCost"],
            });
          }
        }
      }

      if (currency && data.handlingFee > 0) {
        const handlingFeeString = data.handlingFee.toString();
        const decimalIndex = handlingFeeString.indexOf(".");
        if (decimalIndex !== -1) {
          const decimalPlaces = handlingFeeString.length - decimalIndex - 1;
          if (decimalPlaces > currency.decimals) {
            ctx.addIssue({
              code: "custom",
              message: `Handling fee for ${currency.name} (${currency.code}) only supports ${currency.decimals} decimal place${currency.decimals === 0 ? "" : "s"}. Please enter a whole number or use up to ${currency.decimals} decimal place${currency.decimals === 0 ? "" : "s"}.`,
              path: ["handlingFee"],
            });
          }
        }
      }

      if (!data.isDigital && !data.stock) {
        ctx.addIssue({
          code: "custom",
          message: "Stock is required for physical products.",
          path: ["stock"],
        });
      }

      // Require shipping option if free shipping is not selected AND product is not digital
      // CRITICAL: Digital products don't need shipping options
      // This validation is important for international sellers who may have different shipping setups
      if (
        !data.isDigital &&
        !data.freeShipping &&
        (!data.shippingOptionId || data.shippingOptionId === "")
      ) {
        ctx.addIssue({
          code: "custom",
          message:
            "Shipping option is required for physical products when free shipping is not selected.",
          path: ["shippingOptionId"],
        });
      }

      // CRITICAL: Item weight and dimensions validation
      // These fields are OPTIONAL for all products (physical and digital)
      // If provided (not undefined/null), they must be greater than 0
      // This prevents invalid 0 values which break shipping calculations
      // Note: The schema-level refine() already handles this, but we keep this for clarity
      if (data.itemWeight !== undefined && data.itemWeight !== null) {
        if (data.itemWeight <= 0) {
          ctx.addIssue({
            code: "custom",
            message: "Item weight must be greater than 0 if provided.",
            path: ["itemWeight"],
          });
        }
      }

      if (data.itemLength !== undefined && data.itemLength !== null) {
        if (data.itemLength <= 0) {
          ctx.addIssue({
            code: "custom",
            message: "Item length must be greater than 0 if provided.",
            path: ["itemLength"],
          });
        }
      }

      if (data.itemWidth !== undefined && data.itemWidth !== null) {
        if (data.itemWidth <= 0) {
          ctx.addIssue({
            code: "custom",
            message: "Item width must be greater than 0 if provided.",
            path: ["itemWidth"],
          });
        }
      }

      if (data.itemHeight !== undefined && data.itemHeight !== null) {
        if (data.itemHeight <= 0) {
          ctx.addIssue({
            code: "custom",
            message: "Item height must be greater than 0 if provided.",
            path: ["itemHeight"],
          });
        }
      }
    }

    // Validate options prices match currency decimals (if options exist)
    // CRITICAL: Option prices are already in smallest unit (cents) from form conversion
    // But we need to validate they were converted correctly based on currency
    if (
      data.options &&
      Array.isArray(data.options) &&
      data.options.length > 0
    ) {
      const currency = SUPPORTED_CURRENCIES.find(
        (c) => c.code === data.currency
      );
      if (currency) {
        let hasStockForPhysicalProduct = false; // Track if at least one variation has stock

        data.options.forEach((option, optionIndex) => {
          if (option && option.values && Array.isArray(option.values)) {
            // Check for duplicate value names within the same option group
            const valueNames = new Set<string>();
            option.values.forEach((value, valueIndex) => {
              if (value.name && valueNames.has(value.name)) {
                ctx.addIssue({
                  code: "custom",
                  message: `Duplicate variation name "${value.name}" in option "${option.label}". Each variation must have a unique name.`,
                  path: ["options", optionIndex, "values", valueIndex, "name"],
                });
              } else if (value.name) {
                valueNames.add(value.name);
              }
            });

            option.values.forEach((value, valueIndex) => {
              // Validate price
              if (value.price !== undefined && value.price !== null) {
                // Option prices are already in smallest unit (cents)
                // For 0-decimal currencies, price should be a whole number (no cents)
                // For 2-decimal currencies, price is in cents
                // Validate that price is a non-negative integer
                if (!Number.isInteger(value.price) || value.price < 0) {
                  ctx.addIssue({
                    code: "custom",
                    message: `Option "${option.label}" value "${value.name}" has invalid price. Price must be a non-negative whole number.`,
                    path: [
                      "options",
                      optionIndex,
                      "values",
                      valueIndex,
                      "price",
                    ],
                  });
                }
              }

              // Validate stock for physical products with variations
              // At least one variation must have stock > 0 for active physical products
              if (
                !data.isDigital &&
                value.stock !== undefined &&
                value.stock > 0
              ) {
                hasStockForPhysicalProduct = true;
              }
            });
          }
        });

        // For active physical products with variations, at least one variation must have stock
        if (
          !data.isDigital &&
          data.status !== "DRAFT" &&
          !hasStockForPhysicalProduct
        ) {
          ctx.addIssue({
            code: "custom",
            message:
              "At least one product variation must have stock greater than 0 for physical products.",
            path: ["options"],
          });
        }
      }
    }

    // Validate price based on currency (before conversion to cents)
    // This validation happens on the original price value before transform
    const currency = SUPPORTED_CURRENCIES.find((c) => c.code === data.currency);
    if (currency) {
      const minPrice =
        currency.decimals === 0 ? 1 : 1 / Math.pow(10, currency.decimals);
      // For currencies with 0 decimals (JPY, HUF, IDR, XOF), minimum is 1
      // For currencies with 2 decimals (USD, EUR, etc.), minimum is 0.01
      if (data.price < minPrice) {
        const formattedMinPrice =
          currency.decimals === 0 ? "1" : minPrice.toFixed(currency.decimals);
        ctx.addIssue({
          code: "custom",
          message: `Price must be at least ${currency.symbol}${formattedMinPrice} for ${currency.name} (${currency.code})`,
          path: ["price"],
        });
      }

      // Validate that price doesn't have more decimal places than currency supports
      const priceString = data.price.toString();
      const decimalIndex = priceString.indexOf(".");
      if (decimalIndex !== -1) {
        const decimalPlaces = priceString.length - decimalIndex - 1;
        if (decimalPlaces > currency.decimals) {
          ctx.addIssue({
            code: "custom",
            message: `${currency.name} (${currency.code}) only supports ${currency.decimals} decimal place${currency.decimals === 0 ? "" : "s"}. Please enter a whole number or use up to ${currency.decimals} decimal place${currency.decimals === 0 ? "" : "s"}.`,
            path: ["price"],
          });
        }
      }
    } else {
      // Currency not found - this shouldn't happen if enum validation works, but add safety check
      console.error(
        "[PRODUCT SCHEMA ERROR] Invalid currency code:",
        data.currency
      );
      ctx.addIssue({
        code: "custom",
        message: `Invalid currency: ${data.currency}. Please select a valid currency.`,
        path: ["currency"],
      });
    }

    // Additional validations for active products
    if (
      !data.description ||
      !data.description.html ||
      data.description.html.trim() === ""
    ) {
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
        message:
          "Stock quantity is required and must be at least 1 for physical products.",
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
