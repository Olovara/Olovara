"use client";

import { usePermissions } from "@/components/providers/PermissionProvider";
import { useSession } from "next-auth/react";
import SellerDashboardInfo from "./SellerDashboardInfo";
import SellerOnboardingDashboard from "@/components/seller/SellerOnboardingDashboard";
import { OnboardingSurveyProvider } from "@/components/providers/OnboardingSurveyProvider";
import { SessionRefreshButton } from "@/components/SessionRefreshButton";
import { useOnboarding } from "@/hooks/use-onboarding";
import { OptionalOnboardingTasks } from "@/components/seller/OptionalOnboardingTasks";
import { BASE_ONBOARDING_STEPS } from "@/lib/onboarding";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { startOfQuarter, startOfYear, subDays } from "date-fns";
import { useCallback, useEffect, useState } from "react";

const dashboardPeriodSelectItemClass =
  "cursor-pointer rounded-sm focus:bg-brand-primary-100 focus:text-brand-primary-900 data-[highlighted]:bg-brand-primary-100 data-[highlighted]:text-brand-primary-900 hover:bg-brand-primary-100 hover:text-brand-primary-900";

type DashboardPeriodPreset =
  | "all"
  | "24h"
  | "7d"
  | "30d"
  | "quarter"
  | "ytd"
  | "custom";

type SellerDashboardContentProps = {
  /** Decrypted profile first name from the server */
  welcomeFirstName?: string | null;
  /** Display username from DB when first name is unset */
  usernameFallback?: string | null;
  /** ISO date: seller profile `createdAt`, or user `createdAt` as fallback — used for "All time" range */
  sellerJoinedAt: string;
};

export function SellerDashboardContent({
  welcomeFirstName = null,
  usernameFallback = null,
  sellerJoinedAt,
}: SellerDashboardContentProps) {
  const { data: session } = useSession();
  const { role, loading: permissionsLoading, error: permissionsError, refreshPermissions } = usePermissions();
  const { steps, isFullyActivated, isLoading: onboardingLoading } = useOnboarding();

  const [startDate, setStartDate] = useState<Date | undefined>(() =>
    subDays(new Date(), 7)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(() => new Date());
  const [periodPreset, setPeriodPreset] =
    useState<DashboardPeriodPreset>("7d");

  const applyPeriodPreset = useCallback(
    (value: DashboardPeriodPreset) => {
      setPeriodPreset(value);
      const end = new Date();
      switch (value) {
        case "all": {
          const joined = new Date(sellerJoinedAt);
          setStartDate(joined);
          setEndDate(end);
          break;
        }
      case "24h":
        setStartDate(subDays(end, 1));
        setEndDate(end);
        break;
      case "7d":
        setStartDate(subDays(end, 7));
        setEndDate(end);
        break;
      case "30d":
        setStartDate(subDays(end, 30));
        setEndDate(end);
        break;
      case "quarter":
        setStartDate(startOfQuarter(end));
        setEndDate(end);
        break;
      case "ytd":
        setStartDate(startOfYear(end));
        setEndDate(end);
        break;
      case "custom":
        setStartDate((s) => s ?? subDays(new Date(), 30));
        setEndDate((e) => e ?? new Date());
        break;
      default:
        break;
    }
  },
  [sellerJoinedAt]
);

  const handleStartDateChange = useCallback((d?: Date) => {
    setPeriodPreset("custom");
    setStartDate(d);
  }, []);

  const handleEndDateChange = useCallback((d?: Date) => {
    setPeriodPreset("custom");
    setEndDate(d);
  }, []);

  // Refresh permissions on mount to ensure we have the latest role
  // This helps when user just completed onboarding
  useEffect(() => {
    if (session?.user?.id && !permissionsLoading) {
      // Check if cache might be stale (older than 30 seconds)
      if (typeof window !== 'undefined') {
        const timestamp = localStorage.getItem('yarnnu_permissions_timestamp');
        if (timestamp) {
          const age = Date.now() - parseInt(timestamp);
          // If cache is older than 30 seconds, refresh
          if (age > 30000) {
            refreshPermissions();
          }
        } else {
          // No cache, fetch fresh
          refreshPermissions();
        }
      }
    }
  }, [session?.user?.id, permissionsLoading, refreshPermissions]);

  // Show loading state
  if (permissionsLoading || onboardingLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait while we load your dashboard.</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (permissionsError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{permissionsError}</p>
          <SessionRefreshButton 
            onRefresh={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </SessionRefreshButton>
        </div>
      </div>
    );
  }

  // Check if user is a seller (only after permissions have loaded)
  if (!permissionsLoading && role !== 'SELLER') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You need to be a seller to access this dashboard. Please submit a seller application first.
          </p>
          <div className="space-x-4">
            <a 
              href="/seller-application" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Apply to Become a Seller
            </a>
            <SessionRefreshButton 
              onRefresh={() => window.location.reload()}
              variant="outline"
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Refresh Page
            </SessionRefreshButton>
          </div>
        </div>
      </div>
    );
  }

  // If no seller data, show error
  if (!steps || steps.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Seller Profile Not Found</h2>
          <p className="text-gray-600 mb-4">
            It looks like your seller profile hasn&apos;t been created yet. Please submit a seller application first.
          </p>
          <div className="space-x-4">
            <a 
              href="/seller-application" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Apply to Become a Seller
            </a>
            <SessionRefreshButton 
              onRefresh={() => window.location.reload()}
              variant="outline"
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Refresh Page
            </SessionRefreshButton>
          </div>
        </div>
      </div>
    );
  }

  // Check if base required steps are complete (GPSR is optional)
  // Only check BASE_ONBOARDING_STEPS, not GPSR compliance
  const baseStepKeys = BASE_ONBOARDING_STEPS as readonly string[];
  const baseStepsComplete = steps?.filter(step => 
    baseStepKeys.includes(step.stepKey)
  ).every(step => step.completed) ?? false;

  const welcomeName =
    welcomeFirstName?.trim() ||
    usernameFallback?.trim() ||
    session?.user?.name?.trim() ||
    session?.user?.email?.split("@")[0]?.trim() ||
    "";

  return (
    <OnboardingSurveyProvider>
      <div>
        {baseStepsComplete ? (
          <>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <h1 className="text-3xl font-bold shrink-0">
                {welcomeName ? `Welcome, ${welcomeName}` : "Welcome"}
              </h1>
              <Select
                value={periodPreset}
                onValueChange={(v) =>
                  applyPeriodPreset(v as DashboardPeriodPreset)
                }
              >
                <SelectTrigger
                  className={cn(
                    "h-11 w-full sm:h-10 sm:w-[min(100%,260px)] sm:shrink-0",
                    "border-brand-dark-neutral-200 bg-background",
                    "hover:border-brand-primary-300 focus:ring-brand-primary-500 data-[state=open]:border-brand-primary-400"
                  )}
                  aria-label="Dashboard time period"
                >
                  <SelectValue placeholder="Time period" />
                </SelectTrigger>
                <SelectContent
                  align="end"
                  className="border-brand-primary-200 bg-brand-light-neutral-50 text-brand-dark-neutral-900"
                >
                  <SelectItem value="24h" className={dashboardPeriodSelectItemClass}>
                    Past 24 hours
                  </SelectItem>
                  <SelectItem value="7d" className={dashboardPeriodSelectItemClass}>
                    Past 7 days
                  </SelectItem>
                  <SelectItem value="30d" className={dashboardPeriodSelectItemClass}>
                    Past 30 days
                  </SelectItem>
                  <SelectItem value="quarter" className={dashboardPeriodSelectItemClass}>
                    This quarter
                  </SelectItem>
                  <SelectItem value="ytd" className={dashboardPeriodSelectItemClass}>
                    Year to date
                  </SelectItem>
                  <SelectItem value="all" className={dashboardPeriodSelectItemClass}>
                    All time
                  </SelectItem>
                  <SelectItem value="custom" className={dashboardPeriodSelectItemClass}>
                    Custom range
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <SellerDashboardInfo
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={handleStartDateChange}
              onEndDateChange={handleEndDateChange}
            />
            {/* Show optional onboarding tasks at the bottom */}
            <OptionalOnboardingTasks steps={steps} />
          </>
        ) : (
          <SellerOnboardingDashboard />
        )}
      </div>
    </OnboardingSurveyProvider>
  );
} 