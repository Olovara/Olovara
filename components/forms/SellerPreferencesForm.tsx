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
import { SellerPreferencesSchema } from "@/schemas/SellerPreferencesSchema";
import { updateSellerPreferences, getSellerPreferences } from "@/actions/sellerPreferencesActions";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SUPPORTED_CURRENCIES,
  SUPPORTED_WEIGHT_UNITS,
  SUPPORTED_DIMENSION_UNITS,
  SUPPORTED_DISTANCE_UNITS
} from "@/data/units";
import { shopValues, ShopValueId, validShopValueIds } from "@/data/shop-values";

const SellerPreferencesForm = () => {
  const isClient = useIsClient();
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isPending, setIsPending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<z.infer<typeof SellerPreferencesSchema>>({
    resolver: zodResolver(SellerPreferencesSchema),
    defaultValues: {
      preferredCurrency: "USD",
      preferredWeightUnit: "lbs",
      preferredDimensionUnit: "in",
      preferredDistanceUnit: "miles",
      shopValues: [],
      valuesPreferNotToSay: false,
    },
  });

  // Watch the prefer not to say checkbox
  const preferNotToSay = form.watch("valuesPreferNotToSay");

  // Handle prefer not to say checkbox change
  const handlePreferNotToSayChange = (checked: boolean) => {
    if (checked) {
      // Clear all shop values when prefer not to say is checked
      form.setValue("shopValues", []);
    }
    form.setValue("valuesPreferNotToSay", checked);
  };

  // Handle shop value checkbox change
  const handleShopValueChange = (valueId: ShopValueId, checked: boolean) => {
    const currentValues = form.watch("shopValues") || [];
    if (checked) {
      // Add value if not already present
      if (!currentValues.includes(valueId)) {
        form.setValue("shopValues", [...currentValues, valueId]);
      }
    } else {
      // Remove value
      form.setValue("shopValues", currentValues.filter(v => v !== valueId));
    }
  };

  useEffect(() => {
    const fetchSellerPreferences = async () => {
      try {
        const result = await getSellerPreferences();
        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          // Ensure shopValues is an array and filter to only valid ShopValueId values
          const formattedData = {
            ...result.data,
            shopValues: Array.isArray(result.data.shopValues)
              ? result.data.shopValues.filter((v): v is ShopValueId =>
                validShopValueIds.includes(v as ShopValueId)
              )
              : [], // Fallback to empty array if not present
            valuesPreferNotToSay: Boolean(result.data.valuesPreferNotToSay),
          };
          form.reset(formattedData);
        }
      } catch (error) {
        setError("Failed to load preferences");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSellerPreferences();
  }, [form]);

  const onSubmit = async (values: z.infer<typeof SellerPreferencesSchema>) => {
    try {
      setIsPending(true);
      setError("");
      setSuccess("");

      const result = await updateSellerPreferences(values);

      if (result.error) {
        toast.error(result.error);
        throw new Error(result.error);
      }

      toast.success(result.message || "Successfully saved your preferences.");
    } catch (error) {
      console.error("Error submitting form:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save preferences";
      toast.error(errorMessage);
    } finally {
      setIsPending(false);
    }
  };

  if (!isClient || isLoading) return <Spinner />;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>
          Set your preferred units and shop values
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-6">

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
                onValueChange={(value) => form.setValue("preferredCurrency", value)}
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
                onValueChange={(value) => form.setValue("preferredWeightUnit", value)}
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
                onValueChange={(value) => form.setValue("preferredDimensionUnit", value)}
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
                onValueChange={(value) => form.setValue("preferredDistanceUnit", value)}
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

        {/* Shop Values Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Shop Values</h3>
          <p className="text-sm text-muted-foreground">
            Let customers know what makes your shop special. This helps
            customers find and support businesses that align with their values.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shopValues.map((value) => {
              const currentValues = form.watch("shopValues") || [];
              const isChecked = currentValues.includes(value.id);
              return (
                <div key={value.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={value.id}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      handleShopValueChange(value.id, Boolean(checked));
                    }}
                    disabled={isPending || preferNotToSay}
                    className={preferNotToSay ? "opacity-50" : ""}
                  />
                  <Label htmlFor={value.id} className={preferNotToSay ? "opacity-50" : ""}>
                    {value.name}
                  </Label>
                </div>
              );
            })}
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

        <Submitbutton title="Save Preferences" isPending={isPending} />
      </CardContent>
    </form>
  );
};

export default SellerPreferencesForm; 