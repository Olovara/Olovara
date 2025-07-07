import { z } from "zod";

// Schema for creating a newsletter
export const NewsletterSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(100, "Subject must be less than 100 characters"),
  content: z.string().min(1, "Content is required").max(10000, "Content must be less than 10,000 characters"),
  previewText: z.string().optional(),
  targetAudience: z.enum(["all", "active", "new"]).default("all"),
  scheduledAt: z.string().optional(), // ISO string for scheduling
  testMode: z.boolean().default(false), // For testing with limited recipients
});

// Schema for newsletter sending
export const NewsletterSendSchema = NewsletterSchema.extend({
  newsletterId: z.string().optional(),
  sendImmediately: z.boolean().default(true),
  testEmails: z.array(z.string().email()).optional(), // For test mode
});

// Type exports
export type NewsletterInput = z.infer<typeof NewsletterSchema>;
export type NewsletterSendInput = z.infer<typeof NewsletterSendSchema>; 