import * as z from "zod";

export const SellerApplicationSchema = z
  .object({
    craftingProcess: z.string().min(30, {
      message: "Please enter your crafting process, required.",
    }),
    portfolio: z.string().min(6, {
      message: "Please enter a link to your portfolio, required.",
    }),
    interestInJoining: z.string().min(6, {
      message: "Please enter the reason for your interest in joining, required",
    }),
  })