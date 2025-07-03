import { ObjectId } from "mongodb";
import { z } from "zod";

// Product ID validation schema
export const ProductIdSchema = z
  .string()
  .min(1, "Product ID is required")
  .refine((id) => ObjectId.isValid(id), {
    message: "Invalid product ID format",
  });

// URL parameter validation
export const UrlParamSchema = z
  .string()
  .min(1, "Parameter is required")
  .max(100, "Parameter too long")
  .refine((param) => !param.includes(".."), {
    message: "Invalid parameter format",
  })
  .refine((param) => !param.includes("\\"), {
    message: "Invalid parameter format",
  });

// Sanitize user input
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

// Validate and sanitize product ID
export function validateProductId(id: string): string | null {
  try {
    const result = ProductIdSchema.parse(id);
    return result;
  } catch {
    return null;
  }
}

// Validate URL parameters
export function validateUrlParam(param: string): string | null {
  try {
    const result = UrlParamSchema.parse(param);
    return result;
  } catch {
    return null;
  }
} 