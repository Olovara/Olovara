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

const COUNTRY_OPTIONS = [
  {
    region: "North America",
    countries: [
      { code: "US", name: "United States" },
      { code: "CA", name: "Canada" },
      { code: "MX", name: "Mexico" },
    ],
  },
  {
    region: "Europe",
    countries: [
      { code: "GB", name: "United Kingdom" },
      { code: "DE", name: "Germany" },
      { code: "FR", name: "France" },
      { code: "IT", name: "Italy" },
      { code: "ES", name: "Spain" },
      { code: "NL", name: "Netherlands" },
      { code: "BE", name: "Belgium" },
      { code: "SE", name: "Sweden" },
      { code: "CH", name: "Switzerland" },
      { code: "AT", name: "Austria" },
      { code: "DK", name: "Denmark" },
      { code: "NO", name: "Norway" },
      { code: "FI", name: "Finland" },
      { code: "IE", name: "Ireland" },
      { code: "PT", name: "Portugal" },
    ],
  },
  {
    region: "Asia Pacific",
    countries: [
      { code: "JP", name: "Japan" },
      { code: "CN", name: "China" },
      { code: "KR", name: "South Korea" },
      { code: "AU", name: "Australia" },
      { code: "NZ", name: "New Zealand" },
      { code: "SG", name: "Singapore" },
      { code: "HK", name: "Hong Kong" },
      { code: "TW", name: "Taiwan" },
      { code: "IN", name: "India" },
      { code: "ID", name: "Indonesia" },
      { code: "MY", name: "Malaysia" },
      { code: "TH", name: "Thailand" },
      { code: "VN", name: "Vietnam" },
      { code: "PH", name: "Philippines" },
    ],
  },
  {
    region: "South America",
    countries: [
      { code: "BR", name: "Brazil" },
      { code: "AR", name: "Argentina" },
      { code: "CL", name: "Chile" },
      { code: "CO", name: "Colombia" },
      { code: "PE", name: "Peru" },
    ],
  },
  {
    region: "Middle East & Africa",
    countries: [
      { code: "AE", name: "United Arab Emirates" },
      { code: "SA", name: "Saudi Arabia" },
      { code: "IL", name: "Israel" },
      { code: "ZA", name: "South Africa" },
      { code: "EG", name: "Egypt" },
    ],
  },
];

export default function AddressForm({ type, onSuccess, initialData }: AddressFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(initialData?.country || "");

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
        encryptedStreet: encryptData(data.street1),
        encryptedStreet2: data.street2 ? encryptData(data.street2) : null,
        encryptedCity: encryptData(data.city),
        encryptedState: data.state ? encryptData(data.state) : null,
        encryptedPostal: encryptData(data.postalCode),
        encryptedCountry: encryptData(data.country),
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
                    {COUNTRY_OPTIONS.map((group) => (
                      <div key={group.region}>
                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                          {group.region}
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