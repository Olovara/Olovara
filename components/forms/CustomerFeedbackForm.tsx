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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { ReCaptcha } from "@/components/ui/recaptcha";
import { validateHoneypot } from "@/lib/recaptcha";

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
    <div className="w-full flex justify-center pt-10 pb-10">
      <FormProvider {...form}>
        <Card className="max-w-2xl w-full mx-auto shadow-lg p-8 rounded-lg bg-purple-50">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">
                Customer Feedback
              </CardTitle>
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
                    <FormLabel>Overall Experience (1-5 stars)</FormLabel>
                    <FormControl>
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Button
                            key={star}
                            type="button"
                            variant={field.value >= star ? "default" : "outline"}
                            size="sm"
                            onClick={() => field.onChange(star)}
                            className="w-10 h-10 p-0"
                          >
                            ★
                          </Button>
                        ))}
                      </div>
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
                        <SelectItem value="PLANNING">Planning to</SelectItem>
                        <SelectItem value="NO">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orderNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Number (if applicable)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter order number" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tell us about your experience</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Share your experience with Yarnnu..."
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="improvements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Suggestions for improvement (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What could we do better?"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="returnLikelihood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How likely are you to return? (1-5)</FormLabel>
                    <FormControl>
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <Button
                            key={rating}
                            type="button"
                            variant={field.value >= rating ? "default" : "outline"}
                            size="sm"
                            onClick={() => field.onChange(rating)}
                            className="w-10 h-10 p-0"
                          >
                            {rating}
                          </Button>
                        ))}
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optional - for follow-up)</FormLabel>
                    <FormControl>
                      <Input placeholder="your@email.com" {...field} />
                    </FormControl>
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
            <CardFooter className="flex justify-end">
              <Submitbutton 
                title={isPending ? "Submitting..." : "Submit Feedback"} 
                isPending={isPending || shouldTriggerRecaptcha} 
              />
            </CardFooter>
          </form>
        </Card>
      </FormProvider>
    </div>
  );
};

export default CustomerFeedbackFormContent;
