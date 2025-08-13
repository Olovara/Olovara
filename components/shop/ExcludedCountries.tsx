"use client";

import { Badge } from "@/components/ui/badge";
import { getExcludedCountryNames } from "@/lib/country-exclusions";
import { Globe, AlertTriangle, MapPin, Building2 } from "lucide-react";
import { formatBusinessAddress } from "@/lib/gpsr-compliance";

interface ExcludedCountriesProps {
  excludedCountries?: string[] | null;
  sellerAddress?: string; // Seller's address for EU compliance
  isEUCompliant?: boolean; // Whether seller has provided EU compliance info
  businessAddress?: {
    street?: string;
    street2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
}

const ExcludedCountries = ({ 
  excludedCountries, 
  sellerAddress, 
  isEUCompliant = false,
  businessAddress
}: ExcludedCountriesProps) => {
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
        {/* EU Compliance Information */}
        {isEUCompliant && (businessAddress || sellerAddress) && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900">EU Compliant Seller</p>
                <p className="text-xs text-blue-700">
                  This seller has provided EU compliance information and business address.
                </p>
                <div className="flex items-start gap-1 mt-1">
                  <MapPin className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700">
                    {businessAddress ? 
                      formatBusinessAddress(businessAddress) :
                      sellerAddress
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
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
      
      {/* EU Compliance Information */}
      {isEUCompliant && (businessAddress || sellerAddress) && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start gap-2">
            <Building2 className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900">EU Compliant Seller</p>
              <p className="text-xs text-blue-700">
                This seller has provided EU compliance information and business address.
              </p>
              <div className="flex items-start gap-1 mt-1">
                <MapPin className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  {businessAddress ? 
                    formatBusinessAddress(businessAddress) :
                    sellerAddress
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcludedCountries; 