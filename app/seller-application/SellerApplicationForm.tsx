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
      seller(values).then((data) => {
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
    <form action={formAction}>
      <CardHeader>
        <CardTitle>Seller Application</CardTitle>
        <CardDescription>Please fill in the information below</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-5">
        <div className="flex flex-col gap-y-2">
          <Label>What is your crafting process</Label>
          <Input name="craftingProcess" type="string" />
        </div>

        <div className="flex flex-col gap-y-2">
          <Label>Portfolio</Label>
          <Input name="portfolio" type="string" />
        </div>

        <div className="flex flex-col gap-y-2">
          <Label>What is your interest in joining</Label>
          <Input name="interestInJoining" type="string" />
        </div>
      </CardContent>
      <CardFooter>
        <Submitbutton title="Submit" />
      </CardFooter>
    </form>
  );
}

export default SellerApplicationForm;