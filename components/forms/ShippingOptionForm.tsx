"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  ShippingOptionSchema,
  type ShippingOptionFormValues,
} from "@/schemas/ShippingOptionSchema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_CURRENCIES, getCurrencyDecimals } from "@/data/units";
import { SHIPPING_ZONES } from "@/data/shipping";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { getCountryByCode, SUPPORTED_COUNTRIES } from "@/data/countries";
import {
  getAvailableZones,
  getAvailableCountries,
} from "@/lib/filter-shipping-options";

interface ShippingRate {
  id: string;
  type: "zone" | "country";
  zone?: string;
  countryCode?: string;
  price: number;
  additionalItem: number | null;
  isFreeShipping: boolean;
}

interface ShippingOption {
  id: string;
  name: string;
  isDefault: boolean;
  countryOfOrigin: string;
  defaultShipping?: number | null; // In cents
  defaultShippingCurrency?: string;
  rates: ShippingRate[];
}

interface ShippingOptionFormProps {
  initialData?: ShippingOption;
  onSuccess?: (shippingOptionId?: string) => void;
}

export default function ShippingOptionForm({
  initialData,
  onSuccess,
}: ShippingOptionFormProps) {
  const router = useRouter();
  const [sellerCountry, setSellerCountry] = useState<string>("");
  const [sellerCurrency, setSellerCurrency] = useState<string>("USD");
  const [excludedCountries, setExcludedCountries] = useState<string[]>([]);

  // Fetch seller's country, currency, and exclusions when component mounts
  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        // Fetch country
        const countryResponse = await fetch("/api/seller/country");
        if (countryResponse.ok) {
          const countryData = await countryResponse.json();
          setSellerCountry(countryData.country);
        }

        // Fetch preferred currency
        const currencyResponse = await fetch("/api/seller/currency");
        if (currencyResponse.ok) {
          const currencyData = await currencyResponse.json();
          setSellerCurrency(currencyData.currency || "USD");
        }

        // Fetch excluded countries
        const exclusionsResponse = await fetch("/api/seller/exclusions");
        if (exclusionsResponse.ok) {
          const exclusionsData = await exclusionsResponse.json();
          setExcludedCountries(exclusionsData.excludedCountries || []);
        }
      } catch (error) {
        console.error("Error fetching seller data:", error);
        toast.error("Failed to fetch seller data");
      }
    };

    void fetchSellerData();
  }, []);

  const form = useForm<ShippingOptionFormValues>({
    resolver: zodResolver(ShippingOptionSchema),
    defaultValues: {
      name: initialData?.name || "",
      isDefault: initialData?.isDefault || false,
      countryOfOrigin: initialData?.countryOfOrigin || sellerCountry,
      defaultShipping:
        initialData?.defaultShipping !== null &&
        initialData?.defaultShipping !== undefined
          ? (() => {
              // Convert from cents to display value based on currency decimals
              const currency = initialData?.defaultShippingCurrency || "USD";
              const decimals = getCurrencyDecimals(currency);
              const divisor = Math.pow(10, decimals);
              return initialData.defaultShipping / divisor;
            })()
          : null,
      defaultShippingCurrency:
        initialData?.defaultShippingCurrency || sellerCurrency,
      rates:
        initialData?.rates.map((rate) => ({
          id: rate.id,
          type: rate.type || (rate.countryCode ? "country" : "zone"), // Use type if available, otherwise determine from countryCode
          zone: rate.zone || undefined,
          countryCode: rate.countryCode || undefined,
          price: rate.price / 100, // Convert cents to dollars for display
          additionalItem: rate.additionalItem
            ? rate.additionalItem / 100
            : null,
          isFreeShipping: rate.isFreeShipping,
        })) || [],
    },
  });

  // Update countryOfOrigin and defaultShippingCurrency when seller data is fetched
  useEffect(() => {
    if (sellerCountry && !initialData) {
      form.setValue("countryOfOrigin", sellerCountry);
    }
    if (sellerCurrency && !initialData?.defaultShippingCurrency) {
      form.setValue("defaultShippingCurrency", sellerCurrency);
    }
  }, [sellerCountry, sellerCurrency, form, initialData]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rates",
  });

  async function onSubmit(values: ShippingOptionFormValues) {
    try {
      // Use the correct endpoint based on whether we're creating or editing
      const url = initialData
        ? `/api/shipping-options/${initialData.id}`
        : "/api/shipping-options";
      const method = initialData ? "PUT" : "POST";

      // Convert defaultShipping to cents based on currency decimals
      const defaultShippingCurrency = values.defaultShippingCurrency || "USD";
      const decimals = getCurrencyDecimals(defaultShippingCurrency);
      const multiplier = Math.pow(10, decimals);
      const defaultShippingInCents =
        values.defaultShipping !== null && values.defaultShipping !== undefined
          ? Math.round(values.defaultShipping * multiplier)
          : null;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          defaultShipping: defaultShippingInCents,
          rates: values.rates.map((rate) => ({
            type: rate.type,
            zone: rate.type === "zone" ? rate.zone : undefined,
            countryCode: rate.type === "country" ? rate.countryCode : undefined,
            price: Math.round(rate.price * 100), // Convert to cents
            currency: defaultShippingCurrency, // Use shipping option's currency
            additionalItem: rate.additionalItem
              ? Math.round(rate.additionalItem * 100)
              : null,
            isFreeShipping: rate.isFreeShipping,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save shipping option");
      }

      const result = await response.json();
      const shippingOptionId = result.shippingOption?.id || result.id;

      toast.success(
        initialData
          ? "Shipping option updated successfully"
          : "Shipping option created successfully"
      );

      // Call onSuccess callback with the shipping option ID to refresh shipping options TODO: The same modification here as seller form
      // This preserves all form data the seller has entered
      // Pass the ID so the parent can auto-select it if needed
      onSuccess?.(shippingOptionId);

      // Only refresh router for updates, not for new creations
      if (initialData) {
        router.refresh();
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Option Name</FormLabel>
              <FormControl>
                <Input placeholder="Standard Shipping" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="countryOfOrigin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country of Origin</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  disabled
                  value={getCountryByCode(field.value)?.name || field.value}
                />
              </FormControl>
              <p className="text-sm text-muted-foreground">
                This is set to your business address country and cannot be
                changed
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="defaultShippingCurrency"
              render={({ field }) => {
                const currencyInfo =
                  SUPPORTED_CURRENCIES.find((c) => c.code === field.value) ||
                  SUPPORTED_CURRENCIES[0];
                return (
                  <FormItem>
                    <FormLabel>Shipping Currency</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SUPPORTED_CURRENCIES.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.code} - {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="defaultShipping"
              render={({ field }) => {
                const defaultShippingCurrency = form.watch(
                  "defaultShippingCurrency"
                );
                const currencyInfo =
                  SUPPORTED_CURRENCIES.find(
                    (c) => c.code === defaultShippingCurrency
                  ) || SUPPORTED_CURRENCIES[0];
                return (
                  <FormItem>
                    <FormLabel>Default Shipping Cost (Worldwide)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          {currencyInfo.symbol}
                        </span>
                        <Input
                          type="number"
                          step={1 / Math.pow(10, currencyInfo.decimals)}
                          min={0}
                          placeholder="0.00"
                          className="pl-8"
                          {...field}
                          value={field.value === null ? "" : field.value}
                          onChange={(e) => {
                            const value =
                              e.target.value === ""
                                ? null
                                : parseFloat(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </div>
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      {currencyInfo.decimals === 0
                        ? "Enter whole numbers only (no decimal places)"
                        : `Enter price with up to ${currencyInfo.decimals} decimal places`}
                    </p>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Exception Rates</h3>
          <p className="text-sm text-muted-foreground">
            Add exception for specific country or region.
          </p>

          {fields.map((field, index) => {
            const rate = form.watch(`rates.${index}`);
            const shippingOptionCurrency = form.watch("defaultShippingCurrency");
            const currencyInfo =
              SUPPORTED_CURRENCIES.find((c) => c.code === shippingOptionCurrency) ||
              SUPPORTED_CURRENCIES[0];

            const rateType = rate.type || "zone";
            const availableZones = getAvailableZones(excludedCountries);
            const availableCountries = getAvailableCountries(excludedCountries);
            const selectedZone = rate.zone
              ? SHIPPING_ZONES.find((z) => z.id === rate.zone)
              : null;
            const selectedCountry = rate.countryCode
              ? getCountryByCode(rate.countryCode)
              : null;

            return (
              <Card key={field.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-medium">
                        {rateType === "zone"
                          ? selectedZone?.name || "Zone"
                          : selectedCountry?.name || "Country"}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {rateType === "zone"
                          ? "Rate for all countries in this region"
                          : "Rate for this specific country"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name={`rates.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              // Clear zone/country when type changes
                              if (value === "zone") {
                                form.setValue(`rates.${index}.countryCode`, undefined);
                                form.setValue(`rates.${index}.zone`, availableZones[0] || "");
                              } else {
                                form.setValue(`rates.${index}.zone`, undefined);
                                form.setValue(`rates.${index}.countryCode`, availableCountries[0] || "");
                              }
                            }}
                            defaultValue={field.value || "zone"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="zone">Zone</SelectItem>
                              <SelectItem value="country">Country</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {rateType === "zone" ? (
                      <FormField
                        control={form.control}
                        name={`rates.${index}.zone`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Zone</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select zone" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {SHIPPING_ZONES.filter((zone) =>
                                  availableZones.includes(zone.id)
                                ).map((zone) => (
                                  <SelectItem key={zone.id} value={zone.id}>
                                    {zone.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <FormField
                        control={form.control}
                        name={`rates.${index}.countryCode`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {SUPPORTED_COUNTRIES.filter((country) =>
                                  availableCountries.includes(country.code)
                                )
                                  .sort((a, b) => a.name.localeCompare(b.name))
                                  .map((country) => (
                                    <SelectItem
                                      key={country.code}
                                      value={country.code}
                                    >
                                      {country.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}


                    <FormField
                      control={form.control}
                      name={`rates.${index}.isFreeShipping`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Free Shipping
                            </FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Offer free shipping
                              {rateType === "zone" ? " for this zone" : " for this country"}
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {!rate.isFreeShipping && (
                      <>
                        <FormField
                          control={form.control}
                          name={`rates.${index}.price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                    {currencyInfo.symbol}
                                  </span>
                                  <Input
                                    type="number"
                                    step={
                                      1 / Math.pow(10, currencyInfo.decimals)
                                    }
                                    min={
                                      1 / Math.pow(10, currencyInfo.decimals)
                                    }
                                    placeholder="0.00"
                                    className="pl-8"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(
                                        parseFloat(e.target.value)
                                      )
                                    }
                                  />
                                </div>
                              </FormControl>
                              <p className="text-sm text-muted-foreground">
                                {currencyInfo.decimals === 0
                                  ? "Enter whole numbers only (no decimal places)"
                                  : `Enter price with up to ${currencyInfo.decimals} decimal places`}
                              </p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`rates.${index}.additionalItem`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Additional Item Cost</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                    {currencyInfo.symbol}
                                  </span>
                                  <Input
                                    type="number"
                                    step={
                                      1 / Math.pow(10, currencyInfo.decimals)
                                    }
                                    min={0}
                                    placeholder="0.00"
                                    className="pl-8"
                                    {...field}
                                    onChange={(e) => {
                                      const value =
                                        e.target.value === ""
                                          ? null
                                          : parseFloat(e.target.value);
                                      field.onChange(value);
                                    }}
                                    value={
                                      field.value === null ? "" : field.value
                                    }
                                  />
                                </div>
                              </FormControl>
                              <p className="text-sm text-muted-foreground">
                                Cost for each additional item in the same order
                              </p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}


                  </div>
                </CardContent>
              </Card>
            );
          })}

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const availableZones = getAvailableZones(excludedCountries);
              append({
                id: crypto.randomUUID(),
                type: "zone",
                zone: availableZones[0] || SHIPPING_ZONES[0].id,
                price: 0,
                additionalItem: null,
                isFreeShipping: false,
              } as any);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Rate
          </Button>
        </div>

        <FormField
          control={form.control}
          name="isDefault"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Default Option</FormLabel>
                <div className="text-sm text-muted-foreground">
                  This will be the default shipping option for your products
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {initialData ? "Update Option" : "Create Option"}
        </Button>
      </form>
    </Form>
  );
}
