"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Submitbutton } from "@/components/SubmitButtons";
import { useState, useEffect } from "react";
import { useIsClient } from "@/hooks/use-is-client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Spinner from "@/components/spinner";
import { Textarea } from "@/components/ui/textarea";
import { SellerSchema } from "@/schemas/SellerSchema";
import { updateSellerInformation } from "@/actions/sellerInformation";
import { getSellerData } from "@/actions/getSellerData";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  SUPPORTED_CURRENCIES, 
  SUPPORTED_WEIGHT_UNITS, 
  SUPPORTED_DIMENSION_UNITS,
  SUPPORTED_DISTANCE_UNITS,
  CurrencyCode,
  WeightUnit,
  DimensionUnit,
  DistanceUnit
} from "@/data/units";
import { getCountryByCode, getOnboardingCountriesByZone } from "@/data/countries";

// Update TaxCountry type to use country codes from schema
type TaxCountry = z.infer<typeof SellerSchema>["taxCountry"];

const SellerForm = () => {
  const isClient = useIsClient();
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isPending, setIsPending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<z.infer<typeof SellerSchema>>({
    resolver: zodResolver(SellerSchema),
    defaultValues: {
      shopName: "",
      shopDescription: "",
      preferredCurrency: "USD" as typeof SUPPORTED_CURRENCIES[number]['code'],
      preferredWeightUnit: "lbs" as typeof SUPPORTED_WEIGHT_UNITS[number]['code'],
      preferredDimensionUnit: "in" as typeof SUPPORTED_DIMENSION_UNITS[number]['code'],
      preferredDistanceUnit: "miles" as typeof SUPPORTED_DISTANCE_UNITS[number]['code'],
      isWomanOwned: false,
      isMinorityOwned: false,
      isLGBTQOwned: false,
      isVeteranOwned: false,
      isSustainable: false,
      isCharitable: false,
      valuesPreferNotToSay: false,
      businessName: "",
      taxId: "",
      businessAddress: "",
      businessCity: "",
      businessState: "",
      businessPostalCode: "",
      taxCountry: "US" as TaxCountry,
      additionalTaxRegistrations: "",
    },
  });

  // Watch the prefer not to say checkbox
  const preferNotToSay = form.watch("valuesPreferNotToSay");

  // Handle prefer not to say checkbox change
  const handlePreferNotToSayChange = (checked: boolean) => {
    if (checked) {
      // Uncheck all other boxes when prefer not to say is checked
      form.setValue("isWomanOwned", false);
      form.setValue("isMinorityOwned", false);
      form.setValue("isLGBTQOwned", false);
      form.setValue("isVeteranOwned", false);
      form.setValue("isSustainable", false);
      form.setValue("isCharitable", false);
    }
    form.setValue("valuesPreferNotToSay", checked);
  };

  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        const result = await getSellerData();
        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          // Ensure boolean values are properly set
          const formattedData = {
            ...result.data,
            isWomanOwned: Boolean(result.data.isWomanOwned),
            isMinorityOwned: Boolean(result.data.isMinorityOwned),
            isLGBTQOwned: Boolean(result.data.isLGBTQOwned),
            isVeteranOwned: Boolean(result.data.isVeteranOwned),
            isSustainable: Boolean(result.data.isSustainable),
            isCharitable: Boolean(result.data.isCharitable),
            valuesPreferNotToSay: Boolean(result.data.valuesPreferNotToSay),
            // Use business address data if available
            businessAddress: result.data.businessAddress?.street || "",
            businessCity: result.data.businessAddress?.city || "",
            businessState: result.data.businessAddress?.state || "",
            businessPostalCode: result.data.businessAddress?.postalCode || "",
            taxCountry: result.data.businessAddress?.country || "US",
          };
          form.reset(formattedData);
        }
      } catch (error) {
        setError("Failed to load seller data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSellerData();
  }, [form]);

  const onSubmit = async (values: z.infer<typeof SellerSchema>) => {
    try {
      setIsPending(true);
      setError("");
      setSuccess("");

      // Send raw data to server action
      const result = await updateSellerInformation(values);

      if (result.error) {
        toast.error(result.error);
        throw new Error(result.error);
      }

      toast.success(result.message || "Successfully saved your shop information.");
      
      // Refresh the page to get updated session data with new permissions TODO: Modify to only do this the first time saving
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error submitting form:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save seller information";
      toast.error(errorMessage);
    } finally {
      setIsPending(false);
    }
  };

  const countryGroups = getOnboardingCountriesByZone();

  if (!isClient || isLoading) return <Spinner />;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <CardHeader>
        <CardTitle>Seller Information</CardTitle>
        <CardDescription>Please fill in the information below</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-6">
        <div className="flex flex-col gap-y-2">
          <Label>Shop Name</Label>
          <Input
            placeholder="Shop Name"
            {...form.register("shopName")}
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-y-2">
          <Label>Shop Description</Label>
          <Textarea
            placeholder="Please give your shop a description."
            {...form.register("shopDescription")}
            disabled={isPending}
          />
        </div>

        <Separator className="my-4" />

        {/* Unit Preferences Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Unit Preferences</h3>
          <p className="text-sm text-muted-foreground">
            Set your preferred units for product measurements. These will be used as defaults when creating products.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-y-2">
              <Label>Preferred Currency</Label>
              <Select
                onValueChange={(value) => form.setValue("preferredCurrency", value as CurrencyCode)}
                defaultValue={form.watch("preferredCurrency")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-y-2">
              <Label>Preferred Weight Unit</Label>
              <Select
                onValueChange={(value) => form.setValue("preferredWeightUnit", value as WeightUnit)}
                defaultValue={form.watch("preferredWeightUnit")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select weight unit" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_WEIGHT_UNITS.map((unit) => (
                    <SelectItem key={unit.code} value={unit.code}>
                      {unit.name} ({unit.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Used for product weight measurements
              </p>
            </div>

            <div className="flex flex-col gap-y-2">
              <Label>Preferred Dimension Unit</Label>
              <Select
                onValueChange={(value) => form.setValue("preferredDimensionUnit", value as DimensionUnit)}
                defaultValue={form.watch("preferredDimensionUnit")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select dimension unit" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_DIMENSION_UNITS.map((unit) => (
                    <SelectItem key={unit.code} value={unit.code}>
                      {unit.name} ({unit.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Used for product length, width, and height measurements
              </p>
            </div>

            <div className="flex flex-col gap-y-2">
              <Label>Preferred Distance Unit</Label>
              <Select
                onValueChange={(value) => form.setValue("preferredDistanceUnit", value as DistanceUnit)}
                defaultValue={form.watch("preferredDistanceUnit")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select distance unit" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_DISTANCE_UNITS.map((unit) => (
                    <SelectItem key={unit.code} value={unit.code}>
                      {unit.name} ({unit.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Used for shipping distance calculations
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Shop Values</h3>
          <p className="text-sm text-muted-foreground">
            Let customers know what makes your shop special. This helps
            customers find and support businesses that align with their values.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isWomanOwned"
                checked={form.watch("isWomanOwned")}
                onCheckedChange={(checked) => {
                  form.setValue("isWomanOwned", Boolean(checked));
                }}
                disabled={isPending || preferNotToSay}
                className={preferNotToSay ? "opacity-50" : ""}
              />
              <Label htmlFor="isWomanOwned" className={preferNotToSay ? "opacity-50" : ""}>
                Woman-Owned Business
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isMinorityOwned"
                checked={form.watch("isMinorityOwned")}
                onCheckedChange={(checked) => {
                  form.setValue("isMinorityOwned", Boolean(checked));
                }}
                disabled={isPending || preferNotToSay}
                className={preferNotToSay ? "opacity-50" : ""}
              />
              <Label htmlFor="isMinorityOwned" className={preferNotToSay ? "opacity-50" : ""}>
                Minority-Owned Business
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isLGBTQOwned"
                checked={form.watch("isLGBTQOwned")}
                onCheckedChange={(checked) => {
                  form.setValue("isLGBTQOwned", Boolean(checked));
                }}
                disabled={isPending || preferNotToSay}
                className={preferNotToSay ? "opacity-50" : ""}
              />
              <Label htmlFor="isLGBTQOwned" className={preferNotToSay ? "opacity-50" : ""}>
                LGBTQ+-Owned Business
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isVeteranOwned"
                checked={form.watch("isVeteranOwned")}
                onCheckedChange={(checked) => {
                  form.setValue("isVeteranOwned", Boolean(checked));
                }}
                disabled={isPending || preferNotToSay}
                className={preferNotToSay ? "opacity-50" : ""}
              />
              <Label htmlFor="isVeteranOwned" className={preferNotToSay ? "opacity-50" : ""}>
                Veteran-Owned Business
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isSustainable"
                checked={form.watch("isSustainable")}
                onCheckedChange={(checked) => {
                  form.setValue("isSustainable", Boolean(checked));
                }}
                disabled={isPending || preferNotToSay}
                className={preferNotToSay ? "opacity-50" : ""}
              />
              <Label htmlFor="isSustainable" className={preferNotToSay ? "opacity-50" : ""}>
                Sustainable Practices
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isCharitable"
                checked={form.watch("isCharitable")}
                onCheckedChange={(checked) => {
                  form.setValue("isCharitable", Boolean(checked));
                }}
                disabled={isPending || preferNotToSay}
                className={preferNotToSay ? "opacity-50" : ""}
              />
              <Label htmlFor="isCharitable" className={preferNotToSay ? "opacity-50" : ""}>
                Charitable Business
              </Label>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="valuesPreferNotToSay"
              checked={preferNotToSay}
              onCheckedChange={handlePreferNotToSayChange}
              disabled={isPending}
            />
            <Label htmlFor="valuesPreferNotToSay">Prefer not to say</Label>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Tax Registration Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Tax Registration</h3>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Tax ID Information</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>For US sellers: You can start with your SSN, but we strongly recommend getting an EIN (it&apos;s free and protects your identity).</li>
                    <li>For international sellers: Please provide your local tax registration number.</li>
                    <li>You can update your tax information later as your business grows.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {form.watch("taxCountry") === "US" && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Getting an EIN is Easy!</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>You can get an EIN for free in about 15 minutes:</p>
                    <ol className="list-decimal pl-5 space-y-1 mt-1">
                      <li>Visit the <a href="https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online" target="_blank" rel="noopener noreferrer" className="underline">IRS EIN Assistant</a></li>
                      <li>Complete the online application</li>
                      <li>Receive your EIN immediately</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-y-2">
              <Label>Business Name (for tax purposes)</Label>
              <Input
                placeholder="Legal business name"
                {...form.register("businessName")}
                disabled={isPending}
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <Label>Tax ID / VAT Number</Label>
              <Input
                placeholder={form.watch("taxCountry") === "US" ? "EIN (XX-XXXXXXX) or SSN (XXX-XX-XXXX)" : "Your tax registration number"}
                {...form.register("taxId")}
                disabled={isPending}
              />
              {form.formState.errors.taxId?.message && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.taxId.message}
                </p>
              )}
              {form.watch("taxCountry") === "US" && /^\d{3}-\d{2}-\d{4}$/.test(form.watch("taxId")) && (
                <p className="text-sm text-yellow-600">
                  While SSN is accepted, we strongly recommend using an EIN for better security and business separation. You can get an EIN for free from the IRS.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {form.watch("taxCountry") === "US" && "Format: EIN (XX-XXXXXXX) or SSN (XXX-XX-XXXX)"}
                {form.watch("taxCountry") === "CA" && "Format: XXXXXXXXXRT0001 (Business Number)"}
                {form.watch("taxCountry") === "GB" && "Format: GBXXXXXXXXX (VAT Number)"}
                {getCountryByCode(form.watch("taxCountry"))?.isEU && "Format: XX999999999 (VAT Number)"}
                {form.watch("taxCountry") === "AU" && "Format: 11 digits (ABN)"}
                {form.watch("taxCountry") === "JP" && "Format: 13 digits (Corporate Number)"}
                {form.watch("taxCountry") === "IN" && "Format: 15 digits (GSTIN)"}
                {form.watch("taxCountry") === "SG" && "Format: 8 digits + 1 letter (UEN)"}
              </p>
            </div>

            <div className="flex flex-col gap-y-2">
              <Label>Business Address</Label>
              <Input
                placeholder="Street address"
                {...form.register("businessAddress")}
                disabled={isPending}
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <Label>City</Label>
              <Input
                placeholder="City"
                {...form.register("businessCity")}
                disabled={isPending}
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <Label>State/Province</Label>
              <Input
                placeholder="State or province"
                {...form.register("businessState")}
                disabled={isPending}
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <Label>Postal Code</Label>
              <Input
                placeholder="Postal code"
                {...form.register("businessPostalCode")}
                disabled={isPending}
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <Label>Country of Tax Registration</Label>
              <Select
                onValueChange={(value: TaxCountry) => form.setValue("taxCountry", value)}
                defaultValue={form.watch("taxCountry")}
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
          </div>

          <div className="flex flex-col gap-y-2">
            <Label>Additional Tax Registrations</Label>
            <p className="text-sm text-muted-foreground">
              If you are registered for tax in other countries, please list them below:
            </p>
            <Textarea
              placeholder="List any additional tax registrations (e.g., 'VAT registered in Germany: DE123456789')"
              {...form.register("additionalTaxRegistrations")}
              disabled={isPending}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Submitbutton title="Save" isPending={isPending} />
      </CardFooter>
    </form>
  );
};

export default SellerForm;
