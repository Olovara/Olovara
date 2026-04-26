import { z } from "zod";

export const PortfolioComplexitySchema = z.enum(["easy", "medium", "advanced"]);

export const PortfolioItemCreateSchema = z.object({
  title: z.string().trim().min(1).max(120),
  images: z.array(z.string().trim().min(1)).max(5),
  tags: z.array(z.string().trim().min(1).max(40)).min(1).max(20),
  description: z.string().trim().max(2000).optional(),
  priceRange: z.string().trim().max(80).optional(),
  complexity: PortfolioComplexitySchema.optional(),
  featured: z.boolean().optional(),
});

export const PortfolioItemUpdateSchema = PortfolioItemCreateSchema.partial().extend({
  featuredRank: z.number().int().min(0).max(3).nullable().optional(),
  sortOrder: z.number().int().min(0).max(1000).optional(),
});

export const PortfolioReorderSchema = z.object({
  order: z
    .array(
      z.object({
        id: z.string().min(1),
        sortOrder: z.number().int().min(0).max(1000),
      })
    )
    .max(24),
});

export const PortfolioFeaturedSchema = z.object({
  id: z.string().min(1),
  featured: z.boolean(),
  featuredRank: z.number().int().min(0).max(3).nullable().optional(),
});

