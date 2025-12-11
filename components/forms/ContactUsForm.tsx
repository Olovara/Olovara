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
import { ContactUsSchema } from "@/schemas/ContactUsSchema";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import Spinner from "@/components/spinner";
import { contactUs } from "@/actions/contact-us";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { ReCaptcha } from "@/components/ui/recaptcha";
import { toast } from "sonner";
import { validateHoneypot } from "@/lib/recaptcha";

const ContactUsFormContent = () => {
  const isClient = useIsClient();
  const [isPending, startTransition] = useTransition();
  const [recaptchaToken, setRecaptchaToken] = useState<string>("");
  const [shouldTriggerRecaptcha, setShouldTriggerRecaptcha] = useState(false);
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);
  const [lastError, setLastError] = useState<{ message: string; retryable: boolean } | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetryAttempt, setIsRetryAttempt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent duplicate submissions

  const Reason = [
    { id: "BILLING", name: "Billing Questions" },
    { id: "GENERAL", name: "General Inquiry" },
    { id: "LISTING", name: "Listing Issue" },
    { id: "ACCOUNT", name: "Account Support" },
    { id: "PAYMENT", name: "Payment Problem" },
    { id: "FEATURE", name: "Feature Request" },
    { id: "BUG", name: "Report a Bug" },
    { id: "OTHER", name: "Other" },
  ];

  const form = useForm<z.infer<typeof ContactUsSchema>>({
    resolver: zodResolver(ContactUsSchema),
    defaultValues: {
      name: "",
      email: "",
      reason: "",
      helpDescription: "",
      // Honeypot field
      website: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof ContactUsSchema>) => {
    // Prevent duplicate submissions - if already submitting, ignore this call
    if (isSubmitting || isPending || shouldTriggerRecaptcha) {
      console.warn("[CONTACT_US_FORM] Submission already in progress, ignoring duplicate submit");
      return;
    }

    // Step 1: Check honeypot first (before any reCAPTCHA calls)
    if (!validateHoneypot(values.website)) {
      // If the honeypot field is filled, silently fail (don't waste reCAPTCHA quota)
      console.warn("[CONTACT_US_FORM] Bot detected via honeypot field");
      return;
    }

    // Mark as submitting to prevent duplicates
    setIsSubmitting(true);

    // Reset retry state for new submission (not a retry)
    setIsRetryAttempt(false);
    setLastError(null);

    // Log form submission attempt (without sensitive data)
    console.log("[CONTACT_US_FORM] Form submission initiated", {
      hasName: !!values.name,
      hasEmail: !!values.email,
      hasReason: !!values.reason,
      hasDescription: !!values.helpDescription,
      timestamp: new Date().toISOString(),
    });

    // Step 2: Trigger reCAPTCHA verification
    setShouldTriggerRecaptcha(true);
    setRecaptchaError(null);
  };

  const handleRecaptchaSuccess = (token: string) => {
    // Prevent duplicate submissions if already processing
    if (isSubmitting && !isRetryAttempt) {
      console.warn("[CONTACT_US_FORM] Already submitting, ignoring duplicate reCAPTCHA success");
      return;
    }

    setRecaptchaToken(token);
    setShouldTriggerRecaptcha(false);
    
    // Step 3: Submit the form with the token
    const values = form.getValues();
    const currentRetryCount = isRetryAttempt ? retryCount + 1 : 0;
    
    startTransition(() => {
      contactUs({ 
        ...values, 
        recaptchaToken: process.env.NODE_ENV === 'development' ? 'dev-token' : token 
      }).then((data) => {
        if (data.success) {
          toast.success("Thank you! Your message has been sent successfully. We'll get back to you soon.");
          form.reset();
          setRecaptchaToken("");
          setLastError(null);
          setRetryCount(0);
          setIsRetryAttempt(false);
          setIsSubmitting(false); // Reset submission flag on success
        }
        if (data.error) {
          const isRetryable = data.retryable !== false; // Default to true if not specified
          
          // Update retry count if this was a retry attempt
          if (isRetryAttempt) {
            setRetryCount(prev => prev + 1);
            setIsRetryAttempt(false); // Reset for next time
          }
          
          // Reset submission flag on error (allows retry)
          setIsSubmitting(false);
          
          // Log error on client side for debugging
          console.error("[CONTACT_US_FORM] Submission error:", {
            error: data.error,
            retryable: isRetryable,
            retryCount: currentRetryCount,
            isRetryAttempt,
            formValues: {
              hasName: !!values.name,
              hasEmail: !!values.email,
              hasReason: !!values.reason,
              hasDescription: !!values.helpDescription,
            },
            timestamp: new Date().toISOString(),
          });
          
          // Store error state for retry functionality
          setLastError({ message: data.error, retryable: isRetryable });
          
          // Show clear error toast with actionable message
          const toastDescription = isRetryable && retryCount < 2
            ? "You can retry the submission using the button below."
            : "If this problem persists, please try refreshing the page or contact support directly.";
          
          toast.error(data.error, {
            description: toastDescription,
            duration: isRetryable ? 8000 : 5000,
          });
        }
      }).catch((error) => {
        // Handle unexpected errors (network issues, etc.)
        console.error("[CONTACT_US_FORM] Unexpected error during submission:", {
          error: error instanceof Error ? error.message : String(error),
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
        });

        // Update retry count if this was a retry attempt
        if (isRetryAttempt) {
          setRetryCount(prev => prev + 1);
          setIsRetryAttempt(false);
        }

        // Reset submission flag on error (allows retry)
        setIsSubmitting(false);

        // Network errors are retryable
        setLastError({ 
          message: "Failed to submit your message. Please check your internet connection and try again.",
          retryable: true 
        });

        toast.error("Failed to submit your message. Please check your internet connection and try again.", {
          description: "You can retry the submission using the button below.",
          duration: 8000,
        });
      });
    });
  };

  const handleRecaptchaError = (error: string) => {
    setRecaptchaError(error);
    setShouldTriggerRecaptcha(false);
    setIsSubmitting(false); // Reset submission flag on reCAPTCHA error
    
    // Log reCAPTCHA error for debugging
    console.error("[CONTACT_US_FORM] reCAPTCHA error:", {
      error,
      timestamp: new Date().toISOString(),
    });

    // reCAPTCHA errors are retryable
    setLastError({ 
      message: "Security verification failed. Please try again.",
      retryable: true 
    });

    toast.error("Security verification failed. Please try again.", {
      description: "You can retry the submission using the button below.",
      duration: 8000,
    });
  };

  // Handle retry button click
  const handleRetry = () => {
    if (retryCount >= 3) {
      toast.error("Maximum retry attempts reached. Please refresh the page and try again.", {
        duration: 5000,
      });
      return;
    }

    // Prevent retry if already submitting
    if (isSubmitting || isPending || shouldTriggerRecaptcha) {
      console.warn("[CONTACT_US_FORM] Already submitting, ignoring retry");
      return;
    }

    setLastError(null);
    setRecaptchaError(null);
    setRecaptchaToken("");
    setIsRetryAttempt(true); // Mark this as a retry attempt
    setIsSubmitting(true); // Mark as submitting to prevent duplicates
    
    // Trigger new reCAPTCHA verification
    setShouldTriggerRecaptcha(true);
    
    console.log("[CONTACT_US_FORM] Retry initiated", {
      retryCount: retryCount + 1,
      timestamp: new Date().toISOString(),
    });
  };

  if (!isClient) return <Spinner />;

  return (
    <div className="w-full flex justify-center pt-10 pb-10">
      <FormProvider {...form}>
        <Card className="max-w-2xl w-full mx-auto shadow-lg p-8 rounded-lg bg-purple-50">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Contact Us</CardTitle>
              <CardDescription className="text-gray-500">
                Please fill in the information below
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Name" {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="your@email.com" type="email" {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Reason.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
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
                name="helpDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How can we help you?</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Type your message here..." {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Security Verification - Invisible reCAPTCHA v3 */}
              <div className="hidden">
                <ReCaptcha
                  action="contact_form"
                  onVerify={handleRecaptchaSuccess}
                  onError={handleRecaptchaError}
                  trigger={shouldTriggerRecaptcha}
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-3">
              <div className="flex gap-3 w-full">
                <div className="flex-1">
                  <Submitbutton 
                    title={isPending ? "Submitting..." : "Submit"} 
                    isPending={isPending || shouldTriggerRecaptcha || isSubmitting} 
                  />
                </div>
                {lastError?.retryable && retryCount < 3 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRetry}
                    disabled={isPending || shouldTriggerRecaptcha || isSubmitting}
                    className="flex-1"
                  >
                    {isPending || shouldTriggerRecaptcha ? "Retrying..." : `Retry (${retryCount}/3)`}
                  </Button>
                )}
              </div>
              {lastError && !lastError.retryable && (
                <p className="text-sm text-muted-foreground text-center">
                  Please fix the errors above and try again.
                </p>
              )}
            </CardFooter>
          </form>
        </Card>
      </FormProvider>
    </div>
  );
};

export default ContactUsFormContent;