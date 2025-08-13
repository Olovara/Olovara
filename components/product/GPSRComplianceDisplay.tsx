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
  safetyWarnings?: string | null;
  materialsComposition?: string | null;
  safeUseInstructions?: string | null;
  ageRestriction?: string | null;
  chokingHazard?: boolean;
  smallPartsWarning?: boolean;
  chemicalWarnings?: string | null;
  careInstructions?: string | null;
  responsiblePerson?: {
    name: string;
    email: string;
    phone: string;
    companyName: string;
    vatNumber?: string;
    address: {
      street: string;
      street2?: string;
      city: string;
      state?: string;
      country: string;
      postalCode: string;
    };
  } | null;
  businessAddress?: {
    street: string;
    street2?: string;
    city: string;
    state?: string;
    country: string;
    postalCode: string;
  } | null;
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
  responsiblePerson,
  businessAddress,
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
                  <Baby className="h-4 w-4 text-black-600" />
                  <span>
                    <strong>Age Restriction:</strong> {ageRestriction}
                  </span>
                </div>
              )}
              {chemicalWarnings && (
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-black-600" />
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
              <Shield className="h-5 w-5 text-black-600" />
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

            {/* Responsible Person Information */}
            <div className="pt-2 border-t">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Responsible Person Information</h4>
                {responsiblePerson ? (
                  <div className="space-y-1 text-xs text-gray-700">
                    <div><strong>Name:</strong> {responsiblePerson.name}</div>
                    <div><strong>Company:</strong> {responsiblePerson.companyName}</div>
                    <div><strong>Email:</strong> {responsiblePerson.email}</div>
                    <div><strong>Phone:</strong> {responsiblePerson.phone}</div>
                    {responsiblePerson.vatNumber && (
                      <div><strong>VAT Number:</strong> {responsiblePerson.vatNumber}</div>
                    )}
                    <div className="mt-2">
                      <strong>Address:</strong>
                      <div className="ml-2">
                        {responsiblePerson.address.street}
                        {responsiblePerson.address.street2 && <br />}
                        {responsiblePerson.address.street2 && responsiblePerson.address.street2}
                        <br />
                        {responsiblePerson.address.city}
                        {responsiblePerson.address.state && `, ${responsiblePerson.address.state}`}
                        <br />
                        {responsiblePerson.address.postalCode}
                        <br />
                        {responsiblePerson.address.country}
                      </div>
                    </div>
                  </div>
                ) : businessAddress ? (
                  <div className="space-y-1 text-xs text-gray-700">
                    <div><strong>Business Address:</strong></div>
                    <div className="ml-2">
                      {businessAddress.street}
                      {businessAddress.street2 && <br />}
                      {businessAddress.street2 && businessAddress.street2}
                      <br />
                      {businessAddress.city}
                      {businessAddress.state && `, ${businessAddress.state}`}
                      <br />
                      {businessAddress.postalCode}
                      <br />
                      {businessAddress.country}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                      <div className="flex items-start gap-2">
                        <span className="text-amber-600">⚠️</span>
                        <div>
                          <strong>No Responsible Person Information:</strong> The responsible person information for this product is not available. 
                          This information is required for GPSR compliance.
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">
                      For current responsible person or business address information, 
                      please contact the seller directly through their shop page.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Safety Compliance Badge */}
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-black-600" />
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
