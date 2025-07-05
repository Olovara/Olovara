"use client";

import { Badge } from "@/components/ui/badge";
import { getExcludedCountryNames } from "@/lib/country-exclusions";
import { Globe, AlertTriangle } from "lucide-react";

interface ExcludedCountriesProps {
  excludedCountries?: string[] | null;
}

const ExcludedCountries = ({ excludedCountries }: ExcludedCountriesProps) => {
  if (!excludedCountries || excludedCountries.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-green-600" />
          <h3 className="text-sm font-medium">Shipping Restrictions</h3>
        </div>
        <p className="text-sm text-gray-600">
          This seller ships worldwide
        </p>
      </div>
    );
  }

  const excludedCountryNames = getExcludedCountryNames(excludedCountries);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <h3 className="text-sm font-medium">Shipping Restrictions</h3>
      </div>
      <p className="text-sm text-gray-600">
        This seller does not ship to the following countries:
      </p>
      <div className="flex flex-wrap gap-1.5">
        {excludedCountryNames.map((countryName) => (
          <Badge key={countryName} variant="secondary" className="text-xs px-2 py-1">
            {countryName}
          </Badge>
        ))}
      </div>
      <p className="text-xs text-gray-500">
        {excludedCountries.length} countr{excludedCountries.length === 1 ? 'y' : 'ies'} excluded
      </p>
    </div>
  );
};

export default ExcludedCountries; 