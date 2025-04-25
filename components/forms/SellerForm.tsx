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
import { useState, useTransition } from "react";
import { useIsClient } from "@/hooks/use-is-client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Spinner from "@/components/spinner";
import { Textarea } from "@/components/ui/textarea";
import { SellerSchema } from "@/schemas/SellerSchema";
import { sellerInformation } from "@/actions/sellerInformation";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

const SellerForm = () => {
  const isClient = useIsClient();

  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const [isPending, startTransition] = useTransition();

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

  const onSubmit = (values: z.infer<typeof SellerSchema>) => {
    startTransition(() => {
      sellerInformation(values).then((data) => {
        if (data.success) setSuccess(data.success);
        if (data?.error) setError(data.error);
      });
    });

    form.reset();
    setSuccess("");
    setError("");
  };

  if (!isClient) return <Spinner />;

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
                {...form.register("isWomanOwned")}
                disabled={isPending}
              />
              <Label htmlFor="isWomanOwned">Woman-Owned Business</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isMinorityOwned"
                {...form.register("isMinorityOwned")}
                disabled={isPending}
              />
              <Label htmlFor="isMinorityOwned">Minority-Owned Business</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isLGBTQOwned"
                {...form.register("isLGBTQOwned")}
                disabled={isPending}
              />
              <Label htmlFor="isLGBTQOwned">LGBTQ+-Owned Business</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isVeteranOwned"
                {...form.register("isVeteranOwned")}
                disabled={isPending}
              />
              <Label htmlFor="isVeteranOwned">Veteran-Owned Business</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isSustainable"
                {...form.register("isSustainable")}
                disabled={isPending}
              />
              <Label htmlFor="isSustainable">Sustainable Practices</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isCharitable"
                {...form.register("isCharitable")}
                disabled={isPending}
              />
              <Label htmlFor="isCharitable">Charitable Business</Label>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="valuesPreferNotToSay"
              {...form.register("valuesPreferNotToSay")}
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
