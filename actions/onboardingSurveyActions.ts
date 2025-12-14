"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { OnboardingSurveySchema } from "@/schemas/OnboardingSurveySchema";
import { z } from "zod";
import { logError } from "@/lib/error-logger";

export async function submitOnboardingSurvey(
  values: z.infer<typeof OnboardingSurveySchema>
) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let userId: string | undefined = undefined;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    // Create const for TypeScript type narrowing
    const currentUserId: string = session.user.id;
    userId = currentUserId; // Also assign to outer variable for catch block

    // Validate the survey data
    const validatedFields = OnboardingSurveySchema.safeParse(values);
    if (!validatedFields.success) {
      return { success: false, error: "Invalid survey data" };
    }

    // Check if user has already submitted a survey
    const existingSurvey = await db.onboardingSurvey.findUnique({
      where: { userId: currentUserId },
    });

    if (existingSurvey) {
      return { success: false, error: "Survey already submitted" };
    }

    // Check if user is a fully activated seller
    const seller = await db.seller.findUnique({
      where: { userId: currentUserId },
      select: { isFullyActivated: true },
    });

    if (!seller?.isFullyActivated) {
      return {
        success: false,
        error: "Only fully activated sellers can submit this survey",
      };
    }

    // Create the survey response
    await db.onboardingSurvey.create({
      data: {
        userId: currentUserId,
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
    // Log to console (always happens)
    console.error("Error submitting onboarding survey:", error);

    // Don't log Zod validation errors - they're expected client-side issues
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid survey data" };
    }

    // Log to database - user could email about "couldn't submit survey"
    const userMessage = logError({
      code: "ONBOARDING_SURVEY_SUBMIT_FAILED",
      userId,
      route: "actions/onboardingSurveyActions",
      method: "submitOnboardingSurvey",
      error,
      metadata: {
        note: "Failed to submit onboarding survey",
      },
    });

    return { success: false, error: userMessage };
  }
}

export async function hasSubmittedOnboardingSurvey() {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let userId: string | undefined = undefined;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return { hasSubmitted: false };
    }

    // Create const for TypeScript type narrowing
    const currentUserId: string = session.user.id;
    userId = currentUserId; // Also assign to outer variable for catch block

    const survey = await db.onboardingSurvey.findUnique({
      where: { userId: currentUserId },
    });

    return { hasSubmitted: !!survey };
  } catch (error) {
    // Log to console (always happens)
    console.error("Error checking survey submission:", error);

    // Log to database - user could email about "can't check survey status"
    logError({
      code: "ONBOARDING_SURVEY_CHECK_FAILED",
      userId,
      route: "actions/onboardingSurveyActions",
      method: "hasSubmittedOnboardingSurvey",
      error,
      metadata: {
        note: "Failed to check onboarding survey submission status",
      },
    });

    return { hasSubmitted: false };
  }
}
