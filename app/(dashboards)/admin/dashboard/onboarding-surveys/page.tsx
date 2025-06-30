import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { OnboardingSurveyResults } from "./OnboardingSurveyResults";

export const dynamic = 'force-dynamic';

export default async function OnboardingSurveysPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch all onboarding surveys with user data
  const surveys = await db.onboardingSurvey.findMany({
    include: {
      user: {
        select: {
          email: true,
          username: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Calculate analytics
  const totalSurveys = surveys.length;
  
  const analytics = {
    totalSurveys,
    overallExperienceStats: surveys.reduce((acc, survey) => {
      acc[survey.overallExperience] = (acc[survey.overallExperience] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    clarityStats: surveys.reduce((acc, survey) => {
      acc[survey.clarityOfInstructions] = (acc[survey.clarityOfInstructions] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    difficultyStats: surveys.reduce((acc, survey) => {
      acc[survey.difficultyLevel] = (acc[survey.difficultyLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    timeStats: surveys.reduce((acc, survey) => {
      acc[survey.timeToComplete] = (acc[survey.timeToComplete] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    challengingStepStats: surveys.reduce((acc, survey) => {
      acc[survey.mostChallengingStep] = (acc[survey.mostChallengingStep] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    recommendationStats: surveys.reduce((acc, survey) => {
      acc[survey.wouldRecommend] = (acc[survey.wouldRecommend] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Onboarding Survey Results</h1>
        <p className="text-muted-foreground">
          View feedback from sellers about their onboarding experience
        </p>
      </div>

      {totalSurveys === 0 ? (
        <div className="text-center p-8">
          <p className="text-muted-foreground">
            No survey responses yet. Survey results will appear here once sellers complete their onboarding and submit feedback.
          </p>
        </div>
      ) : (
        <OnboardingSurveyResults surveys={surveys} analytics={analytics} />
      )}
    </div>
  );
} 