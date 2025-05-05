import * as z from "zod";

export const CustomerFeedbackSchema = z.object({
  heardFrom: z.string({
    required_error: "Please select how you heard about Yarnnu",
  }),
  overallExperience: z.number().min(1).max(5, {
    message: "Please rate your overall experience from 1 to 5",
  }),
  placedOrder: z.enum(["YES", "PLANNING", "NO"], {
    required_error: "Please select if you placed an order",
  }),
  orderNumber: z.string().optional(),
  experience: z.string().min(10, {
    message: "Please share your experience (minimum 10 characters)",
  }),
  improvements: z.string().optional(),
  returnLikelihood: z.number().min(1).max(5, {
    message: "Please rate how likely you are to return from 1 to 5",
  }),
  email: z.string().email().optional(),
  // Honeypot field - should be empty
  website: z.string().max(0, {}),
  // reCAPTCHA token
  recaptchaToken: z.string().optional(),
}); 