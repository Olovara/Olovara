import { z } from "zod";

// Schema for creating a new blog post
export const createBlogPostSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters")
    .transform(val => val.trim()),
  
  description: z.string()
    .min(1, "Description is required")
    .max(500, "Description must be less than 500 characters")
    .transform(val => val.trim()),
  
  content: z.string()
    .min(1, "Content is required")
    .transform(val => val.trim()),
  
  catSlug: z.string()
    .min(1, "Category is required"),
  
  status: z.enum(["DRAFT", "PUBLISHED"])
    .default("DRAFT"),
  
  isPrivate: z.boolean()
    .default(false),
  
  // Optional fields
  img: z.string()
    .url("Invalid image URL")
    .optional()
    .nullable(),
  
  readTime: z.number()
    .min(1, "Read time must be at least 1 minute")
    .optional()
    .nullable(),
  
  // SEO fields
  metaTitle: z.string()
    .max(60, "Meta title must be less than 60 characters")
    .optional()
    .nullable(),
  
  metaDescription: z.string()
    .max(160, "Meta description must be less than 160 characters")
    .optional()
    .nullable(),
  
  keywords: z.array(z.string())
    .max(10, "Maximum 10 keywords allowed")
    .optional()
    .default([]),
  
  canonicalUrl: z.string()
    .url("Invalid canonical URL")
    .optional()
    .nullable(),
  
  ogImage: z.string()
    .url("Invalid Open Graph image URL")
    .optional()
    .nullable(),
  
  ogTitle: z.string()
    .max(90, "Open Graph title must be less than 90 characters")
    .optional()
    .nullable(),
  
  ogDescription: z.string()
    .max(200, "Open Graph description must be less than 200 characters")
    .optional()
    .nullable(),
  
  // Schema.org structured data
  authorName: z.string()
    .optional()
    .nullable(),
  
  authorUrl: z.string()
    .url("Invalid author URL")
    .optional()
    .nullable(),
  
  // Additional metadata
  tags: z.array(z.string())
    .max(20, "Maximum 20 tags allowed")
    .optional()
    .default([]),
  
  featured: z.boolean()
    .default(false),
  
  allowComments: z.boolean()
    .default(true),
});

// Schema for updating an existing blog post
export const updateBlogPostSchema = createBlogPostSchema.partial();

// Schema for blog post query parameters
export const blogPostQuerySchema = z.object({
  category: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  featured: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(10),
  search: z.string().optional(),
  sortBy: z.enum(["publishedAt", "views", "title"]).default("publishedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Type inference
export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;
export type BlogPostQueryInput = z.infer<typeof blogPostQuerySchema>; 