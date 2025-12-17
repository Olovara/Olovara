"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Survey {
  id: string;
  userId: string;
  overallExperience: string;
  clarityOfInstructions: string;
  difficultyLevel: string;
  timeToComplete: string;
  mostChallengingStep: string;
  suggestions?: string | null;
  wouldRecommend: string;
  createdAt: Date;
  user: {
    email?: string | null;
    username?: string | null;
  };
}

interface Analytics {
  totalSurveys: number;
  overallExperienceStats: Record<string, number>;
  clarityStats: Record<string, number>;
  difficultyStats: Record<string, number>;
  timeStats: Record<string, number>;
  challengingStepStats: Record<string, number>;
  recommendationStats: Record<string, number>;
}

interface OnboardingSurveyResultsProps {
  surveys: Survey[];
  analytics: Analytics;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export function OnboardingSurveyResults({
  surveys,
  analytics,
}: OnboardingSurveyResultsProps) {
  const formatLabel = (label: string) => {
    return label
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const createChartData = (stats: Record<string, number>) => {
    return Object.entries(stats).map(([key, value]) => ({
      name: formatLabel(key),
      value,
      percentage: Math.round((value / analytics.totalSurveys) * 100),
    }));
  };

  const overallExperienceData = createChartData(
    analytics.overallExperienceStats
  );
  const clarityData = createChartData(analytics.clarityStats);
  const difficultyData = createChartData(analytics.difficultyStats);
  const timeData = createChartData(analytics.timeStats);
  const challengingStepData = createChartData(analytics.challengingStepStats);
  const recommendationData = createChartData(analytics.recommendationStats);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Responses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSurveys}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Experience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.overallExperienceStats["excellent"] ||
              0 + analytics.overallExperienceStats["good"] ||
              0 > analytics.overallExperienceStats["fair"] ||
              0 + analytics.overallExperienceStats["poor"] ||
              0
                ? "Positive"
                : "Needs Improvement"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Most Challenging
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {Object.entries(analytics.challengingStepStats).reduce((a, b) =>
                analytics.challengingStepStats[a[0]] >
                analytics.challengingStepStats[b[0]]
                  ? a
                  : b
              )[0]
                ? formatLabel(
                    Object.entries(analytics.challengingStepStats).reduce(
                      (a, b) =>
                        analytics.challengingStepStats[a[0]] >
                        analytics.challengingStepStats[b[0]]
                          ? a
                          : b
                    )[0]
                  )
                : "N/A"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Would Recommend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                (((analytics.recommendationStats["definitely"] || 0) +
                  (analytics.recommendationStats["probably"] || 0)) /
                  analytics.totalSurveys) *
                  100
              )}
              %
            </div>
            <p className="text-xs text-muted-foreground">Definitely/Probably</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overall Experience */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Experience</CardTitle>
            <CardDescription>
              How sellers rated their onboarding experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={overallExperienceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {overallExperienceData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Clarity of Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Clarity of Instructions</CardTitle>
            <CardDescription>
              How clear sellers found the instructions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={clarityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Difficulty Level */}
        <Card>
          <CardHeader>
            <CardTitle>Difficulty Level</CardTitle>
            <CardDescription>
              How difficult sellers found the process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={difficultyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Time to Complete */}
        <Card>
          <CardHeader>
            <CardTitle>Time to Complete</CardTitle>
            <CardDescription>
              How long it took sellers to complete onboarding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Individual Responses */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Responses</CardTitle>
          <CardDescription>Detailed feedback from each seller</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {surveys.map((survey) => (
              <div key={survey.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">
                      {survey.user.username || survey.user.email || "Anonymous"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(survey.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {formatLabel(survey.overallExperience)}
                    </Badge>
                    <Badge variant="outline">
                      {formatLabel(survey.difficultyLevel)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Clarity:</span>{" "}
                    {formatLabel(survey.clarityOfInstructions)}
                  </div>
                  <div>
                    <span className="font-medium">Time:</span>{" "}
                    {formatLabel(survey.timeToComplete)}
                  </div>
                  <div>
                    <span className="font-medium">Challenging:</span>{" "}
                    {formatLabel(survey.mostChallengingStep)}
                  </div>
                  <div>
                    <span className="font-medium">Recommend:</span>{" "}
                    {formatLabel(survey.wouldRecommend)}
                  </div>
                </div>

                {survey.suggestions && (
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p className="text-sm">
                      <span className="font-medium">Suggestions:</span>{" "}
                      {survey.suggestions}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
