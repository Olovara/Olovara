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
import { SUPPORTED_CURRENCIES } from "@/data/units";
import { SHIPPING_ZONES } from "@/data/shipping";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { getCountryByCode, SUPPORTED_COUNTRIES } from "@/data/countries";

interface CountryRate {
  countryCode: string;
  price: number;
  currency: string;
}

interface ShippingRate {
  id: string;
  zone: string;
  price: number;
  currency: string;
  estimatedDays: number;
  additionalItem: number | null;
  isFreeShipping: boolean;
  countryRates: CountryRate[];
}

interface ShippingOption {
  id: string;
  name: string;
  isDefault: boolean;
  countryOfOrigin: string;
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

  // Fetch seller's country when component mounts
  useEffect(() => {
    const fetchSellerCountry = async () => {
      try {
        const response = await fetch("/api/seller/country");
        if (!response.ok) throw new Error("Failed to fetch seller country");
        const data = await response.json();
        setSellerCountry(data.country);
      } catch (error) {
        console.error("Error fetching seller country:", error);
        toast.error("Failed to fetch seller country");
      }
    };

    void fetchSellerCountry();
  }, []);

  const form = useForm<ShippingOptionFormValues>({
    resolver: zodResolver(ShippingOptionSchema),
    defaultValues: {
      name: initialData?.name || "",
      isDefault: initialData?.isDefault || false,
      countryOfOrigin: initialData?.countryOfOrigin || sellerCountry,
      rates:
        initialData?.rates.map((rate) => ({
          ...rate,
          price: rate.price / 100, // Convert cents to dollars for display
          additionalItem: rate.additionalItem
            ? rate.additionalItem / 100
            : null,
          countryRates: (rate.countryRates || []).map((countryRate: any) => ({
            ...countryRate,
            price: countryRate.price / 100, // Convert cents to dollars for display
          })),
        })) || [],
    },
  });

  // Update countryOfOrigin when sellerCountry is fetched
  useEffect(() => {
    if (sellerCountry && !initialData) {
      form.setValue("countryOfOrigin", sellerCountry);
    }
  }, [sellerCountry, form, initialData]);

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

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          rates: values.rates.map((rate) => ({
            ...rate,
            price: Math.round(rate.price * 100), // Convert to cents
            additionalItem: rate.additionalItem
              ? Math.round(rate.additionalItem * 100)
              : null,
            countryRates: rate.countryRates.map((countryRate) => ({
              ...countryRate,
              price: Math.round(countryRate.price * 100), // Convert to cents
            })),
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
          <h3 className="text-lg font-medium">Shipping Rates</h3>

          {fields.map((field, index) => {
            const rate = form.watch(`rates.${index}`);
            const currencyInfo =
              SUPPORTED_CURRENCIES.find((c) => c.code === rate.currency) ||
              SUPPORTED_CURRENCIES[0];

            return (
              <Card key={field.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-medium">
                        {SHIPPING_ZONES.find((z) => z.id === rate.zone)?.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Zone rate for all countries in this region
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
                              {SHIPPING_ZONES.map((zone) => (
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

                    <FormField
                      control={form.control}
                      name={`rates.${index}.isInternational`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              International Shipping
                            </FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Enable this if this rate applies to international
                              shipping within this zone
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
                              Offer free shipping for this zone
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
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`rates.${index}.currency`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Currency</FormLabel>
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
                                      <SelectItem
                                        key={currency.code}
                                        value={currency.code}
                                      >
                                        {currency.code} - {currency.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

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
                        </div>

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

                    <FormField
                      control={form.control}
                      name={`rates.${index}.estimatedDays`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Delivery Time</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={90}
                              placeholder="1-90 days"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                            />
                          </FormControl>
                          <p className="text-sm text-muted-foreground">
                            Estimated number of days for delivery
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Country-Specific Rates Section */}
                    <div className="space-y-4 border-t pt-4">
                      <div className="flex justify-between items-center">
                        <h5 className="font-medium text-sm">
                          Country-Specific Rates
                        </h5>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const currentCountryRates =
                              form.getValues(`rates.${index}.countryRates`) ||
                              [];
                            form.setValue(`rates.${index}.countryRates`, [
                              ...currentCountryRates,
                              {
                                countryCode: "",
                                price: 0,
                                currency: rate.currency, // Default to the zone's currency (seller's preferred)
                              },
                            ]);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Country Rate
                        </Button>
                      </div>

                      {rate.countryRates && rate.countryRates.length > 0 && (
                        <div className="space-y-3">
                          {rate.countryRates.map(
                            (countryRate, countryIndex) => (
                              <div
                                key={countryIndex}
                                className="flex gap-3 items-end p-3 border rounded-lg bg-muted/30"
                              >
                                <div className="flex-1">
                                  <FormField
                                    control={form.control}
                                    name={`rates.${index}.countryRates.${countryIndex}.countryCode`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-xs">
                                          Country
                                        </FormLabel>
                                        <Select
                                          onValueChange={field.onChange}
                                          value={field.value}
                                        >
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select country" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            {SUPPORTED_COUNTRIES.filter(
                                              (country) =>
                                                country.zone === rate.zone
                                            )
                                              .filter(
                                                (country) =>
                                                  !rate.countryRates?.some(
                                                    (cr) =>
                                                      cr.countryCode ===
                                                        country.code &&
                                                      rate.countryRates.indexOf(
                                                        cr
                                                      ) !== countryIndex
                                                  )
                                              )
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
                                </div>

                                <div className="flex-1">
                                  <FormField
                                    control={form.control}
                                    name={`rates.${index}.countryRates.${countryIndex}.price`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-xs">
                                          Price
                                        </FormLabel>
                                        <FormControl>
                                          <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                                              {SUPPORTED_CURRENCIES.find(
                                                (c) =>
                                                  c.code ===
                                                  rate.countryRates[
                                                    countryIndex
                                                  ]?.currency
                                              )?.symbol || "$"}
                                            </span>
                                            <Input
                                              type="number"
                                              step={
                                                1 /
                                                Math.pow(
                                                  10,
                                                  currencyInfo.decimals
                                                )
                                              }
                                              min={
                                                1 /
                                                Math.pow(
                                                  10,
                                                  currencyInfo.decimals
                                                )
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
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                <div className="flex-1">
                                  <FormField
                                    control={form.control}
                                    name={`rates.${index}.countryRates.${countryIndex}.currency`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-xs">
                                          Currency
                                        </FormLabel>
                                        <Select
                                          onValueChange={field.onChange}
                                          value={field.value}
                                        >
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Currency" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            {SUPPORTED_CURRENCIES.map(
                                              (currency) => (
                                                <SelectItem
                                                  key={currency.code}
                                                  value={currency.code}
                                                >
                                                  {currency.code}
                                                </SelectItem>
                                              )
                                            )}
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const currentCountryRates =
                                      form.getValues(
                                        `rates.${index}.countryRates`
                                      ) || [];
                                    const newCountryRates =
                                      currentCountryRates.filter(
                                        (_, i) => i !== countryIndex
                                      );
                                    form.setValue(
                                      `rates.${index}.countryRates`,
                                      newCountryRates
                                    );
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )
                          )}
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        Add specific rates for countries that need different
                        pricing (e.g., higher tariffs). Countries without
                        specific rates will use the zone rate above.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              append({
                id: crypto.randomUUID(),
                zone: SHIPPING_ZONES[0].id,
                isInternational: false,
                price: 0,
                currency: "USD",
                estimatedDays: 1,
                additionalItem: null,
                isFreeShipping: false,
                countryRates: [],
              })
            }
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
