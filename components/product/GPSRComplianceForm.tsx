"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Info } from "lucide-react";

interface GPSRComplianceFormProps {
  safetyWarnings?: string;
  materialsComposition?: string;
  safeUseInstructions?: string;
  ageRestriction?: string;
  chokingHazard?: boolean;
  smallPartsWarning?: boolean;
  chemicalWarnings?: string;
  careInstructions?: string;
  onChange: (field: string, value: string | boolean) => void;
  isRequired?: boolean; // Whether GPSR compliance is required (e.g., for EU sales)
}

const GPSRComplianceForm = ({
  safetyWarnings = "",
  materialsComposition = "",
  safeUseInstructions = "",
  ageRestriction = "",
  chokingHazard = false,
  smallPartsWarning = false,
  chemicalWarnings = "",
  careInstructions = "",
  onChange,
  isRequired = false,
}: GPSRComplianceFormProps) => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">Product Safety & Compliance</CardTitle>
          {isRequired && (
            <Badge variant="destructive" className="text-xs">
              Required for EU Sales
            </Badge>
          )}
        </div>
        <CardDescription>
          Help ensure your product meets safety standards and regulatory requirements.
          {isRequired && (
            <span className="text-red-600 font-medium">
              {" "}Required for EU market compliance.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Safety Warnings */}
        <div className="space-y-2">
          <Label htmlFor="safetyWarnings" className="flex items-center gap-2">
            Safety Warnings
            {isRequired && <span className="text-red-500">*</span>}
          </Label>
          <Textarea
            id="safetyWarnings"
            placeholder="Enter any safety warnings, precautions, or hazards associated with this product..."
            value={safetyWarnings}
            onChange={(e) => onChange("safetyWarnings", e.target.value)}
            className="min-h-[100px]"
          />
          <p className="text-sm text-gray-600">
            Include any potential hazards, age restrictions, or safety precautions.
          </p>
        </div>

        {/* Materials and Composition */}
        <div className="space-y-2">
          <Label htmlFor="materialsComposition" className="flex items-center gap-2">
            Materials & Composition
            {isRequired && <span className="text-red-500">*</span>}
          </Label>
          <Textarea
            id="materialsComposition"
            placeholder="List all materials used in this product, including percentages if applicable..."
            value={materialsComposition}
            onChange={(e) => onChange("materialsComposition", e.target.value)}
            className="min-h-[100px]"
          />
          <p className="text-sm text-gray-600">
            Be specific about materials, especially for items that may come into contact with skin or be ingested.
          </p>
        </div>

        {/* Safe Use Instructions */}
        <div className="space-y-2">
          <Label htmlFor="safeUseInstructions" className="flex items-center gap-2">
            Instructions for Safe Use
            {isRequired && <span className="text-red-500">*</span>}
          </Label>
          <Textarea
            id="safeUseInstructions"
            placeholder="Provide clear instructions on how to safely use this product..."
            value={safeUseInstructions}
            onChange={(e) => onChange("safeUseInstructions", e.target.value)}
            className="min-h-[100px]"
          />
          <p className="text-sm text-gray-600">
            Include proper usage, storage, and any maintenance requirements.
          </p>
        </div>

        {/* Age Restrictions */}
        <div className="space-y-2">
          <Label htmlFor="ageRestriction">Age Restrictions</Label>
          <Input
            id="ageRestriction"
            placeholder="e.g., Not suitable for children under 3 years"
            value={ageRestriction}
            onChange={(e) => onChange("ageRestriction", e.target.value)}
          />
          <p className="text-sm text-gray-600">
            Specify any age restrictions or recommendations.
          </p>
        </div>

        {/* Safety Checkboxes */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Safety Warnings</Label>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="chokingHazard"
                checked={chokingHazard}
                onCheckedChange={(checked) => 
                  onChange("chokingHazard", checked as boolean)
                }
              />
              <Label htmlFor="chokingHazard" className="text-sm">
                Contains small parts that may pose choking hazard
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="smallPartsWarning"
                checked={smallPartsWarning}
                onCheckedChange={(checked) => 
                  onChange("smallPartsWarning", checked as boolean)
                }
              />
              <Label htmlFor="smallPartsWarning" className="text-sm">
                Contains small parts (not suitable for young children)
              </Label>
            </div>
          </div>
        </div>

        {/* Chemical Warnings */}
        <div className="space-y-2">
          <Label htmlFor="chemicalWarnings">Chemical Warnings</Label>
          <Textarea
            id="chemicalWarnings"
            placeholder="Any chemical-related warnings, allergens, or substances to be aware of..."
            value={chemicalWarnings}
            onChange={(e) => onChange("chemicalWarnings", e.target.value)}
            className="min-h-[80px]"
          />
          <p className="text-sm text-gray-600">
            Include information about dyes, finishes, or other chemical treatments.
          </p>
        </div>

        {/* Care Instructions */}
        <div className="space-y-2">
          <Label htmlFor="careInstructions">Care & Maintenance Instructions</Label>
          <Textarea
            id="careInstructions"
            placeholder="Instructions for cleaning, storing, and maintaining this product..."
            value={careInstructions}
            onChange={(e) => onChange("careInstructions", e.target.value)}
            className="min-h-[100px]"
          />
          <p className="text-sm text-gray-600">
            Help customers maintain product safety and longevity.
          </p>
        </div>

        {/* Help Section */}
        <div className="border-t pt-4">
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
          >
            <Info className="h-4 w-4" />
            {showHelp ? "Hide" : "Show"} GPSR Compliance Help
          </button>
          
          {showHelp && (
            <Alert className="mt-3">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>GPSR Compliance Requirements:</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Provide clear safety warnings for any potential hazards</li>
                  <li>List all materials and their composition</li>
                  <li>Include instructions for safe use and maintenance</li>
                  <li>Specify age restrictions if applicable</li>
                  <li>Warn about small parts or choking hazards</li>
                  <li>Disclose any chemical treatments or allergens</li>
                </ul>
                <p className="mt-2 text-xs">
                  These requirements help ensure compliance with EU General Product Safety Regulation (GPSR) 
                  and protect your customers while reducing liability risks.
                </p>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GPSRComplianceForm;
