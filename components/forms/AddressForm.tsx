"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { encryptData } from "@/lib/encryption";
import { getOnboardingCountriesByZone } from "@/data/countries";

const addressSchema = z.object({
  street1: z.string().min(1, "Street address is required"),
  street2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  isDefault: z.boolean().default(true),
  isBusinessAddress: z.boolean().default(false),
});

type AddressFormValues = z.infer<typeof addressSchema>;

interface AddressFormProps {
  type: "seller" | "member";
  onSuccess?: () => void;
  initialData?: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    isDefault?: boolean;
    isBusinessAddress?: boolean;
  };
}

export default function AddressForm({ type, onSuccess, initialData }: AddressFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(initialData?.country || "");
  const countryGroups = getOnboardingCountriesByZone();

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street1: initialData?.street1 || "",
      street2: initialData?.street2 || "",
      city: initialData?.city || "",
      state: initialData?.state || "",
      postalCode: initialData?.postalCode || "",
      country: initialData?.country || "",
      isDefault: initialData?.isDefault ?? true,
      isBusinessAddress: initialData?.isBusinessAddress ?? false,
    },
  });

  // Watch the country field to update the selectedCountry state
  const country = form.watch("country");
  useEffect(() => {
    setSelectedCountry(country);
  }, [country]);

  // Helper function to check if a country uses states/provinces
  const countryUsesStates = (countryCode: string) => {
    const countriesWithStates = ["US", "CA", "AU", "IN", "BR", "MX"];
    return countriesWithStates.includes(countryCode);
  };

  // Helper function to get state/province label based on country
  const getStateLabel = (countryCode: string) => {
    const labels: { [key: string]: string } = {
      US: "State",
      CA: "Province",
      AU: "State/Territory",
      IN: "State/Union Territory",
      BR: "State",
      MX: "State",
    };
    return labels[countryCode] || "State/Province";
  };

  const onSubmit = async (data: AddressFormValues) => {
    try {
      setLoading(true);

      // Encrypt address data
      const encryptedData = {
        encryptedStreet: encryptData(data.street1).encrypted,
        streetIV: encryptData(data.street1).iv,
        streetSalt: encryptData(data.street1).salt,
        encryptedStreet2: data.street2 ? encryptData(data.street2).encrypted : null,
        street2IV: data.street2 ? encryptData(data.street2).iv : null,
        street2Salt: data.street2 ? encryptData(data.street2).salt : null,
        encryptedCity: encryptData(data.city).encrypted,
        cityIV: encryptData(data.city).iv,
        citySalt: encryptData(data.city).salt,
        encryptedState: data.state ? encryptData(data.state).encrypted : null,
        stateIV: data.state ? encryptData(data.state).iv : null,
        stateSalt: data.state ? encryptData(data.state).salt : null,
        encryptedPostal: encryptData(data.postalCode).encrypted,
        postalIV: encryptData(data.postalCode).iv,
        postalSalt: encryptData(data.postalCode).salt,
        encryptedCountry: encryptData(data.country).encrypted,
        countryIV: encryptData(data.country).iv,
        countrySalt: encryptData(data.country).salt,
        isDefault: data.isDefault,
        isBusinessAddress: data.isBusinessAddress,
      };

      const response = await fetch(`/api/${type}/address`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(encryptedData),
      });

      if (!response.ok) {
        throw new Error("Failed to save address");
      }

      // If this is a business address, update the tax information
      if (data.isBusinessAddress) {
        const taxResponse = await fetch('/api/seller/tax-info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            businessAddress: data.street1,
            businessCity: data.city,
            businessState: data.state,
            businessPostalCode: data.postalCode,
            taxCountry: data.country,
          }),
        });

        if (!taxResponse.ok) {
          console.error('Failed to update tax information');
        }
      }

      toast.success("Address saved successfully");
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error("Failed to save address");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="street1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street Address</FormLabel>
              <FormControl>
                <Input placeholder="Enter street address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="street2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Apartment, suite, etc. (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Enter apartment, suite, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="Enter city" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {countryUsesStates(selectedCountry) && (
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{getStateLabel(selectedCountry)}</FormLabel>
                  <FormControl>
                    <Input placeholder={`Enter ${getStateLabel(selectedCountry).toLowerCase()}`} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="postalCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {selectedCountry === "GB" ? "Postcode" : 
                   selectedCountry === "IN" ? "PIN Code" : 
                   "Postal Code"}
                </FormLabel>
                <FormControl>
                  <Input placeholder="Enter postal code" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Clear state when country changes
                    if (!countryUsesStates(value)) {
                      form.setValue("state", "");
                    }
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                  </FormControl>
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
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {type === "seller" && (
          <div className="flex items-center space-x-4">
            <FormField
              control={form.control}
              name="isBusinessAddress"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </FormControl>
                  <FormLabel className="text-sm">This is a business address</FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </FormControl>
                  <FormLabel className="text-sm">Set as default address</FormLabel>
                </FormItem>
              )}
            />
          </div>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Address"}
        </Button>
      </form>
    </Form>
  );
} 