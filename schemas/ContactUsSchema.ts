import * as z from "zod";

export const ContactUsSchema = z.object({
  name: z.string().min(3, {
    message: "Please enter your name, required.",
  }),
  email: z.string().min(6, {
    message: "Please enter your email, required.",
  }),
  reason: z.string(),
  helpDescription: z.string().min(6, {
    message: "Please let us know how we can help you, required",
  }),
  // Honeypot field - should be empty
  website: z.string().max(0, {}),
  // reCAPTCHA token
  recaptchaToken: z.string().optional(),
});
