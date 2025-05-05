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
import { useState, useTransition } from "react";
import { useIsClient } from "@/hooks/use-is-client";
import { CustomerFeedbackSchema } from "@/schemas/CustomerFeedbackSchema";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import Spinner from "@/components/spinner";
import { submitCustomerFeedback } from "@/actions/customer-feedback";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

const CustomerFeedbackFormContent = () => {
  const isClient = useIsClient();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

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
    // Check honeypot first
    if (values.website) {
      // If the honeypot field is filled, silently fail
      return;
    }

    if (!executeRecaptcha) {
      setError("reCAPTCHA not available");
      return;
    }

    // Get reCAPTCHA token
    const token = await executeRecaptcha("feedback_form");

    startTransition(() => {
      submitCustomerFeedback({ ...values, recaptchaToken: token }).then((data) => {
        if (data.success) setSuccess(data.success);
        if (data.error) setError(data.error);
      });
    });
    form.reset();
    setSuccess("");
    setError("");
  };

  if (!isClient) return <Spinner />;

  return (
    <div className="w-full flex justify-center pt-10 pb-10">
      <FormProvider {...form}>
        <Card className="max-w-2xl w-full mx-auto shadow-lg p-8 rounded-lg bg-purple-50">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Customer Feedback</CardTitle>
              <CardDescription className="text-gray-500">
                We value your feedback to help us improve
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    <FormLabel>How did you hear about Yarnnu?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {heardFromOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="overallExperience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How was your overall experience?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                        className="flex flex-col space-y-1"
                      >
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <div key={rating} className="flex items-center space-x-2">
                            <RadioGroupItem value={rating.toString()} id={`rating-${rating}`} />
                            <label htmlFor={`rating-${rating}`}>{rating} {rating === 1 ? 'star' : 'stars'}</label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="placedOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Have you placed an order?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="YES">Yes</SelectItem>
                        <SelectItem value="PLANNING">Not yet, but planning to</SelectItem>
                        <SelectItem value="NO">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {form.watch("placedOrder") === "YES" && (
                <FormItem>
                  <FormLabel>Order Number (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your order number" {...form.register("orderNumber")} />
                  </FormControl>
                </FormItem>
              )}

              <FormItem>
                <FormLabel>Share your experience</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us about your experience with Yarnnu..."
                    {...form.register("experience")}
                    disabled={isPending}
                  />
                </FormControl>
              </FormItem>

              <FormItem>
                <FormLabel>How can we improve? (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Share your suggestions for improvement..."
                    {...form.register("improvements")}
                    disabled={isPending}
                  />
                </FormControl>
              </FormItem>

              <FormField
                control={form.control}
                name="returnLikelihood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How likely are you to return to Yarnnu?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                        className="flex flex-col space-y-1"
                      >
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <div key={rating} className="flex items-center space-x-2">
                            <RadioGroupItem value={rating.toString()} id={`return-${rating}`} />
                            <label htmlFor={`return-${rating}`}>{rating} {rating === 1 ? 'star' : 'stars'}</label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Email (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email if you'd like us to contact you"
                    {...form.register("email")}
                    disabled={isPending}
                  />
                </FormControl>
              </FormItem>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Submitbutton title="Submit Feedback" isPending={isPending} />
            </CardFooter>
          </form>
        </Card>
      </FormProvider>
    </div>
  );
};

const CustomerFeedbackForm = () => {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
      scriptProps={{
        async: false,
        defer: false,
        appendTo: "head",
        nonce: undefined,
      }}
    >
      <CustomerFeedbackFormContent />
    </GoogleReCaptchaProvider>
  );
};

export default CustomerFeedbackForm;
