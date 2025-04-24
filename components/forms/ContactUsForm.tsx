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
import { ContactUsSchema } from "@/schemas/ContactUsSchema";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import Spinner from "@/components/spinner";
import { contactUs } from "@/actions/contact-us";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";

const ContactUsFormContent = () => {
  const isClient = useIsClient();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

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
    const token = await executeRecaptcha("contact_form");

    startTransition(() => {
      contactUs({ ...values, recaptchaToken: token }).then((data) => {
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
            </CardContent>
            <CardFooter className="flex justify-end">
              <Submitbutton title="Submit" isPending={isPending} />
            </CardFooter>
          </form>
        </Card>
      </FormProvider>
    </div>
  );
};

const ContactUsForm = () => {
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
      <ContactUsFormContent />
    </GoogleReCaptchaProvider>
  );
};

export default ContactUsForm;