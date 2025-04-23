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
import { motion } from "framer-motion";

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
    <div className="w-full flex justify-center py-16 px-4">
      <motion.form 
        onSubmit={form.handleSubmit(onSubmit)} 
        className="space-y-6 w-full max-w-4xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full mx-auto shadow-xl p-8 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardHeader className="space-y-4">
            <CardTitle className="text-3xl font-bold text-purple-900">Seller Application</CardTitle>
            <CardDescription className="text-lg text-purple-700">
              Please fill in the information below to start selling on Yarnnu
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-y-8">
            <motion.div 
              className="flex flex-col gap-y-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Label className="text-lg font-semibold text-purple-800">Crafting process</Label>
              <Textarea
                placeholder="Tell us about your crafting process and what you make. This helps us understand your unique style and products."
                {...form.register("craftingProcess")}
                disabled={isPending}
                className="min-h-[150px] text-lg p-4 rounded-lg border-purple-200 focus:border-purple-400 focus:ring-purple-400"
              />
            </motion.div>

            <motion.div 
              className="flex flex-col gap-y-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Label className="text-lg font-semibold text-purple-800">Portfolio</Label>
              <Input
                placeholder="Share a link to your portfolio, Etsy shop, or social media"
                {...form.register("portfolio")}
                disabled={isPending}
                type="text"
                className="text-lg p-4 rounded-lg border-purple-200 focus:border-purple-400 focus:ring-purple-400"
              />
            </motion.div>

            <motion.div 
              className="flex flex-col gap-y-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Label className="text-lg font-semibold text-purple-800">What is your interest in joining Yarnnu?</Label>
              <Textarea
                placeholder="Tell us why you want to sell on Yarnnu and what makes your products special."
                {...form.register("interestInJoining")}
                disabled={isPending}
                className="min-h-[150px] text-lg p-4 rounded-lg border-purple-200 focus:border-purple-400 focus:ring-purple-400"
              />
            </motion.div>
          </CardContent>
          <CardFooter className="pt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="w-full"
            >
              <Submitbutton title="Start Selling" isPending={isPending} />
            </motion.div>
          </CardFooter>
        </Card>
      </motion.form>
    </div>
  );
};

export default SellerApplicationForm;
