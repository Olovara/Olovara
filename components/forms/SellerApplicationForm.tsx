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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

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
      websiteOrShopLinks: "",
      socialMediaProfiles: "",
      location: "",
      yearsOfExperience: "",
      productTypes: "",
      birthdate: "",
      agreeToHandmadePolicy: false,
      certifyOver18: false,
      agreeToTerms: false,
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
        <Card className="w-full mx-auto shadow-xl p-8 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
          <CardHeader className="space-y-4">
            <CardTitle className="text-3xl font-bold">Seller Application</CardTitle>
            <CardDescription className="text-lg">
              Please fill in the information below to start selling on Yarnnu
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-y-8">
            {/* Basic Information Section */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-xl font-semibold text-purple-800">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-y-3">
                  <Label className="text-lg font-semibold">Location *</Label>
                  <Input
                    placeholder="City, State/Province, Country"
                    {...form.register("location")}
                    disabled={isPending}
                    type="text"
                    className="text-lg p-4 rounded-lg border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                  />
                  {form.formState.errors.location && (
                    <p className="text-sm text-red-500">{form.formState.errors.location.message}</p>
                  )}
                </div>

                <div className="flex flex-col gap-y-3">
                  <Label className="text-lg font-semibold">Years of Experience *</Label>
                  <Input
                    placeholder="e.g., 3 years, 5+ years"
                    {...form.register("yearsOfExperience")}
                    disabled={isPending}
                    type="text"
                    className="text-lg p-4 rounded-lg border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                  />
                  {form.formState.errors.yearsOfExperience && (
                    <p className="text-sm text-red-500">{form.formState.errors.yearsOfExperience.message}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-y-3">
                <Label className="text-lg font-semibold">Date of Birth *</Label>
                <Input
                  placeholder="MM/DD/YYYY"
                  {...form.register("birthdate")}
                  disabled={isPending}
                  type="date"
                  className="text-lg p-4 rounded-lg border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                />
                {form.formState.errors.birthdate && (
                  <p className="text-sm text-red-500">{form.formState.errors.birthdate.message}</p>
                )}
              </div>
            </motion.div>

            <Separator className="my-6" />

            {/* Crafting Information Section */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-xl font-semibold text-purple-800">Crafting Information</h3>
              
              <div className="flex flex-col gap-y-3">
                <Label className="text-lg font-semibold">Crafting Process *</Label>
                <Textarea
                  placeholder="Tell us about your crafting process and what you make. This helps us understand your unique style and products."
                  {...form.register("craftingProcess")}
                  disabled={isPending}
                  className="min-h-[150px] text-lg p-4 rounded-lg border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                />
                {form.formState.errors.craftingProcess && (
                  <p className="text-sm text-red-500">{form.formState.errors.craftingProcess.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-y-3">
                <Label className="text-lg font-semibold">Product Types *</Label>
                <Textarea
                  placeholder="Describe the types of products you make (e.g., hand-knitted scarves, ceramic mugs, wooden jewelry boxes)"
                  {...form.register("productTypes")}
                  disabled={isPending}
                  className="min-h-[100px] text-lg p-4 rounded-lg border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                />
                {form.formState.errors.productTypes && (
                  <p className="text-sm text-red-500">{form.formState.errors.productTypes.message}</p>
                )}
              </div>
            </motion.div>

            <Separator className="my-6" />

            {/* Online Presence Section */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-xl font-semibold text-purple-800">Online Presence</h3>
              
              <div className="flex flex-col gap-y-3">
                <Label className="text-lg font-semibold">Portfolio/Shop Links *</Label>
                <Input
                  placeholder="Share a link to your portfolio, Etsy shop, or social media"
                  {...form.register("portfolio")}
                  disabled={isPending}
                  type="text"
                  className="text-lg p-4 rounded-lg border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                />
                {form.formState.errors.portfolio && (
                  <p className="text-sm text-red-500">{form.formState.errors.portfolio.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-y-3">
                <Label className="text-lg font-semibold">Website or Shop Links *</Label>
                <Input
                  placeholder="Your website, online shop, or marketplace profiles"
                  {...form.register("websiteOrShopLinks")}
                  disabled={isPending}
                  type="text"
                  className="text-lg p-4 rounded-lg border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                />
                {form.formState.errors.websiteOrShopLinks && (
                  <p className="text-sm text-red-500">{form.formState.errors.websiteOrShopLinks.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-y-3">
                <Label className="text-lg font-semibold">Social Media Profiles *</Label>
                <Input
                  placeholder="Instagram, Facebook, TikTok, Pinterest, etc."
                  {...form.register("socialMediaProfiles")}
                  disabled={isPending}
                  type="text"
                  className="text-lg p-4 rounded-lg border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                />
                {form.formState.errors.socialMediaProfiles && (
                  <p className="text-sm text-red-500">{form.formState.errors.socialMediaProfiles.message}</p>
                )}
              </div>
            </motion.div>

            <Separator className="my-6" />

            {/* Motivation Section */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-xl font-semibold text-purple-800">Why Join Yarnnu?</h3>
              
              <div className="flex flex-col gap-y-3">
                <Label className="text-lg font-semibold">What is your interest in joining Yarnnu? *</Label>
                <Textarea
                  placeholder="Tell us why you want to sell on Yarnnu and what makes your products special."
                  {...form.register("interestInJoining")}
                  disabled={isPending}
                  className="min-h-[150px] text-lg p-4 rounded-lg border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                />
                {form.formState.errors.interestInJoining && (
                  <p className="text-sm text-red-500">{form.formState.errors.interestInJoining.message}</p>
                )}
              </div>
            </motion.div>

            <Separator className="my-6" />

            {/* Legal Agreements Section */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-xl font-semibold text-purple-800">Legal Agreements</h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="certifyOver18"
                    checked={form.watch("certifyOver18")}
                    onCheckedChange={(checked) => form.setValue("certifyOver18", checked as boolean)}
                    disabled={isPending}
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="certifyOver18" className="text-base font-medium">
                      I certify that I am 18 years of age or older *
                    </Label>
                    {form.formState.errors.certifyOver18 && (
                      <p className="text-sm text-red-500">{form.formState.errors.certifyOver18.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="agreeToHandmadePolicy"
                    checked={form.watch("agreeToHandmadePolicy")}
                    onCheckedChange={(checked) => form.setValue("agreeToHandmadePolicy", checked as boolean)}
                    disabled={isPending}
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="agreeToHandmadePolicy" className="text-base font-medium">
                      I agree to the Handmade Policy *
                    </Label>
                    <p className="text-sm text-gray-600">
                      I confirm that I exclusively sell handmade products created by myself. Reselling, dropshipping, or print-on-demand products are strictly prohibited.
                    </p>
                    {form.formState.errors.agreeToHandmadePolicy && (
                      <p className="text-sm text-red-500">{form.formState.errors.agreeToHandmadePolicy.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="agreeToTerms"
                    checked={form.watch("agreeToTerms")}
                    onCheckedChange={(checked) => form.setValue("agreeToTerms", checked as boolean)}
                    disabled={isPending}
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="agreeToTerms" className="text-base font-medium">
                      I agree to the Terms and Conditions *
                    </Label>
                    {form.formState.errors.agreeToTerms && (
                      <p className="text-sm text-red-500">{form.formState.errors.agreeToTerms.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </CardContent>
          <CardFooter className="pt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="w-full"
            >
              <Submitbutton title="Submit Application" isPending={isPending} />
            </motion.div>
          </CardFooter>
        </Card>
      </motion.form>
    </div>
  );
};

export default SellerApplicationForm;
