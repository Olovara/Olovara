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
import { FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { ReCaptcha } from "@/components/ui/recaptcha";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

const CustomerFeedbackFormContent = () => {
  const isClient = useIsClient();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();
  const [recaptchaToken, setRecaptchaToken] = useState<string>("");

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

    // Check if reCAPTCHA token is available (skip in development)
    if (process.env.NODE_ENV !== "development" && !recaptchaToken) {
      setError(
        "Security verification in progress. Please wait a moment and try again."
      );
      return;
    }

    startTransition(() => {
      submitCustomerFeedback({
        ...values,
        recaptchaToken:
          process.env.NODE_ENV === "development" ? "dev-token" : recaptchaToken,
      }).then((data) => {
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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
                    <FormLabel>
                      How would you rate your overall experience?
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        }
                        defaultValue={field.value?.toString()}
                        className="flex flex-col space-y-1"
                      >
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <div
                            key={rating}
                            className="flex items-center space-x-2"
                          >
                            <RadioGroupItem
                              value={rating.toString()}
                              id={`rating-${rating}`}
                            />
                            <label
                              htmlFor={`rating-${rating}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {rating} -{" "}
                              {rating === 1
                                ? "Poor"
                                : rating === 2
                                  ? "Fair"
                                  : rating === 3
                                    ? "Good"
                                    : rating === 4
                                      ? "Very Good"
                                      : "Excellent"}
                            </label>
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
                    <FormLabel>Have you placed an order with us?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="YES" id="order-yes" />
                          <label
                            htmlFor="order-yes"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Yes, I have placed an order
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="PLANNING"
                            id="order-planning"
                          />
                          <label
                            htmlFor="order-planning"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            I&apos;m planning to place an order
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="NO" id="order-no" />
                          <label
                            htmlFor="order-no"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            No, I haven&apos;t placed an order
                          </label>
                        </div>
                      </RadioGroup>
                    </FormControl>
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
                      <Input placeholder="Enter your order number" {...field} />
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
                        placeholder="Please share your experience with Yarnnu..."
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
                    <FormLabel>What could we improve? (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any suggestions for improvement..."
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
                    <FormLabel>
                      How likely are you to return to Yarnnu?
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        }
                        defaultValue={field.value?.toString()}
                        className="flex flex-col space-y-1"
                      >
                        {[1, 2, 3, 4, 5].map((likelihood) => (
                          <div
                            key={likelihood}
                            className="flex items-center space-x-2"
                          >
                            <RadioGroupItem
                              value={likelihood.toString()}
                              id={`likelihood-${likelihood}`}
                            />
                            <label
                              htmlFor={`likelihood-${likelihood}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {likelihood} -{" "}
                              {likelihood === 1
                                ? "Very Unlikely"
                                : likelihood === 2
                                  ? "Unlikely"
                                  : likelihood === 3
                                    ? "Maybe"
                                    : likelihood === 4
                                      ? "Likely"
                                      : "Very Likely"}
                            </label>
                          </div>
                        ))}
                      </RadioGroup>
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
                  onVerify={(token) => setRecaptchaToken(token)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              {process.env.NODE_ENV === "development" || recaptchaToken ? (
                <Submitbutton title="Submit Feedback" isPending={isPending} />
              ) : (
                <Button
                  type="submit"
                  disabled={true}
                  className="bg-gray-400 cursor-not-allowed"
                >
                  Security verification in progress...
                </Button>
              )}
            </CardFooter>
          </form>
        </Card>
      </FormProvider>
    </div>
  );
};

const CustomerFeedbackForm = () => {
  return <CustomerFeedbackFormContent />;
};

export default CustomerFeedbackForm;
