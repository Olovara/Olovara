import * as z from "zod";

export const SellerSchema = z.object({
  shopName: z.string().min(30, {
    message: "Please enter your shop's name, required.",
  }),
  shopDescription: z.string().min(6, {
    message: "Please enter your shop's description, required.",
  }),
});