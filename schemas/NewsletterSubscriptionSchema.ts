import { z } from "zod";

// Schema for newsletter subscription
export const NewsletterSubscriptionSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  source: z.string().optional(),
});

// Schema for newsletter subscription with additional tracking data
export const NewsletterSubscriptionWithTrackingSchema = NewsletterSubscriptionSchema.extend({
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  location: z.record(z.any()).optional(),
});

// Type exports
export type NewsletterSubscriptionInput = z.infer<typeof NewsletterSubscriptionSchema>;
export type NewsletterSubscriptionWithTrackingInput = z.infer<typeof NewsletterSubscriptionWithTrackingSchema>; 