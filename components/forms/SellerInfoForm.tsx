"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { SellerInfoSchema } from "@/schemas/SellerInfoSchema";
import { updateSellerInfo, getSellerInfo } from "@/actions/sellerInfoActions";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getOnboardingCountriesByZone } from "@/data/countries";
import { StateSelect } from "@/components/ui/state-select";
import { AnimatePresence, motion } from "framer-motion";
import {
  getCurrencyName,
  isZeroDecimalCurrency,
  majorToMinorAmount,
} from "@/data/units";
import Link from "next/link";

const SellerInfoForm = () => {
  const isClient = useIsClient();
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isPending, setIsPending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<z.infer<typeof SellerInfoSchema>>({
    resolver: zodResolver(SellerInfoSchema),
    defaultValues: {
      isVacationMode: false,
      acceptsCustom: false,
      preferredCurrency: "USD",
      customOrderMinBudgetInput: "",
      customOrderMaxOpenOrdersInput: "",
      shopCountry: "US",
      shopState: "",
      shopCity: "",
      facebookUrl: "",
      instagramUrl: "",
      pinterestUrl: "",
      tiktokUrl: "",
    },
  });

  useEffect(() => {
    const fetchSellerInfo = async () => {
      try {
        const result = await getSellerInfo();
        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          // Convert nulls to empty strings for form compatibility
          const safeData = Object.fromEntries(
            Object.entries(result.data).map(([k, v]) => [k, v ?? ""]),
          );
          form.reset(safeData);
        }
      } catch (error) {
        setError("Failed to load location information");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSellerInfo();
  }, [form]);

  const onSubmit = async (values: z.infer<typeof SellerInfoSchema>) => {
    try {
      setIsPending(true);
      setError("");
      setSuccess("");

      // Send data to the action
      const cur = values.preferredCurrency || "USD";
      const budgetRaw = values.customOrderMinBudgetInput?.trim() ?? "";
      const customOrderMinBudgetMinor =
        values.acceptsCustom && budgetRaw !== ""
          ? majorToMinorAmount(parseFloat(budgetRaw.replace(",", ".")), cur)
          : null;

      const capRaw = values.customOrderMaxOpenOrdersInput?.trim() ?? "";
      const customOrderMaxOpenOrders =
        values.acceptsCustom && capRaw !== ""
          ? Number.parseInt(capRaw, 10)
          : null;

      const result = await updateSellerInfo({
        shopCountry: values.shopCountry,
        shopState: values.shopState,
        shopCity: values.shopCity,
        acceptsCustom: values.acceptsCustom,
        customOrderMinBudgetMinor,
        customOrderMaxOpenOrders,
      });

      if (result.error) {
        toast.error(result.error);
        throw new Error(result.error);
      }

      toast.success(
        result.message || "Successfully saved your location information.",
      );
    } catch (error) {
      console.error("Error submitting form:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to save business information";
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
        <CardTitle>Shop Information</CardTitle>
        <CardDescription>
          Manage your shop status, location, and social media links
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-6">
        {/* Shop Status Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Shop Status</h3>

          {/* Vacation Mode */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Vacation Mode</Label>
              <div className="text-sm text-muted-foreground">
                When enabled, your shop will be temporarily closed and customers
                won&apos;t be able to place orders
              </div>
            </div>
            <Switch
              checked={form.watch("isVacationMode")}
              onCheckedChange={(checked) =>
                form.setValue("isVacationMode", checked)
              }
              disabled={isPending}
            />
          </div>

          {/* Custom Orders */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Accept Custom Orders</Label>
              <div className="text-sm text-muted-foreground">
                Allow customers to request custom orders through a form you
                create. You&apos;ll be able to design your own form to collect
                the information you need.
              </div>
            </div>
            <Switch
              checked={form.watch("acceptsCustom")}
              onCheckedChange={(checked) =>
                form.setValue("acceptsCustom", checked)
              }
              disabled={isPending}
            />
          </div>

          <AnimatePresence initial={false}>
            {form.watch("acceptsCustom") && (
              <motion.div
                key="custom-order-min-budget"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="overflow-hidden rounded-lg border border-border bg-muted/40"
              >
                <div className="space-y-3 p-4">
                  <div>
                    <Label
                      htmlFor="customOrderMinBudgetInput"
                      className="text-base"
                    >
                      Minimum budget (optional)
                    </Label>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Only requests at or above this amount match what you want
                      to take on. Amounts use your shop&apos;s preferred
                      currency (
                      <span className="font-medium">
                        {getCurrencyName(form.watch("preferredCurrency"))} (
                        {form.watch("preferredCurrency")})
                      </span>
                      ). Change currency in{" "}
                      <Link
                        href="/seller/dashboard/settings#preferences"
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        Settings → Preferences
                      </Link>
                      .
                    </p>
                  </div>
                  <div className="flex flex-col gap-y-2 sm:max-w-xs">
                    <Input
                      id="customOrderMinBudgetInput"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={
                        isZeroDecimalCurrency(
                          form.watch("preferredCurrency")
                        )
                          ? 1
                          : "0.01"
                      }
                      placeholder="e.g. 50"
                      disabled={isPending}
                      {...form.register("customOrderMinBudgetInput")}
                    />
                    {form.formState.errors.customOrderMinBudgetInput && (
                      <p className="text-sm text-destructive">
                        {
                          form.formState.errors.customOrderMinBudgetInput
                            .message
                        }
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Leave empty if you don&apos;t want a minimum.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {form.watch("acceptsCustom") && (
              <motion.div
                key="custom-order-max-open"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="overflow-hidden rounded-lg border border-border bg-muted/40"
              >
                <div className="space-y-3 p-4">
                  <div>
                    <Label
                      htmlFor="customOrderMaxOpenOrdersInput"
                      className="text-base"
                    >
                      Max open custom orders (optional)
                    </Label>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Limit how many custom-order requests you can have active at
                      once. When you&apos;re at capacity, buyers won&apos;t be able
                      to submit new requests until you complete or reject one.
                    </p>
                  </div>
                  <div className="flex flex-col gap-y-2 sm:max-w-xs">
                    <Input
                      id="customOrderMaxOpenOrdersInput"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      placeholder="e.g. 5"
                      disabled={isPending}
                      {...form.register("customOrderMaxOpenOrdersInput")}
                    />
                    {form.formState.errors.customOrderMaxOpenOrdersInput && (
                      <p className="text-sm text-destructive">
                        {
                          form.formState.errors.customOrderMaxOpenOrdersInput
                            .message
                        }
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Leave empty for unlimited.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {form.watch("acceptsCustom") && (
            <div className="bg-brand-primary-50 border-l-4 border-brand-primary-700 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-brand-primary-700"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-brand-primary-900">
                    Custom Orders Enabled
                  </h3>
                  <div className="mt-2 text-sm text-brand-primary-800">
                    <p>
                      Great! Now you can create a custom order form in your
                      dashboard. This will help you collect all the information
                      you need from customers without back-and-forth messages.
                    </p>
                    <p className="mt-2">
                      You can also add a portfolio gallery to show your style
                      and boost conversions.
                    </p>
                    <p className="mt-2">
                      <a
                        href="/seller/dashboard/custom-orders"
                        className="font-medium underline"
                      >
                        Go to Custom Orders →
                      </a>
                    </p>
                    <p className="mt-2">
                      <a
                        href="/seller/dashboard/portfolio"
                        className="font-medium underline"
                      >
                        Go to Portfolio →
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Location Information Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Location Information</h3>
          <p className="text-sm text-muted-foreground">
            Help customers find your shop by providing your location
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-y-2">
              <Label>Country *</Label>
              <Select
                onValueChange={(value) => form.setValue("shopCountry", value)}
                defaultValue={form.watch("shopCountry")}
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
              <Label>State/Province</Label>
              <StateSelect
                countryCode={form.watch("shopCountry")}
                value={form.watch("shopState")}
                onValueChange={(value) => form.setValue("shopState", value)}
                placeholder="Select state or province"
                disabled={isPending}
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <Label>City/Town</Label>
              <Input
                placeholder="City or town"
                {...form.register("shopCity")}
                disabled={isPending}
              />
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Social Media Links Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Social Media Links</h3>
          <p className="text-sm text-muted-foreground">
            Connect your social media accounts to help customers find and follow
            your shop
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-y-2">
              <Label>Facebook</Label>
              <Input
                placeholder="https://facebook.com/yourpage"
                {...form.register("facebookUrl")}
                disabled={isPending}
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <Label>Instagram</Label>
              <Input
                placeholder="https://instagram.com/yourhandle"
                {...form.register("instagramUrl")}
                disabled={isPending}
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <Label>Pinterest</Label>
              <Input
                placeholder="https://pinterest.com/yourprofile"
                {...form.register("pinterestUrl")}
                disabled={isPending}
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <Label>TikTok</Label>
              <Input
                placeholder="https://tiktok.com/@yourhandle"
                {...form.register("tiktokUrl")}
                disabled={isPending}
              />
            </div>
          </div>
        </div>

        <Submitbutton title="Save Shop Information" isPending={isPending} />
      </CardContent>
    </form>
  );
};

export default SellerInfoForm;
