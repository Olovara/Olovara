import * as z from "zod";

export const ContactUsSchema = z.object({
  name: z.string().min(3, {
    message: "Name must be at least 3 characters long.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }).min(1, {
    message: "Email is required.",
  }),
  reason: z.string().min(1, {
    message: "Please select a reason for contacting us.",
  }),
  helpDescription: z.string().min(6, {
    message: "Please provide a description (at least 6 characters).",
  }),
  // Honeypot field - should be empty
  website: z.string().max(0, {
    message: "Invalid submission detected.",
  }),
  // reCAPTCHA token
  recaptchaToken: z.string().optional(),
});
