import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { OnboardingSurveySchema } from "@/schemas/OnboardingSurveySchema";
import { PERMISSIONS } from "@/data/roles-and-permissions";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let body: any = null;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    body = await request.json();
    const validatedFields = OnboardingSurveySchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const values = validatedFields.data;
    const userId = session.user.id;

    // Check if user has already submitted a survey
    const existingSurvey = await db.onboardingSurvey.findUnique({
      where: { userId },
    });

    if (existingSurvey) {
      return NextResponse.json(
        { error: "Survey already submitted" },
        { status: 400 }
      );
    }

    // Check if user is a fully activated seller
    const seller = await db.seller.findUnique({
      where: { userId },
      select: { isFullyActivated: true },
    });

    if (!seller?.isFullyActivated) {
      return NextResponse.json(
        { error: "Only fully activated sellers can submit this survey" },
        { status: 403 }
      );
    }

    // Create the survey response
    const survey = await db.onboardingSurvey.create({
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

    return NextResponse.json({ success: true, survey });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error submitting onboarding survey:", error);

    // Don't log validation errors - they're expected client-side issues

    // Log to database - user could email about "couldn't submit survey"
    const userMessage = logError({
      code: "ONBOARDING_SURVEY_SUBMIT_FAILED",
      userId: session?.user?.id,
      route: "/api/onboarding-survey",
      method: "POST",
      error,
      metadata: {
        note: "Failed to submit onboarding survey",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user permissions from database
    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { permissions: true },
    });

    // Check if user has permission to view onboarding surveys
    if (
      !dbUser?.permissions?.includes(PERMISSIONS.VIEW_ONBOARDING_SURVEYS.value)
    ) {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    const survey = await db.onboardingSurvey.findUnique({
      where: { userId },
    });

    return NextResponse.json({ hasSubmitted: !!survey });
  } catch (error) {
    // Log to console (always happens)
    console.error("Error checking survey submission:", error);

    // Log to database - user could email about "can't check survey status"
    const userMessage = logError({
      code: "ONBOARDING_SURVEY_CHECK_FAILED",
      userId: session?.user?.id,
      route: "/api/onboarding-survey",
      method: "GET",
      error,
      metadata: {
        note: "Failed to check onboarding survey submission",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
