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
import { useState, useTransition, useEffect } from "react";
import { useIsClient } from "@/hooks/use-is-client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Spinner from "@/components/spinner";
import { Textarea } from "@/components/ui/textarea";
import { SellerSchema } from "@/schemas/SellerSchema";
import { sellerInformation } from "@/actions/sellerInformation";
import { getSellerData } from "@/actions/getSellerData";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

const SellerForm = () => {
  const isClient = useIsClient();
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<z.infer<typeof SellerSchema>>({
    resolver: zodResolver(SellerSchema),
    defaultValues: {
      shopName: "",
      shopDescription: "",
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
    startTransition(async () => {
      try {
        const result = await sellerInformation(values);
        if (result.success) {
          setSuccess(result.success);
          // Fetch updated data after successful save
          const updatedData = await getSellerData();
          if (updatedData.data) {
            const formattedData = {
              ...updatedData.data,
              isWomanOwned: Boolean(updatedData.data.isWomanOwned),
              isMinorityOwned: Boolean(updatedData.data.isMinorityOwned),
              isLGBTQOwned: Boolean(updatedData.data.isLGBTQOwned),
              isVeteranOwned: Boolean(updatedData.data.isVeteranOwned),
              isSustainable: Boolean(updatedData.data.isSustainable),
              isCharitable: Boolean(updatedData.data.isCharitable),
              valuesPreferNotToSay: Boolean(updatedData.data.valuesPreferNotToSay),
            };
            form.reset(formattedData);
          }
        }
        if (result.error) {
          setError(result.error);
        }
      } catch (error) {
        setError("Failed to save seller information");
      }
    });
  };

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
      </CardContent>
      <CardFooter>
        <Submitbutton title="Save" isPending={isPending} />
      </CardFooter>
    </form>
  );
};

export default SellerForm;
