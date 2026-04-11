"use client";

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
import { Button } from "@/components/ui/button";
import { useState, useTransition } from "react";
import { useIsClient } from "@/hooks/use-is-client";
import { CustomerFeedbackSchema } from "@/schemas/CustomerFeedbackSchema";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import Spinner from "@/components/spinner";
import { submitCustomerFeedback } from "@/actions/customer-feedback";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { ReCaptcha } from "@/components/ui/recaptcha";
import { validateHoneypot } from "@/lib/recaptcha";
import { motion } from "framer-motion";

// Match Input/Textarea: brand border + ring-offset-2 + ring-brand-primary-400 (same as other fields)
const feedbackSelectTriggerClassName =
  "min-h-[3.5rem] h-auto w-full text-lg rounded-lg border border-brand-light-neutral-200 bg-brand-light-neutral-50 px-4 py-3 text-brand-dark-neutral-900 shadow-none ring-offset-background focus:outline-none focus:border-brand-primary-400 focus:ring-2 focus:ring-brand-primary-400 focus:ring-offset-2 focus-visible:border-brand-primary-400 focus-visible:ring-2 focus-visible:ring-brand-primary-400 focus-visible:ring-offset-2 [&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-brand-dark-neutral-600";

const feedbackSelectContentClassName =
  "bg-brand-light-neutral-50 border-brand-light-neutral-200 text-brand-dark-neutral-900";

const feedbackSelectItemClassName =
  "cursor-pointer text-lg focus:bg-brand-primary-50 focus:text-brand-dark-neutral-900";

const CustomerFeedbackFormContent = () => {
  const isClient = useIsClient();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();
  const [recaptchaToken, setRecaptchaToken] = useState<string>("");
  const [shouldTriggerRecaptcha, setShouldTriggerRecaptcha] = useState(false);
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);

  const heardFromOptions = [
    { id: "SOCIAL_MEDIA", name: "Social Media" },
    { id: "FRIEND", name: "Friend or Family" },
    { id: "SEARCH", name: "Search Engine" },
    { id: "ADVERTISEMENT", name: "Advertisement" },
    { id: "OTHER", name: "Other" },
  ];

  const form = useForm<z.infer<typeof CustomerFeedbackSchema>>({
    resolver: zodResolver(CustomerFeedbackSchema),
    defaultValues: {
      heardFrom: "",
      overallExperience: 0,
      placedOrder: "NO",
      orderNumber: "",
      experience: "",
      improvements: "",
      returnLikelihood: 0,
      email: "",
      website: "", // Honeypot field
    },
  });

  const onSubmit = async (values: z.infer<typeof CustomerFeedbackSchema>) => {
    // Step 1: Check honeypot first (before any reCAPTCHA calls)
    if (!validateHoneypot(values.website)) {
      // If the honeypot field is filled, silently fail (don't waste reCAPTCHA quota)
      console.log("Bot detected via honeypot field");
      return;
    }

    // Step 2: Trigger reCAPTCHA verification
    setShouldTriggerRecaptcha(true);
    setRecaptchaError(null);
  };

  const handleRecaptchaSuccess = (token: string) => {
    setRecaptchaToken(token);
    setShouldTriggerRecaptcha(false);
    
    // Step 3: Submit the form with the token
    const values = form.getValues();
    startTransition(() => {
      submitCustomerFeedback({
        ...values,
        recaptchaToken:
          process.env.NODE_ENV === "development" ? "dev-token" : token,
      }).then((data) => {
        if (data.success) setSuccess(data.success);
        if (data.error) setError(data.error);
      });
    });
    form.reset();
    setSuccess("");
    setError("");
    setRecaptchaToken("");
  };

  const handleRecaptchaError = (error: string) => {
    setRecaptchaError(error);
    setShouldTriggerRecaptcha(false);
    setError("Security verification failed. Please try again.");
  };

  if (!isClient) return <Spinner />;

  return (
    <div className="w-full flex justify-center py-16 px-1 sm:px-4">
      <FormProvider {...form}>
        <motion.form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 w-full max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full mx-auto shadow-xl p-2 sm:p-8 rounded-xl bg-brand-light-neutral-100 border-brand-light-neutral-200">
            <CardHeader className="space-y-4">
              <CardTitle className="text-3xl font-bold text-brand-dark-neutral-900">
                Customer Feedback
              </CardTitle>
              <CardDescription className="text-lg text-brand-dark-neutral-600">
                We value your feedback to help us improve.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Honeypot field - hidden from real users */}
              <div className="hidden">
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input {...form.register("website")} />
                  </FormControl>
                </FormItem>
              </div>

              <FormField
                control={form.control}
                name="heardFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-brand-dark-neutral-900">
                      How did you hear about OLOVARA?
                    </FormLabel>
                    <Select
                      value={field.value || undefined}
                      onValueChange={field.onChange}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger className={feedbackSelectTriggerClassName}>
                          <SelectValue placeholder="Choose an option" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className={feedbackSelectContentClassName}>
                        {heardFromOptions.map((option) => (
                          <SelectItem
                            key={option.id}
                            value={option.id}
                            className={feedbackSelectItemClassName}
                          >
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="overallExperience"
                render={({ field }) => (
                  <FormItem>
                    {/* fieldset/legend: correct semantics for a group of buttons (avoids label→div orphaned-label warnings) */}
                    <fieldset className="space-y-3 border-0 p-0 m-0 min-w-0">
                      <legend className="text-lg font-semibold text-brand-dark-neutral-900 w-full">
                        Overall Experience (1-5 stars)
                      </legend>
                      <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Button
                            key={star}
                            type="button"
                            variant={field.value >= star ? "default" : "outline"}
                            size="sm"
                            onClick={() => field.onChange(star)}
                            className={
                              field.value >= star
                                ? "w-10 h-10 p-0 bg-brand-primary-700 text-white hover:bg-brand-primary-700 border-brand-primary-700"
                                : "w-10 h-10 p-0 border-brand-light-neutral-200 hover:bg-brand-primary-50 hover:text-brand-primary-700 hover:border-brand-primary-200"
                            }
                            aria-label={`Rate ${star} out of 5 stars`}
                          >
                            ★
                          </Button>
                        ))}
                      </div>
                    </fieldset>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="placedOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-brand-dark-neutral-900">
                      Have you placed an order?
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger className={feedbackSelectTriggerClassName}>
                          <SelectValue placeholder="Choose an option" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className={feedbackSelectContentClassName}>
                        <SelectItem value="YES" className={feedbackSelectItemClassName}>
                          Yes
                        </SelectItem>
                        <SelectItem value="PLANNING" className={feedbackSelectItemClassName}>
                          Planning to
                        </SelectItem>
                        <SelectItem value="NO" className={feedbackSelectItemClassName}>
                          No
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orderNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-brand-dark-neutral-900">
                      Order Number (if applicable)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter order number"
                        {...field}
                        className="text-lg p-4 rounded-lg border-brand-light-neutral-200 focus:border-brand-primary-400 focus:ring-brand-primary-400 bg-brand-light-neutral-50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-brand-dark-neutral-900">
                      Tell us about your experience
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Share your experience with OLOVARA..."
                        {...field}
                        className="min-h-[120px] text-lg p-4 rounded-lg border-brand-light-neutral-200 focus:border-brand-primary-400 focus:ring-brand-primary-400 bg-brand-light-neutral-50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="improvements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-brand-dark-neutral-900">
                      Suggestions for improvement (optional)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What could we do better?"
                        {...field}
                        className="min-h-[100px] text-lg p-4 rounded-lg border-brand-light-neutral-200 focus:border-brand-primary-400 focus:ring-brand-primary-400 bg-brand-light-neutral-50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="returnLikelihood"
                render={({ field }) => (
                  <FormItem>
                    <fieldset className="space-y-3 border-0 p-0 m-0 min-w-0">
                      <legend className="text-lg font-semibold text-brand-dark-neutral-900 w-full">
                        How likely are you to return? (1-5)
                      </legend>
                      <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <Button
                            key={rating}
                            type="button"
                            variant={field.value >= rating ? "default" : "outline"}
                            size="sm"
                            onClick={() => field.onChange(rating)}
                            className={
                              field.value >= rating
                                ? "w-10 h-10 p-0 bg-brand-primary-700 text-white hover:bg-brand-primary-700 border-brand-primary-700"
                                : "w-10 h-10 p-0 border-brand-light-neutral-200 hover:bg-brand-primary-50 hover:text-brand-primary-700 hover:border-brand-primary-200"
                            }
                            aria-label={`Likelihood ${rating} out of 5`}
                          >
                            {rating}
                          </Button>
                        ))}
                      </div>
                    </fieldset>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-brand-dark-neutral-900">
                      Email (Optional - for follow-up)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="your@email.com"
                        type="email"
                        {...field}
                        className="text-lg p-4 rounded-lg border-brand-light-neutral-200 focus:border-brand-primary-400 focus:ring-brand-primary-400 bg-brand-light-neutral-50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Security Verification - Invisible reCAPTCHA v3 */}
              <div className="hidden">
                <ReCaptcha
                  action="feedback_form"
                  onVerify={handleRecaptchaSuccess}
                  onError={handleRecaptchaError}
                  trigger={shouldTriggerRecaptcha}
                />
              </div>
            </CardContent>
            <CardFooter className="pt-6 flex justify-end">
              <Submitbutton 
                title={isPending ? "Submitting..." : "Submit Feedback"} 
                isPending={isPending || shouldTriggerRecaptcha} 
              />
            </CardFooter>
          </Card>
        </motion.form>
      </FormProvider>
    </div>
  );
};

export default CustomerFeedbackFormContent;
