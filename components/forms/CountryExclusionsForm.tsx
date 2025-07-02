"use client";

import { Label } from "@/components/ui/label";
import {
  CardContent,
  CardDescription,
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
import { CountryExclusionsSchema } from "@/schemas/CountryExclusionsSchema";
import { updateCountryExclusions, getCountryExclusions } from "@/actions/countryExclusionsActions";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { getOnboardingCountries, getCountryByCode } from "@/data/countries";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const CountryExclusionsForm = () => {
  const isClient = useIsClient();
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isPending, setIsPending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<z.infer<typeof CountryExclusionsSchema>>({
    resolver: zodResolver(CountryExclusionsSchema),
    defaultValues: {
      excludedCountries: [],
    },
  });

  const excludedCountries = form.watch("excludedCountries");
  const availableCountries = getOnboardingCountries();

  useEffect(() => {
    const fetchCountryExclusions = async () => {
      try {
        const result = await getCountryExclusions();
        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          // Type assertion since the database fields will be added later
          const data = result.data as any;
          form.reset({
            excludedCountries: data.excludedCountries || [],
          });
        }
      } catch (error) {
        setError("Failed to load country exclusions");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCountryExclusions();
  }, [form]);

  const onSubmit = async (values: z.infer<typeof CountryExclusionsSchema>) => {
    try {
      setIsPending(true);
      setError("");
      setSuccess("");

      const result = await updateCountryExclusions(values);

      if (result.error) {
        toast.error(result.error);
        throw new Error(result.error);
      }

      toast.success(result.success || "Successfully saved your country exclusions.");
    } catch (error) {
      console.error("Error submitting form:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save country exclusions";
      toast.error(errorMessage);
    } finally {
      setIsPending(false);
    }
  };

  const toggleCountry = (countryCode: string) => {
    const currentExcluded = form.getValues("excludedCountries");
    const isExcluded = currentExcluded.includes(countryCode);
    
    if (isExcluded) {
      form.setValue("excludedCountries", currentExcluded.filter(code => code !== countryCode));
    } else {
      form.setValue("excludedCountries", [...currentExcluded, countryCode]);
    }
  };

  const removeCountry = (countryCode: string) => {
    const currentExcluded = form.getValues("excludedCountries");
    form.setValue("excludedCountries", currentExcluded.filter(code => code !== countryCode));
  };

  if (!isClient || isLoading) return <Spinner />;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <CardHeader>
        <CardTitle>Shipping Restrictions</CardTitle>
        <CardDescription>
          Select countries you don&apos;t want to ship to. This helps prevent orders from countries with high shipping costs or restrictions.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-6">
        
        {/* Excluded Countries Display */}
        {excludedCountries.length > 0 && (
          <div className="space-y-3">
            <Label>Currently Excluded Countries ({excludedCountries.length})</Label>
            <div className="flex flex-wrap gap-2">
              {excludedCountries.map((countryCode) => {
                const country = getCountryByCode(countryCode);
                return (
                  <Badge key={countryCode} variant="destructive" className="flex items-center gap-1">
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

        {/* Country Selection */}
        <div className="space-y-3">
          <Label>Select Countries to Exclude</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto border rounded-md p-4">
            {availableCountries.map((country) => {
              const isExcluded = excludedCountries.includes(country.code);
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
                    {country.name}
                  </Label>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Check the boxes above to exclude countries from your shipping destinations
          </p>
        </div>

        <Submitbutton title="Save Exclusions" isPending={isPending} />
      </CardContent>
    </form>
  );
};

export default CountryExclusionsForm; 