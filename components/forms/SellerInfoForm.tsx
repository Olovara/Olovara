"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { getCountryByCode, getOnboardingCountriesByZone } from "@/data/countries";

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
      businessName: "",
      taxId: "",
      businessAddress: "",
      businessCity: "",
      businessState: "",
      businessPostalCode: "",
      taxCountry: "US",
      additionalTaxRegistrations: "",
      facebookUrl: "",
      instagramUrl: "",
      twitterUrl: "",
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
            Object.entries(result.data).map(([k, v]) => [k, v ?? ""])
          );
          form.reset(safeData);
        }
      } catch (error) {
        setError("Failed to load business information");
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

      const result = await updateSellerInfo(values);

      if (result.error) {
        toast.error(result.error);
        throw new Error(result.error);
      }

      toast.success(result.success || "Successfully saved your business information.");
    } catch (error) {
      console.error("Error submitting form:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save business information";
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
        <CardTitle>Business Information</CardTitle>
        <CardDescription>
          Manage your tax information and social media links
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
                When enabled, your shop will be temporarily closed and customers won&apos;t be able to place orders
              </div>
            </div>
            <Switch
              checked={form.watch("isVacationMode")}
              onCheckedChange={(checked) => form.setValue("isVacationMode", checked)}
              disabled={isPending}
            />
          </div>

          {/* Custom Orders */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Accept Custom Orders</Label>
              <div className="text-sm text-muted-foreground">
                Allow customers to request custom orders through a form you create. You&apos;ll be able to design your own form to collect the information you need.
              </div>
            </div>
            <Switch
              checked={form.watch("acceptsCustom")}
              onCheckedChange={(checked) => form.setValue("acceptsCustom", checked)}
              disabled={isPending}
            />
          </div>

          {form.watch("acceptsCustom") && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Custom Orders Enabled</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>Great! Now you can create a custom order form in your dashboard. This will help you collect all the information you need from customers without back-and-forth messages.</p>
                    <p className="mt-2">
                      <a href="/seller/dashboard/custom-orders" className="font-medium underline">
                        Go to Custom Orders →
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
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
              <Label>Business Name (for tax purposes) *</Label>
              <Input
                placeholder="Legal business name"
                {...form.register("businessName")}
                disabled={isPending}
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <Label>Tax ID / VAT Number *</Label>
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
              <Label>Business Address *</Label>
              <Input
                placeholder="Street address"
                {...form.register("businessAddress")}
                disabled={isPending}
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <Label>City *</Label>
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
              <Label>Postal Code *</Label>
              <Input
                placeholder="Postal code"
                {...form.register("businessPostalCode")}
                disabled={isPending}
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <Label>Country of Tax Registration *</Label>
              <Select
                onValueChange={(value) => form.setValue("taxCountry", value)}
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

        <Separator className="my-4" />

        {/* Social Media Links Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Social Media Links</h3>
          <p className="text-sm text-muted-foreground">
            Connect your social media accounts to help customers find and follow your shop
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
              <Label>Twitter/X</Label>
              <Input
                placeholder="https://twitter.com/yourhandle"
                {...form.register("twitterUrl")}
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

        <Submitbutton title="Save Business Information" isPending={isPending} />
      </CardContent>
    </form>
  );
};

export default SellerInfoForm; 