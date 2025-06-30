import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { OnboardingSurveySchema } from "@/schemas/OnboardingSurveySchema";
import { PERMISSIONS } from "@/data/roles-and-permissions";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
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
      return NextResponse.json({ error: "Survey already submitted" }, { status: 400 });
    }

    // Check if user is a fully activated seller
    const seller = await db.seller.findUnique({
      where: { userId },
      select: { isFullyActivated: true },
    });

    if (!seller?.isFullyActivated) {
      return NextResponse.json({ error: "Only fully activated sellers can submit this survey" }, { status: 403 });
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
    console.error("Error submitting onboarding survey:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to view onboarding surveys
    const userPermissions = session.user.permissions as string[] || [];
    const hasPermission = userPermissions.includes(PERMISSIONS.VIEW_ONBOARDING_SURVEYS.value);
    
    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 });
    }

    const userId = session.user.id;

    const survey = await db.onboardingSurvey.findUnique({
      where: { userId },
    });

    return NextResponse.json({ hasSubmitted: !!survey });
  } catch (error) {
    console.error("Error checking survey submission:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 