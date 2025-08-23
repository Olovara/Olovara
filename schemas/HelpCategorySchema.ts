import { z } from "zod";

// Schema for creating a new help category
export const createHelpCategorySchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters")
    .transform((val) => val.trim()),

  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),

  parentSlug: z.string().optional().nullable(),

  order: z.number().default(0),

  isActive: z.boolean().default(true),
});

// Schema for updating an existing help category
export const updateHelpCategorySchema = createHelpCategorySchema.partial();

// Schema for help category query parameters
export const helpCategoryQuerySchema = z.object({
  isActive: z.boolean().optional(),
  parentSlug: z.string().optional().nullable(),
  includeArticles: z.boolean().optional(),
  sortBy: z.enum(["order", "title", "createdAt"]).default("order"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

// Type inference
export type CreateHelpCategoryInput = z.infer<typeof createHelpCategorySchema>;
export type UpdateHelpCategoryInput = z.infer<typeof updateHelpCategorySchema>;
export type HelpCategoryQueryInput = z.infer<typeof helpCategoryQuerySchema>;
