"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCountryExclusions } from "@/lib/format-country-exclusions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info, ChevronDown, ChevronUp } from "lucide-react";

interface CountryExclusionsMessageProps {
  excludedCountries: string[];
}

const INITIAL_ITEMS_TO_SHOW = 8; // Show first 8 items, then expand for rest

export default function CountryExclusionsMessage({
  excludedCountries,
}: CountryExclusionsMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const formatted = formatCountryExclusions(excludedCountries || []);

  if (!formatted.hasExclusions) {
    return (
      <Alert className="border-purple-200 bg-purple-50">
        <Info className="h-4 w-4 text-purple-600" />
        <AlertDescription className="text-purple-800">
          You currently sell to all countries.
          <p className="text-sm mt-2">
            You can manage these in your{" "}
            <Link
              href="/seller/dashboard/settings#exclusions"
              className="underline font-medium hover:text-purple-900"
            >
              seller settings
            </Link>
            .
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  const exclusionItems: string[] = [
    ...formatted.excludedZones,
    ...formatted.excludedCountries,
  ];

  const itemsToShow = isExpanded
    ? exclusionItems
    : exclusionItems.slice(0, INITIAL_ITEMS_TO_SHOW);
  const hasMoreItems = exclusionItems.length > INITIAL_ITEMS_TO_SHOW;

  return (
    <Alert className="border-amber-200 bg-amber-50">
      <Info className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800 space-y-2">
        <div>
          <p className="font-medium mb-2">
            You currently don&apos;t sell to the following countries/regions:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 ml-2">
            {itemsToShow.map((item, index) => (
              <div key={index} className="flex items-start">
                <span className="text-amber-700 mr-1.5">•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
          {hasMoreItems && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 h-auto py-1 text-amber-700 hover:text-amber-900 hover:bg-amber-100"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Show {exclusionItems.length - INITIAL_ITEMS_TO_SHOW} more
                </>
              )}
            </Button>
          )}
        </div>
        <p className="text-sm mt-3 pt-2 border-t border-amber-200">
          You can manage these in your{" "}
          <Link
            href="/seller/dashboard/settings#exclusions"
            className="underline font-medium hover:text-amber-900"
          >
            seller settings
          </Link>
          .
        </p>
      </AlertDescription>
    </Alert>
  );
}
