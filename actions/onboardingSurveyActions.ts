"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { OnboardingSurveySchema } from "@/schemas/OnboardingSurveySchema";
import { z } from "zod";

export async function submitOnboardingSurvey(values: z.infer<typeof OnboardingSurveySchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = session.user.id;

    // Validate the survey data
    const validatedFields = OnboardingSurveySchema.safeParse(values);
    if (!validatedFields.success) {
      return { success: false, error: "Invalid survey data" };
    }

    // Check if user has already submitted a survey
    const existingSurvey = await db.onboardingSurvey.findUnique({
      where: { userId },
    });

    if (existingSurvey) {
      return { success: false, error: "Survey already submitted" };
    }

    // Check if user is a fully activated seller
    const seller = await db.seller.findUnique({
      where: { userId },
      select: { isFullyActivated: true },
    });

    if (!seller?.isFullyActivated) {
      return { success: false, error: "Only fully activated sellers can submit this survey" };
    }

    // Create the survey response
    await db.onboardingSurvey.create({
      data: {
        userId,
        overallExperience: values.overallExperience,
        clarityOfInstructions: values.clarityOfInstructions,
        difficultyLevel: values.difficultyLevel,
        timeToComplete: values.timeToComplete,
        mostChallengingStep: values.mostChallengingStep,
        suggestions: values.suggestions,
        wouldRecommend: values.wouldRecommend,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error submitting onboarding survey:", error);
    return { success: false, error: "Failed to submit survey" };
  }
}

export async function hasSubmittedOnboardingSurvey() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { hasSubmitted: false };
    }

    const userId = session.user.id;

    const survey = await db.onboardingSurvey.findUnique({
      where: { userId },
    });

    return { hasSubmitted: !!survey };
  } catch (error) {
    console.error("Error checking survey submission:", error);
    return { hasSubmitted: false };
  }
} 