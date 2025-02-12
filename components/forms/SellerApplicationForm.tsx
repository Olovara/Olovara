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
import { SellerApplicationSchema } from "@/schemas/SellerApplicationSchema";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Spinner from "@/components/spinner";
import { sellerApplication } from "@/actions/seller-application";
import { Textarea } from "@/components/ui/textarea";

const SellerApplicationForm = () => {
  const isClient = useIsClient();

  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof SellerApplicationSchema>>({
    resolver: zodResolver(SellerApplicationSchema),
    defaultValues: {
      craftingProcess: "",
      portfolio: "",
      interestInJoining: "",
    },
  });

  const onSubmit = (values: z.infer<typeof SellerApplicationSchema>) => {
    startTransition(() => {
      sellerApplication(values).then((data) => {
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
        <CardTitle>Seller Application</CardTitle>
        <CardDescription>Please fill in the information below</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-6">
        <div className="flex flex-col gap-y-2">
          <Label>Crafting process</Label>
          <Textarea placeholder="Tell us a little about your crafting process and what you make."
            {...form.register("craftingProcess")} // Link input to react-hook-form
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-y-2">
          <Label>Portfolio</Label>
          <Input placeholder="www.example.com"
            {...form.register("portfolio")} // Link input to react-hook-form
            disabled={isPending}
            type="text"
          />
        </div>

        <div className="flex flex-col gap-y-2">
          <Label>What is your interest in joining</Label>
          <Textarea placeholder="Type your message here."
            {...form.register("interestInJoining")} // Link input to react-hook-form
            disabled={isPending}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Submitbutton title="Submit" />
      </CardFooter>
    </form>
  );
};

export default SellerApplicationForm;