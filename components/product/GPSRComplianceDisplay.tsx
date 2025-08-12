"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, Info, Baby, Droplets } from "lucide-react";

interface GPSRComplianceDisplayProps {
  safetyWarnings?: string;
  materialsComposition?: string;
  safeUseInstructions?: string;
  ageRestriction?: string;
  chokingHazard?: boolean;
  smallPartsWarning?: boolean;
  chemicalWarnings?: string;
  careInstructions?: string;
  showAll?: boolean; // Whether to show all fields or just warnings
}

const GPSRComplianceDisplay = ({
  safetyWarnings,
  materialsComposition,
  safeUseInstructions,
  ageRestriction,
  chokingHazard,
  smallPartsWarning,
  chemicalWarnings,
  careInstructions,
  showAll = false,
}: GPSRComplianceDisplayProps) => {
  // Check if there's any GPSR data to display
  const hasGPSRData =
    safetyWarnings ||
    materialsComposition ||
    safeUseInstructions ||
    ageRestriction ||
    chokingHazard ||
    smallPartsWarning ||
    chemicalWarnings ||
    careInstructions;

  if (!hasGPSRData) {
    return null;
  }

  // Check if there are any safety warnings that should be prominently displayed
  const hasSafetyWarnings =
    safetyWarnings ||
    chokingHazard ||
    smallPartsWarning ||
    ageRestriction ||
    chemicalWarnings;

  return (
    <div className="space-y-4">
      {/* Prominent Safety Warnings */}
      {hasSafetyWarnings && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-sm">
            <div className="space-y-2">
              {safetyWarnings && (
                <div>
                  <strong>Safety Warnings:</strong> {safetyWarnings}
                </div>
              )}
              {chokingHazard && (
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-xs">
                    Choking Hazard
                  </Badge>
                  <span>Contains small parts that may pose choking hazard</span>
                </div>
              )}
              {smallPartsWarning && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Small Parts
                  </Badge>
                  <span>
                    Contains small parts - not suitable for young children
                  </span>
                </div>
              )}
              {ageRestriction && (
                <div className="flex items-center gap-2">
                  <Baby className="h-4 w-4 text-blue-600" />
                  <span>
                    <strong>Age Restriction:</strong> {ageRestriction}
                  </span>
                </div>
              )}
              {chemicalWarnings && (
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-purple-600" />
                  <span>
                    <strong>Chemical Warnings:</strong> {chemicalWarnings}
                  </span>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed GPSR Information Card */}
      {showAll && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">
                Product Safety Information
              </CardTitle>
            </div>
            <CardDescription>
              Safety and compliance information for this product
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Materials and Composition */}
            {materialsComposition && (
              <div>
                <h4 className="font-medium text-sm mb-1">
                  Materials & Composition
                </h4>
                <p className="text-sm text-gray-700">{materialsComposition}</p>
              </div>
            )}

            {/* Safe Use Instructions */}
            {safeUseInstructions && (
              <div>
                <h4 className="font-medium text-sm mb-1">
                  Safe Use Instructions
                </h4>
                <p className="text-sm text-gray-700">{safeUseInstructions}</p>
              </div>
            )}

            {/* Care Instructions */}
            {careInstructions && (
              <div>
                <h4 className="font-medium text-sm mb-1">Care & Maintenance</h4>
                <p className="text-sm text-gray-700">{careInstructions}</p>
              </div>
            )}

            {/* Safety Compliance Badge */}
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-xs text-gray-600">
                  This product includes safety information compliant with EU
                  General Product Safety Regulation (GPSR)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compact Safety Badge for Product Cards */}
      {!showAll && hasSafetyWarnings && (
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Shield className="h-3 w-3" />
          <span>Safety information available</span>
        </div>
      )}
    </div>
  );
};

export default GPSRComplianceDisplay;
