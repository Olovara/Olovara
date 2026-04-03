import * as z from "zod";

/** Seller quote before accepting a custom order (amounts in major units; converted server-side). */
export const SendCustomOrderQuoteSchema = z
  .object({
    submissionId: z.string().min(1, "Submission is required"),
    quotePriceType: z.enum(["FIXED", "RANGE"]),
    quotePriceFixedMajor: z.number().optional(),
    quotePriceMinMajor: z.number().optional(),
    quotePriceMaxMajor: z.number().optional(),
    quoteDepositMajor: z
      .number()
      .positive("Required deposit must be greater than zero"),
    quoteTimeline: z
      .string()
      .min(1, "Timeline is required")
      .max(500, "Timeline is too long"),
    quoteNotes: z.string().max(2000, "Notes are too long").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.quotePriceType === "FIXED") {
      const v = data.quotePriceFixedMajor;
      if (v == null || !Number.isFinite(v) || v <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a fixed price estimate",
          path: ["quotePriceFixedMajor"],
        });
      }
    } else {
      const min = data.quotePriceMinMajor;
      const max = data.quotePriceMaxMajor;
      if (
        min == null ||
        max == null ||
        !Number.isFinite(min) ||
        !Number.isFinite(max)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter both low and high estimates",
          path: ["quotePriceMinMajor"],
        });
      } else {
        if (min < 0 || max < 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Amounts cannot be negative",
            path: ["quotePriceMinMajor"],
          });
        }
        if (min > max) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Low estimate cannot be greater than high",
            path: ["quotePriceMaxMajor"],
          });
        }
      }
    }
  });

export type SendCustomOrderQuoteInput = z.infer<typeof SendCustomOrderQuoteSchema>;
