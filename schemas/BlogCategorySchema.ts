import { z } from "zod";

// Schema for creating a new blog category
export const createBlogCategorySchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters")
    .transform(val => val.trim()),
  
  description: z.string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .nullable()
    .transform(val => val?.trim() || null),
  
  img: z.string()
    .optional()
    .nullable()
    .transform(val => {
      // If empty string or null/undefined, return null
      if (!val || val.trim() === '') return null;
      // If it's a valid URL, return it
      try {
        new URL(val);
        return val;
      } catch {
        // If it's not a valid URL, throw an error
        throw new Error("Invalid image URL");
      }
    }),
  
  parentSlug: z.string()
    .optional()
    .nullable(),
  
  order: z.number()
    .int()
    .min(0)
    .default(0),
  
  isActive: z.boolean()
    .default(true),
});

// Schema for updating an existing blog category
export const updateBlogCategorySchema = createBlogCategorySchema.partial();

// Schema for blog category query parameters
export const blogCategoryQuerySchema = z.object({
  includeInactive: z.boolean().optional().default(false),
  parentSlug: z.string().optional(),
  search: z.string().optional(),
});

// Type inference
export type CreateBlogCategoryInput = z.infer<typeof createBlogCategorySchema>;
export type UpdateBlogCategoryInput = z.infer<typeof updateBlogCategorySchema>;
export type BlogCategoryQueryInput = z.infer<typeof blogCategoryQuerySchema>; 