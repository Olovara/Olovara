import Link from "next/link";
import { formatCountryExclusions } from "@/lib/format-country-exclusions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface CountryExclusionsMessageProps {
  excludedCountries: string[];
}

export default function CountryExclusionsMessage({
  excludedCountries,
}: CountryExclusionsMessageProps) {
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

  return (
    <Alert className="border-amber-200 bg-amber-50">
      <Info className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800 space-y-2">
        <div>
          <p className="font-medium mb-1">
            You currently don&apos;t sell to the following countries/regions:
          </p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            {exclusionItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
        <p className="text-sm mt-2">
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
