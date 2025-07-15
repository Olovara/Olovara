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
import { FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { ReCaptcha } from "@/components/ui/recaptcha";
import { toast } from "sonner";
import { validateHoneypot } from "@/lib/recaptcha";

const ContactUsFormContent = () => {
  const isClient = useIsClient();
  const [isPending, startTransition] = useTransition();
  const [recaptchaToken, setRecaptchaToken] = useState<string>("");
  const [shouldTriggerRecaptcha, setShouldTriggerRecaptcha] = useState(false);
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);

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
      contactUs({ 
        ...values, 
        recaptchaToken: process.env.NODE_ENV === 'development' ? 'dev-token' : token 
      }).then((data) => {
        if (data.success) {
          toast.success("Thank you! Your message has been sent successfully. We'll get back to you soon.");
          form.reset();
          setRecaptchaToken("");
        }
        if (data.error) {
          toast.error(data.error);
        }
      });
    });
  };

  const handleRecaptchaError = (error: string) => {
    setRecaptchaError(error);
    setShouldTriggerRecaptcha(false);
    toast.error("Security verification failed. Please try again.");
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

              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your Name" {...form.register("name")} disabled={isPending} />
                </FormControl>
              </FormItem>

              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="your@email.com" {...form.register("email")} disabled={isPending} />
                </FormControl>
              </FormItem>

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
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>How can we help you?</FormLabel>
                <FormControl>
                  <Textarea placeholder="Type your message here..." {...form.register("helpDescription")} disabled={isPending} />
                </FormControl>
              </FormItem>

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
            
            <CardFooter>
              <Submitbutton 
                title={isPending ? "Submitting..." : "Submit"} 
                isPending={isPending || shouldTriggerRecaptcha} 
              />
            </CardFooter>
          </form>
        </Card>
      </FormProvider>
    </div>
  );
};

export default ContactUsFormContent;