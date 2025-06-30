import * as z from "zod";

export const OnboardingSurveySchema = z.object({
  overallExperience: z.enum(["excellent", "good", "fair", "poor"]),
  clarityOfInstructions: z.enum(["very_clear", "clear", "somewhat_unclear", "very_unclear"]),
  difficultyLevel: z.enum(["very_easy", "easy", "moderate", "difficult", "very_difficult"]),
  timeToComplete: z.enum(["less_than_15_min", "15_30_min", "30_60_min", "1_2_hours", "more_than_2_hours"]),
  mostChallengingStep: z.enum(["application", "profile_setup", "stripe_connection", "shipping_setup", "none"]),
  suggestions: z.string().max(500).optional(),
  wouldRecommend: z.enum(["definitely", "probably", "maybe", "probably_not", "definitely_not"]),
});

export type OnboardingSurveyData = z.infer<typeof OnboardingSurveySchema>; 