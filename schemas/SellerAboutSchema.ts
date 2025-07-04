import * as z from "zod";

export const SellerAboutSchema = z.object({
  shopName: z.string().min(3, "Shop name must be at least 3 characters").max(50, "Shop name must be less than 50 characters"),
  shopTagLine: z.string().max(100, "Shop tagline must be less than 100 characters").optional(),
  shopDescription: z.string().min(10, "Shop description must be at least 10 characters").max(1000, "Shop description must be less than 1000 characters"),
  shopAnnouncement: z.string().max(500, "Shop announcement must be less than 500 characters").optional(),
  sellerImage: z.string().url("Must be a valid URL").optional(),
  shopBannerImage: z.string().url("Must be a valid URL").optional(),
  shopLogoImage: z.string().url("Must be a valid URL").optional(),
});

export type SellerAboutFormData = z.infer<typeof SellerAboutSchema>; 