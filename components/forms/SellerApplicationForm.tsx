"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Card,
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
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const SellerApplicationForm = () => {
  const isClient = useIsClient();
  const router = useRouter();

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
        if (data.success) {
          setSuccess(data.success);
          toast.success(data.success);
          // Redirect to seller dashboard after a short delay
          setTimeout(() => {
            router.push("/seller/dashboard");
          }, 1500);
        }
        if (data?.error) {
          setError(data.error);
          toast.error(data.error);
        }
      });
    });

    form.reset();
    setSuccess("");
    setError("");
  };

  if (!isClient) return <Spinner />;

  return (
    <div className="w-full flex justify-center pt-10 pb-10">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="max-w-2xl w-full mx-auto shadow-lg p-8 rounded-lg bg-purple-50">
          <CardHeader>
            <CardTitle>Seller Application</CardTitle>
            <CardDescription>
              Please fill in the information below to start selling on Yarnnu
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-y-6">
            <div className="flex flex-col gap-y-2">
              <Label>Crafting process</Label>
              <Textarea
                placeholder="Tell us about your crafting process and what you make. This helps us understand your unique style and products."
                {...form.register("craftingProcess")}
                disabled={isPending}
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <Label>Portfolio</Label>
              <Input
                placeholder="Share a link to your portfolio, Etsy shop, or social media"
                {...form.register("portfolio")}
                disabled={isPending}
                type="text"
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <Label>What is your interest in joining Yarnnu?</Label>
              <Textarea
                placeholder="Tell us why you want to sell on Yarnnu and what makes your products special."
                {...form.register("interestInJoining")}
                disabled={isPending}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Submitbutton title="Start Selling" isPending={isPending} />
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default SellerApplicationForm;
