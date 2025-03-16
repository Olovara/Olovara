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
          <Input placeholder="Shop Name"
            {...form.register("shopName")} // Link input to react-hook-form
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-y-2">
          <Label>Shop Description</Label>
          <Textarea placeholder="Please give your shop a description."
            {...form.register("shopDescription")} // Link input to react-hook-form
            disabled={isPending}
          />
        </div>

      </CardContent>
      <CardFooter>
        <Submitbutton title="Save" />
      </CardFooter>
    </form>
  );
};

export default SellerForm;