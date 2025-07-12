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
      isWomanOwned: false,
      isMinorityOwned: false,
      isLGBTQOwned: false,
      isVeteranOwned: false,
      isSustainable: false,
      isCharitable: false,
      valuesPreferNotToSay: false,
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
    const fetchSellerPreferences = async () => {
      try {
        const result = await getSellerPreferences();
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

        <Submitbutton title="Save Preferences" isPending={isPending} />
      </CardContent>
    </form>
  );
};

export default SellerPreferencesForm; 