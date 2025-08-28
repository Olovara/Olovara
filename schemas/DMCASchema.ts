import * as z from "zod";

export const DMCASchema = z.object({
  // Basic Information
  name: z.string().min(2, {
    message: "Please enter your full name (minimum 2 characters).",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phoneNumber: z.string().optional(),
  
  // Product Information
  productLink: z.string().url({
    message: "Please enter a valid URL to the infringing product.",
  }),
  
  // Statement about infringing product
  infringingStatement: z.string().min(20, {
    message: "Please provide a detailed statement about the infringing product (minimum 20 characters).",
  }),
  
  // Legal Agreement
  legalAgreement: z.boolean().refine((val) => val === true, {
    message: "You must agree to the legal statement under penalty of perjury.",
  }),
  
  // File Upload
  copyrightDocumentUrl: z.string().optional(),
  
  // Honeypot field - should be empty
  website: z.string().max(0, {}),
  
  // reCAPTCHA token
  recaptchaToken: z.string().optional(),
});
