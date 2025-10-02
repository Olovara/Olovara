import { z } from "zod";

export const SellerWebsiteContactSchema = z.object({
  name: z.string().min(1, "Required"),
  email: z.string().email(),
  message: z.string(),
});
