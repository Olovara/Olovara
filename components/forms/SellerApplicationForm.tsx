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
import { usePermissions } from "@/components/providers/PermissionProvider";
import { DatePicker } from "@/components/ui/date-picker";


const SellerApplicationForm = () => {
  const isClient = useIsClient();
  const router = useRouter();
  const { refreshPermissions } = usePermissions();

  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof SellerApplicationSchema>>({
    resolver: zodResolver(SellerApplicationSchema),
    defaultValues: {
      craftingProcess: "",
      productTypes: "",
      interestInJoining: "",
      onlinePresence: "",
      yearsOfExperience: "",
      birthdate: "",
      agreeToHandmadePolicy: false,
      certifyOver18: false,
      agreeToTerms: false,
      referralCode: "",
    },
  });

  const onSubmit = (values: z.infer<typeof SellerApplicationSchema>) => {
    startTransition(async () => {
      console.log("SellerApplicationForm - Starting form submission...");
      
      // Convert selected date to string format for the form
      const formData = {
        ...values,
        birthdate: selectedDate ? selectedDate.toISOString().split('T')[0] : "",
      };
      
      const result = await sellerApplication(formData);
      
      if (result.success) {
        console.log("SellerApplicationForm - Application submitted successfully");
        setSuccess(result.success);
        toast.success(result.success);
        
        // Clear any cached permissions to force fresh fetch
        console.log("SellerApplicationForm - Clearing cached permissions...");
        if (typeof window !== 'undefined') {
          localStorage.removeItem('yarnnu_user_permissions');
          localStorage.removeItem('yarnnu_user_role');
          localStorage.removeItem('yarnnu_permissions_timestamp');
        }
        
        // Force a complete page reload to refresh the session with new role and permissions
        console.log("SellerApplicationForm - Forcing page reload in 2 seconds...");
        
        // Redirect to seller dashboard with a fresh session
        setTimeout(() => {
          console.log("SellerApplicationForm - Redirecting to seller dashboard...");
          window.location.href = "/seller/dashboard";
        }, 2000);
      }
      
      if (result?.error) {
        console.error("SellerApplicationForm - Application submission failed:", result.error);
        setError(result.error);
        toast.error(result.error);
      }
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
        className="space-y-6 w-full max-w-3xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full mx-auto shadow-xl p-8 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
          <CardHeader className="space-y-4">
            <CardTitle className="text-3xl font-bold">Seller Application</CardTitle>
            <CardDescription className="text-lg">
              Tell us about your handmade business to start selling on Yarnnu
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
              <h3 className="text-xl font-semibold text-purple-800">About Your Crafting</h3>
              
              <div className="flex flex-col gap-y-3">
                <Label className="text-lg font-semibold">Crafting Process *</Label>
                <Textarea
                  placeholder="Tell us about your crafting process and what you make. This helps us understand your unique style and products."
                  {...form.register("craftingProcess")}
                  disabled={isPending}
                  className="min-h-[120px] text-lg p-4 rounded-lg border-purple-200 focus:border-purple-400 focus:ring-purple-400"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-y-3">
                  <Label className="text-lg font-semibold">Years of Experience (Optional)</Label>
                  <Input
                    placeholder="e.g., 3 years, 5+ years, just starting"
                    {...form.register("yearsOfExperience")}
                    disabled={isPending}
                    type="text"
                    className="text-lg p-4 rounded-lg border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                  />
                </div>

                <div className="flex flex-col gap-y-3">
                  <Label className="text-lg font-semibold">Date of Birth *</Label>
                  <DatePicker
                    date={selectedDate}
                    onDateChange={setSelectedDate}
                    placeholder="Select your date of birth"
                    disabled={isPending}
                    className="text-lg p-4 rounded-lg border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                  />
                  {form.formState.errors.birthdate && (
                    <p className="text-sm text-red-500">{form.formState.errors.birthdate.message}</p>
                  )}
                </div>
              </div>
            </motion.div>

            <Separator className="my-6" />

            {/* Motivation Section */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-xl font-semibold text-purple-800">Why Join Yarnnu?</h3>
              
              <div className="flex flex-col gap-y-3">
                <Label className="text-lg font-semibold">What is your interest in joining Yarnnu? *</Label>
                <Textarea
                  placeholder="Tell us why you want to sell on Yarnnu and what makes your products special."
                  {...form.register("interestInJoining")}
                  disabled={isPending}
                  className="min-h-[120px] text-lg p-4 rounded-lg border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                />
                {form.formState.errors.interestInJoining && (
                  <p className="text-sm text-red-500">{form.formState.errors.interestInJoining.message}</p>
                )}
              </div>
            </motion.div>

            <Separator className="my-6" />

            {/* Online Presence Section */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-xl font-semibold text-purple-800">Online Presence (Optional)</h3>
              
              <div className="flex flex-col gap-y-3">
                <Label className="text-lg font-semibold">Portfolio, Website, or Social Media</Label>
                <Input
                  placeholder="Share any links to your portfolio, Etsy shop, website, Instagram, etc. (optional)"
                  {...form.register("onlinePresence")}
                  disabled={isPending}
                  type="text"
                  className="text-lg p-4 rounded-lg border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                />
                <p className="text-sm text-gray-600">
                  Don&apos;t worry if you don&apos;t have these yet! Many successful sellers start without an online presence.
                </p>
              </div>

              <div className="flex flex-col gap-y-3">
                <Label className="text-lg font-semibold">Referral Code (Optional)</Label>
                <Input
                  placeholder="Enter a referral code if you have one (e.g., YARNNU-ABCD-1234)"
                  {...form.register("referralCode")}
                  disabled={isPending}
                  type="text"
                  className="text-lg p-4 rounded-lg border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                />
                <p className="text-sm text-gray-600">
                  If someone referred you to Yarnnu, enter their referral code here. You get a 2% reduction on commission fees for a month!
                </p>
                {form.formState.errors.referralCode && (
                  <p className="text-sm text-red-500">{form.formState.errors.referralCode.message}</p>
                )}
              </div>
            </motion.div>

            <Separator className="my-6" />

            {/* Legal Agreements Section */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
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
              transition={{ delay: 0.5 }}
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
