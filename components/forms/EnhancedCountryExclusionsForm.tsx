"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Submitbutton } from "@/components/SubmitButtons";
import { useState, useEffect } from "react";
import { useIsClient } from "@/hooks/use-is-client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Spinner from "@/components/spinner";
import { CountryExclusionsSchema } from "@/schemas/CountryExclusionsSchema";
import {
  updateCountryExclusions,
  getCountryExclusions,
} from "@/actions/countryExclusionsActions";
import {
  createOrUpdateBusinessAddress,
  getBusinessAddress,
} from "@/actions/businessAddressActions";
import {
  createOrUpdateResponsiblePerson,
  getResponsiblePerson,
} from "@/actions/responsiblePersonActions";
import { getSellerShopCountry } from "@/actions/sellerLocationActions";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getShippableCountries,
  getUNCountryByCode,
  type UNCountry,
} from "@/data/un-countries";
import { Badge } from "@/components/ui/badge";
import {
  X,
  MapPin,
  Building2,
  AlertTriangle,
  Info,
  User,
  Mail,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  isGPSRComplianceRequired,
  EEA_COUNTRIES,
  NORTHERN_IRELAND_CODE,
  GPSR_REQUIRED_COUNTRIES,
} from "@/lib/gpsr-compliance";
import { StateSelect } from "@/components/ui/state-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getOnboardingCountriesByZone } from "@/data/countries";
import { ResponsiblePersonSchema } from "@/schemas/ResponsiblePersonSchema";

// Define region groupings for quick selection (only shippable countries)
const REGION_GROUPS = {
  "North America": getShippableCountries()
    .filter((c) => c.region === "NORTH_AMERICA")
    .map((c) => c.code),
  "South America": getShippableCountries()
    .filter((c) => c.region === "SOUTH_AMERICA")
    .map((c) => c.code),
  "Europe (Non-EU)": getShippableCountries()
    .filter(
      (c) =>
        c.region === "EUROPE" &&
        !EEA_COUNTRIES.includes(c.code) &&
        c.code !== NORTHERN_IRELAND_CODE
    )
    .map((c) => c.code),
  "Middle East": getShippableCountries()
    .filter((c) => c.region === "MIDDLE_EAST")
    .map((c) => c.code),
  Africa: getShippableCountries()
    .filter((c) => c.region === "AFRICA")
    .map((c) => c.code),
  Asia: getShippableCountries()
    .filter((c) => c.region === "ASIA")
    .map((c) => c.code),
  Oceania: getShippableCountries()
    .filter((c) => c.region === "OCEANIA")
    .map((c) => c.code),
  "All EU/EEA Countries": [...EEA_COUNTRIES, NORTHERN_IRELAND_CODE].filter(
    (code) => !getUNCountryByCode(code)?.isSanctioned
  ),
};

// Separate schema for business address
const BusinessAddressFormSchema = z.object({
  street: z.string().min(1, "Street address is required"),
  street2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().min(1, "Postal code is required"),
});

const EnhancedCountryExclusionsForm = () => {
  const isClient = useIsClient();
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isPending, setIsPending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddressFields, setShowAddressFields] = useState(false);
  const [showResponsiblePersonFields, setShowResponsiblePersonFields] =
    useState(false);
  const [isEUBased, setIsEUBased] = useState(false);
  const [shopCountry, setShopCountry] = useState("");
  const [useResponsiblePerson, setUseResponsiblePerson] = useState(false);

  const exclusionsForm = useForm<z.infer<typeof CountryExclusionsSchema>>({
    resolver: zodResolver(CountryExclusionsSchema),
    defaultValues: {
      excludedCountries: [],
    },
  });

  const addressForm = useForm<z.infer<typeof BusinessAddressFormSchema>>({
    resolver: zodResolver(BusinessAddressFormSchema),
    defaultValues: {
      street: "",
      street2: "",
      city: "",
      state: "",
      country: "US",
      postalCode: "",
    },
  });

  const responsiblePersonForm = useForm<
    z.infer<typeof ResponsiblePersonSchema>
  >({
    resolver: zodResolver(ResponsiblePersonSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      companyName: "",
      vatNumber: "",
      address: {
        street: "",
        street2: "",
        city: "",
        state: "",
        country: "DE", // Default to Germany for EU responsible person
        postalCode: "",
      },
    },
  });

  const excludedCountries = exclusionsForm.watch("excludedCountries");
  const availableCountries = getShippableCountries();
  const countryGroups = getOnboardingCountriesByZone();

  // Check if compliance fields should be shown
  useEffect(() => {
    const requiresCompliance = isGPSRComplianceRequired(excludedCountries);
    if (requiresCompliance) {
      if (isEUBased) {
        // EU-based sellers can choose between business address or responsible person
        if (useResponsiblePerson) {
          setShowAddressFields(false);
          setShowResponsiblePersonFields(true);
        } else {
          setShowAddressFields(true);
          setShowResponsiblePersonFields(false);
        }
      } else {
        // Non-EU sellers must use responsible person
        setShowAddressFields(false);
        setShowResponsiblePersonFields(true);
      }
    } else {
      setShowAddressFields(false);
      setShowResponsiblePersonFields(false);
    }
  }, [excludedCountries, isEUBased, useResponsiblePerson]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch seller location
        const locationResult = await getSellerShopCountry();
        if (locationResult.data) {
          setIsEUBased(locationResult.data.isEUBased);
          setShopCountry(locationResult.data.shopCountry);
        }

        // Fetch country exclusions
        const exclusionsResult = await getCountryExclusions();
        if (exclusionsResult.error) {
          setError(exclusionsResult.error);
        } else if (exclusionsResult.data) {
          exclusionsForm.reset({
            excludedCountries: exclusionsResult.data.excludedCountries || [],
          });
        }

        // Fetch business address
        const addressResult = await getBusinessAddress();
        if (
          addressResult.data &&
          addressResult.data.hasAddress &&
          addressResult.data.address
        ) {
          // Populate the address form with decrypted data
          addressForm.reset({
            street: addressResult.data.address.street,
            street2: addressResult.data.address.street2 || "",
            city: addressResult.data.address.city,
            state: addressResult.data.address.state || "",
            country: addressResult.data.address.country,
            postalCode: addressResult.data.address.postalCode,
          });
        }

        // Fetch responsible person
        const responsiblePersonResult = await getResponsiblePerson();
        if (
          responsiblePersonResult.data &&
          responsiblePersonResult.data.hasResponsiblePerson &&
          responsiblePersonResult.data.responsiblePerson
        ) {
          // Populate the responsible person form with decrypted data
          responsiblePersonForm.reset({
            name: responsiblePersonResult.data.responsiblePerson.name,
            email: responsiblePersonResult.data.responsiblePerson.email,
            phone: responsiblePersonResult.data.responsiblePerson.phone,
            companyName:
              responsiblePersonResult.data.responsiblePerson.companyName,
            vatNumber:
              responsiblePersonResult.data.responsiblePerson.vatNumber || "",
            address: {
              street:
                responsiblePersonResult.data.responsiblePerson.address.street,
              street2:
                responsiblePersonResult.data.responsiblePerson.address
                  .street2 || "",
              city: responsiblePersonResult.data.responsiblePerson.address.city,
              state:
                responsiblePersonResult.data.responsiblePerson.address.state ||
                "",
              country:
                responsiblePersonResult.data.responsiblePerson.address.country,
              postalCode:
                responsiblePersonResult.data.responsiblePerson.address
                  .postalCode,
            },
          });
        }
      } catch (error) {
        setError("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [exclusionsForm, addressForm, responsiblePersonForm]);

  const onSubmitExclusions = async (
    values: z.infer<typeof CountryExclusionsSchema>
  ) => {
    try {
      setIsPending(true);
      setError("");
      setSuccess("");

      const result = await updateCountryExclusions(values);

      if (result.error) {
        toast.error(result.error);
        throw new Error(result.error);
      }

      toast.success(
        result.success || "Successfully saved your country exclusions."
      );
    } catch (error) {
      console.error("Error submitting exclusions:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to save country exclusions";
      toast.error(errorMessage);
    } finally {
      setIsPending(false);
    }
  };

  const onSubmitAddress = async (
    values: z.infer<typeof BusinessAddressFormSchema>
  ) => {
    try {
      setIsPending(true);
      setError("");
      setSuccess("");

      const result = await createOrUpdateBusinessAddress(values);

      if (result.error) {
        toast.error(result.error);
        throw new Error(result.error);
      }

      toast.success(
        result.success || "Successfully saved your business address."
      );
    } catch (error) {
      console.error("Error submitting address:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to save business address";
      toast.error(errorMessage);
    } finally {
      setIsPending(false);
    }
  };

  const onSubmitResponsiblePerson = async (
    values: z.infer<typeof ResponsiblePersonSchema>
  ) => {
    try {
      setIsPending(true);
      setError("");
      setSuccess("");

      const result = await createOrUpdateResponsiblePerson(values);

      if (result.error) {
        toast.error(result.error);
        throw new Error(result.error);
      }

      toast.success(
        result.success ||
          "Successfully saved your responsible person information."
      );
    } catch (error) {
      console.error("Error submitting responsible person:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to save responsible person information";
      toast.error(errorMessage);
    } finally {
      setIsPending(false);
    }
  };

  const toggleCountry = (countryCode: string) => {
    const currentExcluded = exclusionsForm.getValues("excludedCountries");
    const isExcluded = currentExcluded.includes(countryCode);

    if (isExcluded) {
      exclusionsForm.setValue(
        "excludedCountries",
        currentExcluded.filter((code: string) => code !== countryCode)
      );
    } else {
      exclusionsForm.setValue("excludedCountries", [
        ...currentExcluded,
        countryCode,
      ]);
    }
  };

  const removeCountry = (countryCode: string) => {
    const currentExcluded = exclusionsForm.getValues("excludedCountries");
    exclusionsForm.setValue(
      "excludedCountries",
      currentExcluded.filter((code: string) => code !== countryCode)
    );
  };

  // Quick select functions for regions
  const addRegionToExclusions = (regionName: string) => {
    const currentExcluded = exclusionsForm.getValues("excludedCountries");
    const regionCountries =
      REGION_GROUPS[regionName as keyof typeof REGION_GROUPS] || [];
    const newExcluded = Array.from(
      new Set([...currentExcluded, ...regionCountries])
    );
    exclusionsForm.setValue("excludedCountries", newExcluded);
  };

  const removeRegionFromExclusions = (regionName: string) => {
    const currentExcluded = exclusionsForm.getValues("excludedCountries");
    const regionCountries =
      REGION_GROUPS[regionName as keyof typeof REGION_GROUPS] || [];
    const newExcluded = currentExcluded.filter(
      (code) => !regionCountries.includes(code)
    );
    exclusionsForm.setValue("excludedCountries", newExcluded);
  };

  const isRegionFullyExcluded = (regionName: string) => {
    const regionCountries =
      REGION_GROUPS[regionName as keyof typeof REGION_GROUPS] || [];
    const currentExcluded = exclusionsForm.getValues("excludedCountries");
    return regionCountries.every((country) =>
      currentExcluded.includes(country)
    );
  };

  const isRegionPartiallyExcluded = (regionName: string) => {
    const regionCountries =
      REGION_GROUPS[regionName as keyof typeof REGION_GROUPS] || [];
    const currentExcluded = exclusionsForm.getValues("excludedCountries");
    const excludedCount = regionCountries.filter((country) =>
      currentExcluded.includes(country)
    ).length;
    return excludedCount > 0 && excludedCount < regionCountries.length;
  };

  // Get GPSR required countries that are not excluded
  const gpsrRequiredCountries = GPSR_REQUIRED_COUNTRIES.filter(
    (country) => !excludedCountries.includes(country)
  );

  if (!isClient || isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">
          Shipping Restrictions & Business Address
        </h3>
        <p className="text-sm text-muted-foreground">
          Select countries you don&apos;t want to ship to and provide your
          business address for EU compliance.
        </p>
        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-700">
            <strong>Note:</strong> Sanctioned countries (including Russia, North
            Korea, Iran, Syria, Cuba, Venezuela, Belarus, Myanmar, and others)
            are automatically excluded and cannot be shipped to due to
            international trade restrictions.
          </AlertDescription>
        </Alert>
      </div>
      <div className="flex flex-col gap-y-6">
        {/* GPSR Compliance Alert */}
        {(showAddressFields || showResponsiblePersonFields) && (
          <Alert className="border-purple-200 bg-purple-50">
            <Building2 className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-sm">
              <div className="space-y-2">
                <p className="font-medium text-purple-900">
                  EU Compliance Required
                </p>
                <p className="text-purple-700">
                  You are shipping to{" "}
                  {gpsrRequiredCountries.length === 1
                    ? "a country"
                    : "countries"}{" "}
                  that require EU compliance:
                  <span className="font-medium">
                    {" "}
                    {gpsrRequiredCountries
                      .map((code) => {
                        const country = getUNCountryByCode(code);
                        return country?.name || code;
                      })
                      .join(", ")}
                  </span>
                </p>
                <p className="text-purple-700">
                  {isEUBased
                    ? "Since your shop is based in the EU, you can choose to provide your business address or designate a responsible person within the EU."
                    : "Since your shop is not based in the EU, you need to designate a responsible person within the EU who can be held accountable for product safety compliance."}
                </p>
                {isEUBased && (
                  <div className="flex items-center space-x-2 mt-3">
                    <Checkbox
                      id="useResponsiblePerson"
                      checked={useResponsiblePerson}
                      onCheckedChange={(checked) => setUseResponsiblePerson(checked as boolean)}
                      disabled={isPending}
                    />
                    <Label
                      htmlFor="useResponsiblePerson"
                      className="text-sm font-medium text-purple-700 cursor-pointer"
                    >
                      Use responsible person instead of my business address (keeps my address private)
                    </Label>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Excluded Countries Display */}
        {excludedCountries.length > 0 && (
          <div className="space-y-3">
            <Label>
              Currently Excluded Countries ({excludedCountries.length})
            </Label>
            <div className="flex flex-wrap gap-2">
              {excludedCountries.map((countryCode) => {
                const country = getUNCountryByCode(countryCode);
                return (
                  <Badge
                    key={countryCode}
                    variant="destructive"
                    className="flex items-center gap-1"
                  >
                    {country?.name || countryCode}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1 hover:bg-transparent"
                      onClick={() => removeCountry(countryCode)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Select Regions */}
        <div className="space-y-3">
          <Label>Quick Select Regions</Label>
          <div className="flex flex-wrap gap-2">
            {Object.keys(REGION_GROUPS).map((regionName) => {
              const isFullyExcluded = isRegionFullyExcluded(regionName);
              const isPartiallyExcluded = isRegionPartiallyExcluded(regionName);
              const regionCountries =
                REGION_GROUPS[regionName as keyof typeof REGION_GROUPS];
              const excludedCount = regionCountries.filter((country) =>
                excludedCountries.includes(country)
              ).length;

              return (
                <Button
                  key={regionName}
                  type="button"
                  variant={
                    isFullyExcluded
                      ? "destructive"
                      : isPartiallyExcluded
                        ? "secondary"
                        : "outline"
                  }
                  size="sm"
                  onClick={() => {
                    if (isFullyExcluded) {
                      removeRegionFromExclusions(regionName);
                    } else {
                      addRegionToExclusions(regionName);
                    }
                  }}
                  disabled={isPending}
                  className="text-xs"
                >
                  {regionName}
                  {isPartiallyExcluded && (
                    <Badge variant="outline" className="ml-1 text-xs">
                      {excludedCount}/{regionCountries.length}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Click to exclude all countries in a region. Click again to remove
            the entire region from exclusions.
          </p>
        </div>

        {/* Country Selection */}
        <div className="space-y-3">
          <Label>Select Individual Countries to Exclude</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto border rounded-md p-4">
            {availableCountries.map((country: UNCountry) => {
              const isExcluded = excludedCountries.includes(country.code);
              const isGPSRRequired = GPSR_REQUIRED_COUNTRIES.includes(
                country.code
              );

              return (
                <div key={country.code} className="flex items-center space-x-2">
                  <Checkbox
                    id={country.code}
                    checked={isExcluded}
                    onCheckedChange={() => toggleCountry(country.code)}
                    disabled={isPending}
                  />
                  <Label
                    htmlFor={country.code}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    <div className="flex items-center gap-2">
                      <span>{country.name}</span>
                      {isGPSRRequired && (
                        <Badge variant="outline" className="text-xs">
                          EU
                        </Badge>
                      )}
                      {country.code === NORTHERN_IRELAND_CODE && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                        >
                          NI
                        </Badge>
                      )}
                    </div>
                  </Label>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Check the boxes above to exclude individual countries from your
            shipping destinations. Countries marked with &quot;EU&quot; require
            compliance information. Use the quick select buttons above for bulk
            operations.
          </p>
        </div>

        {/* Submit Exclusions Button */}
        <div className="flex justify-start">
          <Button
            type="button"
            onClick={async () => {
              try {
                setIsPending(true);
                setError("");
                setSuccess("");

                const currentExcluded =
                  exclusionsForm.getValues("excludedCountries");
                const result = await updateCountryExclusions({
                  excludedCountries: currentExcluded,
                });

                if (result.error) {
                  toast.error(result.error);
                  throw new Error(result.error);
                }

                toast.success(
                  result.success ||
                    "Successfully saved your country exclusions."
                );
              } catch (error) {
                console.error("Error submitting exclusions:", error);
                const errorMessage =
                  error instanceof Error
                    ? error.message
                    : "Failed to save country exclusions";
                toast.error(errorMessage);
              } finally {
                setIsPending(false);
              }
            }}
            disabled={isPending}
            className="w-full sm:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 h-12"
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Please Wait...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Save Exclusions
              </>
            )}
          </Button>
        </div>

        {/* Business Address Section */}
        {showAddressFields && (
          <>
            <Separator />
            <form
              onSubmit={addressForm.handleSubmit(onSubmitAddress)}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-black-600" />
                <h3 className="text-lg font-semibold">
                  Business Address (EU Compliance)
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Provide your business address for EU compliance requirements.
                This information will be displayed to customers. You can also choose to use a responsible person instead to keep your address private.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Select
                    onValueChange={(value) =>
                      addressForm.setValue("country", value)
                    }
                    defaultValue={addressForm.watch("country")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countryGroups.map((group) => (
                        <div key={group.zone}>
                          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                            {group.name}
                          </div>
                          {group.countries.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <StateSelect
                    countryCode={addressForm.watch("country")}
                    value={addressForm.watch("state")}
                    onValueChange={(value) =>
                      addressForm.setValue("state", value)
                    }
                    placeholder="Select state or province"
                    disabled={isPending}
                  />
                </div>

                <div className="flex flex-col gap-y-2">
                  <Label htmlFor="city">City/Town *</Label>
                  <Input
                    id="city"
                    placeholder="City or town"
                    {...addressForm.register("city")}
                    disabled={isPending}
                  />
                </div>

                <div className="flex flex-col gap-y-2">
                  <Label htmlFor="postalCode">Postal Code *</Label>
                  <Input
                    id="postalCode"
                    placeholder="Postal code"
                    {...addressForm.register("postalCode")}
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-y-2">
                <Label htmlFor="street">Street Address *</Label>
                <Input
                  id="street"
                  placeholder="Enter your business street address"
                  {...addressForm.register("street")}
                  disabled={isPending}
                />
              </div>

              <div className="flex flex-col gap-y-2">
                <Label htmlFor="street2">Street Address 2 (Optional)</Label>
                <Input
                  id="street2"
                  placeholder="Apartment, suite, etc."
                  {...addressForm.register("street2")}
                  disabled={isPending}
                />
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-700">
                  This address will be displayed to customers when you ship to
                  EU countries or Northern Ireland. Make sure it&apos;s accurate
                  and up-to-date.
                </AlertDescription>
              </Alert>

              <Submitbutton
                title="Save Business Address"
                isPending={isPending}
              />
            </form>
          </>
        )}

        {/* Responsible Person Section */}
        {showResponsiblePersonFields && (
          <>
            <Separator />
            <form
              onSubmit={responsiblePersonForm.handleSubmit(
                onSubmitResponsiblePerson
              )}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-black-600" />
                <h3 className="text-lg font-semibold">
                  Responsible Person (EU Compliance)
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Designate a responsible person within the EU who can be held
                accountable for product safety compliance. This keeps your business address private.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Responsible person's full name"
                    {...responsiblePersonForm.register("name")}
                    disabled={isPending}
                  />
                </div>

                <div className="flex flex-col gap-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="responsible.person@company.com"
                    {...responsiblePersonForm.register("email")}
                    disabled={isPending}
                  />
                </div>

                <div className="flex flex-col gap-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    placeholder="+49 123 456 789"
                    {...responsiblePersonForm.register("phone")}
                    disabled={isPending}
                  />
                </div>

                <div className="flex flex-col gap-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    placeholder="Company or organization name"
                    {...responsiblePersonForm.register("companyName")}
                    disabled={isPending}
                  />
                </div>

                <div className="flex flex-col gap-y-2">
                  <Label htmlFor="vatNumber">VAT Number (Optional)</Label>
                  <Input
                    id="vatNumber"
                    placeholder="DE123456789"
                    {...responsiblePersonForm.register("vatNumber")}
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-black-600" />
                  <h4 className="text-md font-semibold">
                    Responsible Person Address (Must be in EU)
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-y-2">
                    <Label htmlFor="rp-country">Country *</Label>
                    <Select
                      onValueChange={(value) =>
                        responsiblePersonForm.setValue("address.country", value)
                      }
                      defaultValue={responsiblePersonForm.watch(
                        "address.country"
                      )}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select EU country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countryGroups.map((group) => (
                          <div key={group.zone}>
                            <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                              {group.name}
                            </div>
                            {group.countries
                              .filter((country) =>
                                EEA_COUNTRIES.includes(country.code)
                              )
                              .map((country) => (
                                <SelectItem
                                  key={country.code}
                                  value={country.code}
                                >
                                  {country.name}
                                </SelectItem>
                              ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-y-2">
                    <Label htmlFor="rp-state">State/Province</Label>
                    <StateSelect
                      countryCode={responsiblePersonForm.watch(
                        "address.country"
                      )}
                      value={responsiblePersonForm.watch("address.state")}
                      onValueChange={(value) =>
                        responsiblePersonForm.setValue("address.state", value)
                      }
                      placeholder="Select state or province"
                      disabled={isPending}
                    />
                  </div>

                  <div className="flex flex-col gap-y-2">
                    <Label htmlFor="rp-city">City/Town *</Label>
                    <Input
                      id="rp-city"
                      placeholder="City or town"
                      {...responsiblePersonForm.register("address.city")}
                      disabled={isPending}
                    />
                  </div>

                  <div className="flex flex-col gap-y-2">
                    <Label htmlFor="rp-postalCode">Postal Code *</Label>
                    <Input
                      id="rp-postalCode"
                      placeholder="Postal code"
                      {...responsiblePersonForm.register("address.postalCode")}
                      disabled={isPending}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-y-2">
                  <Label htmlFor="rp-street">Street Address *</Label>
                  <Input
                    id="rp-street"
                    placeholder="Enter responsible person's street address"
                    {...responsiblePersonForm.register("address.street")}
                    disabled={isPending}
                  />
                </div>

                <div className="flex flex-col gap-y-2">
                  <Label htmlFor="rp-street2">
                    Street Address 2 (Optional)
                  </Label>
                  <Input
                    id="rp-street2"
                    placeholder="Apartment, suite, etc."
                    {...responsiblePersonForm.register("address.street2")}
                    disabled={isPending}
                  />
                </div>
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-700">
                  The responsible person must be located within the EU and can
                  be held accountable for product safety compliance. This
                  information will be displayed to customers and regulatory
                  authorities when required.
                </AlertDescription>
              </Alert>

              <Submitbutton
                title="Save Responsible Person"
                isPending={isPending}
              />
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default EnhancedCountryExclusionsForm;
