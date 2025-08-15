import { prisma } from "@/lib/prisma";
import { EEA_COUNTRIES, NORTHERN_IRELAND_CODE } from "@/lib/gpsr-compliance";

// Define the base onboarding steps (always required)
export const BASE_ONBOARDING_STEPS = [
  "application_submitted",
  "application_approved",
  "shop_preferences",
  "shop_naming",
  "payment_setup",
] as const;

// GPSR compliance step (conditional)
export const GPSR_COMPLIANCE_STEP = "gpsr_compliance" as const;

// Convert to mutable array for Prisma queries
const BASE_ONBOARDING_STEPS_ARRAY = [...BASE_ONBOARDING_STEPS];

export type OnboardingStepKey =
  | "application_submitted"
  | "application_approved"
  | "shop_preferences"
  | "shop_naming"
  | "payment_setup"
  | "gpsr_compliance";

// Interface for onboarding step data
export interface OnboardingStepData {
  stepKey: OnboardingStepKey;
  completed: boolean;
  completedAt?: Date;
}

/**
 * Check if GPSR compliance is required for a seller
 */
export async function isGPSRComplianceRequired(
  sellerId: string
): Promise<boolean> {
  try {
    // Get seller's shop country and shipping exclusions
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      select: {
        shopCountry: true,
        excludedCountries: true,
      },
    });

    if (!seller) {
      return false;
    }

    // Check if seller is based in EU/EEA
    const isEUBased = EEA_COUNTRIES.includes(seller.shopCountry);

    if (isEUBased) {
      return true; // EU-based sellers always need GPSR compliance
    }

    // Check shipping exclusions
    const excludedCountryCodes = seller.excludedCountries || [];

    // If no countries are excluded, seller ships worldwide (including EU)
    if (excludedCountryCodes.length === 0) {
      return true;
    }

    // Check if any EEA countries are NOT excluded (meaning seller ships to EEA)
    const shipsToEEA = EEA_COUNTRIES.some(
      (eeaCountry) => !excludedCountryCodes.includes(eeaCountry)
    );

    // Check if Northern Ireland is NOT excluded (special case)
    const shipsToNorthernIreland = !excludedCountryCodes.includes(
      NORTHERN_IRELAND_CODE
    );

    return shipsToEEA || shipsToNorthernIreland;
  } catch (error) {
    console.error("Error checking GPSR compliance requirement:", error);
    return false;
  }
}

/**
 * Get the required onboarding steps for a seller (including conditional GPSR)
 */
export async function getRequiredOnboardingSteps(
  sellerId: string
): Promise<OnboardingStepKey[]> {
  const isGPSRRequired = await isGPSRComplianceRequired(sellerId);

  if (isGPSRRequired) {
    return [...BASE_ONBOARDING_STEPS, GPSR_COMPLIANCE_STEP];
  }

  return [...BASE_ONBOARDING_STEPS];
}

/**
 * Check if a seller is fully activated based on completed onboarding steps
 */
export async function checkIsFullyActivated(
  sellerId: string
): Promise<boolean> {
  const requiredSteps = await getRequiredOnboardingSteps(sellerId);
  const requiredStepsArray = [...requiredSteps];

  const completedSteps = await prisma.onboardingStep.findMany({
    where: {
      sellerId,
      stepKey: { in: requiredStepsArray },
      completed: true,
    },
  });

  return completedSteps.length === requiredSteps.length;
}

/**
 * Update a seller's onboarding step and recalculate isFullyActivated
 */
export async function updateOnboardingStep(
  sellerId: string,
  stepKey: OnboardingStepKey,
  completed: boolean
): Promise<void> {
  // Upsert the onboarding step
  await prisma.onboardingStep.upsert({
    where: {
      sellerId_stepKey: {
        sellerId,
        stepKey,
      },
    },
    update: {
      completed,
      completedAt: completed ? new Date() : null,
    },
    create: {
      sellerId,
      stepKey,
      completed,
      completedAt: completed ? new Date() : null,
    },
  });

  // Recalculate and update isFullyActivated
  const isFullyActivated = await checkIsFullyActivated(sellerId);

  await prisma.seller.update({
    where: { id: sellerId },
    data: { isFullyActivated },
  });
}

/**
 * Get all onboarding steps for a seller (including conditional GPSR)
 */
export async function getSellerOnboardingSteps(
  sellerId: string
): Promise<OnboardingStepData[]> {
  const requiredSteps = await getRequiredOnboardingSteps(sellerId);

  const steps = await prisma.onboardingStep.findMany({
    where: { sellerId },
    orderBy: { createdAt: "asc" },
  });

  // Create a map of existing steps
  const stepMap = new Map(steps.map((step) => [step.stepKey, step]));

  // Return all required steps with their completion status
  return requiredSteps.map((stepKey) => {
    const step = stepMap.get(stepKey);
    return {
      stepKey,
      completed: step?.completed ?? false,
      completedAt: step?.completedAt ?? undefined,
    };
  });
}

/**
 * Get onboarding progress percentage for a seller
 */
export async function getOnboardingProgress(sellerId: string): Promise<number> {
  const requiredSteps = await getRequiredOnboardingSteps(sellerId);
  const requiredStepsArray = [...requiredSteps];

  const completedSteps = await prisma.onboardingStep.count({
    where: {
      sellerId,
      stepKey: { in: requiredStepsArray },
      completed: true,
    },
  });

  return Math.round((completedSteps / requiredSteps.length) * 100);
}

/**
 * Get the next incomplete onboarding step for a seller
 */
export async function getNextOnboardingStep(
  sellerId: string
): Promise<OnboardingStepKey | null> {
  const requiredSteps = await getRequiredOnboardingSteps(sellerId);

  const completedSteps = await prisma.onboardingStep.findMany({
    where: {
      sellerId,
      stepKey: { in: requiredSteps },
      completed: true,
    },
  });

  const completedStepKeys = new Set(completedSteps.map((step) => step.stepKey));

  // Find the first incomplete step
  for (const stepKey of requiredSteps) {
    if (!completedStepKeys.has(stepKey)) {
      return stepKey;
    }
  }

  return null; // All steps completed
}

/**
 * Initialize onboarding steps for a new seller
 */
export async function initializeOnboardingSteps(
  sellerId: string
): Promise<void> {
  const requiredSteps = await getRequiredOnboardingSteps(sellerId);

  // Create records for all required steps (initially incomplete)
  const stepData = requiredSteps.map((stepKey) => ({
    sellerId,
    stepKey,
    completed: false,
  }));

  // Use upsert for each step to handle duplicates gracefully
  for (const step of stepData) {
    await prisma.onboardingStep.upsert({
      where: {
        sellerId_stepKey: {
          sellerId: step.sellerId,
          stepKey: step.stepKey,
        },
      },
      update: {}, // Don't update if exists
      create: step,
    });
  }
}

/**
 * Bulk update onboarding steps (useful for migrations or admin operations)
 */
export async function bulkUpdateOnboardingSteps(
  sellerId: string,
  steps: Partial<Record<OnboardingStepKey, boolean>>
): Promise<void> {
  const updates = Object.entries(steps).map(([stepKey, completed]) => ({
    sellerId,
    stepKey: stepKey as OnboardingStepKey,
    completed: Boolean(completed),
    completedAt: completed ? new Date() : null,
  }));

  // Use transaction to ensure consistency
  await prisma.$transaction(async (tx) => {
    for (const update of updates) {
      await tx.onboardingStep.upsert({
        where: {
          sellerId_stepKey: {
            sellerId: update.sellerId,
            stepKey: update.stepKey,
          },
        },
        update: {
          completed: update.completed,
          completedAt: update.completedAt,
        },
        create: update,
      });
    }

    // Recalculate isFullyActivated
    const isFullyActivated = await checkIsFullyActivated(sellerId);
    await tx.seller.update({
      where: { id: sellerId },
      data: { isFullyActivated },
    });
  });
}

/**
 * Check and update GPSR compliance status automatically
 * GPSR compliance is complete when:
 * 1. Seller has business address in shop settings (ResponsiblePerson)
 * 2. Seller has at least one product with GPSR information
 */
export async function checkAndUpdateGPSRCompliance(
  sellerId: string
): Promise<void> {
  try {
    // First check if GPSR compliance is required
    const isGPSRRequired = await isGPSRComplianceRequired(sellerId);

    if (!isGPSRRequired) {
      // If GPSR is not required, mark it as completed (skip it)
      await updateOnboardingStep(sellerId, "gpsr_compliance", true);
      return;
    }

    // Get seller with responsible person (business address)
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      select: {
        responsiblePerson: {
          select: {
            encryptedStreet: true,
            encryptedCity: true,
            encryptedPostalCode: true,
            encryptedCountry: true,
            encryptedPhone: true,
            encryptedEmail: true,
            encryptedName: true,
            encryptedCompanyName: true,
          },
        },
      },
    });

    if (!seller || !seller.responsiblePerson) {
      // Mark GPSR compliance as incomplete
      await updateOnboardingStep(sellerId, "gpsr_compliance", false);
      return;
    }

    // Check if business address is provided (encrypted fields exist)
    const hasBusinessAddress = Boolean(
      seller.responsiblePerson.encryptedStreet &&
      seller.responsiblePerson.encryptedCity &&
      seller.responsiblePerson.encryptedPostalCode &&
      seller.responsiblePerson.encryptedCountry &&
      seller.responsiblePerson.encryptedPhone &&
      seller.responsiblePerson.encryptedEmail &&
      seller.responsiblePerson.encryptedName
    );

    if (!hasBusinessAddress) {
      // Mark GPSR compliance as incomplete
      await updateOnboardingStep(sellerId, "gpsr_compliance", false);
      return;
    }

    // Check if seller has at least one product with GPSR information
    const productWithGPSR = await prisma.product.findFirst({
      where: {
        userId: {
          equals: sellerId,
          mode: "insensitive",
        },
        OR: [
          { safetyWarnings: { not: "" } },
          { materialsComposition: { not: "" } },
          { safeUseInstructions: { not: "" } },
        ],
      },
      select: { id: true },
    });

    // Mark GPSR compliance as complete if both conditions are met
    const isGPSRComplete = hasBusinessAddress && !!productWithGPSR;
    await updateOnboardingStep(sellerId, "gpsr_compliance", isGPSRComplete);
  } catch (error) {
    console.error("Error checking GPSR compliance:", error);
  }
}

/**
 * Recalculate onboarding steps when seller location or shipping preferences change
 * This should be called when:
 * - Seller changes shop country
 * - Seller updates shipping exclusions
 * - Seller creates/updates products
 */
export async function recalculateOnboardingSteps(
  sellerId: string
): Promise<void> {
  try {
    // Get current required steps
    const currentRequiredSteps = await getRequiredOnboardingSteps(sellerId);

    // Get existing onboarding steps
    const existingSteps = await prisma.onboardingStep.findMany({
      where: { sellerId },
    });

    // Check if GPSR step exists but is no longer required
    const gpsrStep = existingSteps.find(
      (step) => step.stepKey === "gpsr_compliance"
    );
    const isGPSRRequired = currentRequiredSteps.includes("gpsr_compliance");

    if (gpsrStep && !isGPSRRequired) {
      // GPSR is no longer required, mark it as completed to skip it
      await updateOnboardingStep(sellerId, "gpsr_compliance", true);
    } else if (!gpsrStep && isGPSRRequired) {
      // GPSR is now required, create the step
      await updateOnboardingStep(sellerId, "gpsr_compliance", false);
    }

    // Recalculate isFullyActivated
    const isFullyActivated = await checkIsFullyActivated(sellerId);
    await prisma.seller.update({
      where: { id: sellerId },
      data: { isFullyActivated },
    });
  } catch (error) {
    console.error("Error recalculating onboarding steps:", error);
  }
}
