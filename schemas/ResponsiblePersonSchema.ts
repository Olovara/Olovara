import * as z from "zod";

export const ResponsiblePersonSchema = z.object({
  name: z.string().min(1, "Responsible person name is required").max(255, "Name too long"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required").max(50, "Phone number too long"),
  address: z.object({
    street: z.string().min(1, "Street address is required").max(255, "Street address too long"),
    street2: z.string().max(255, "Street address 2 too long").optional(),
    city: z.string().min(1, "City is required").max(100, "City name too long"),
    state: z.string().max(100, "State name too long").optional(),
    country: z.string().min(2, "Country is required").max(3, "Invalid country code"),
    postalCode: z.string().min(1, "Postal code is required").max(20, "Postal code too long"),
  }),
  companyName: z.string().min(1, "Company name is required").max(255, "Company name too long"),
  vatNumber: z.string().max(50, "VAT number too long").optional(),
});

export type ResponsiblePersonFormData = z.infer<typeof ResponsiblePersonSchema>;
