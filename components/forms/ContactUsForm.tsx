"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
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
import { useForm } from "react-hook-form";
import Spinner from "@/components/spinner";
import { contactUs } from "@/actions/contact-us";
import { Textarea } from "@/components/ui/textarea";
import { FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const ContactUsForm = () => {
  const isClient = useIsClient();

  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const [isPending, startTransition] = useTransition();

  const Reason = [
    { id: "BILLING", name: "Billing Questions" },
    { id: "GENERAL", name: "General Questions" },
    { id: "ACCOUNT", name: "Membership Questions" },
    { id: "SUGGESTION", name: "Feature Request or Suggestion" },
    { id: "TOYS", name: "Toys" },
  ];

  const form = useForm<z.infer<typeof ContactUsSchema>>({
    resolver: zodResolver(ContactUsSchema),
    defaultValues: {
      name: "",
      email: "",
      reason: "",
      helpDescription: "",
    },
  });

  const onSubmit = (values: z.infer<typeof ContactUsSchema>) => {
    startTransition(() => {
      contactUs(values).then((data) => {
        if (data.success) setSuccess(data.success);
        if (data?.error) setError(data.error);
      });
    });

    form.reset();
    setSuccess("");
    setError("");
  };

  if (!isClient) return <Spinner />;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <CardHeader>
        <CardTitle>Contact Us</CardTitle>
        <CardDescription>Please fill in the information below</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-6">
        <div className="flex flex-col gap-y-2">
          <Label>Name</Label>
          <Textarea placeholder="Tell us a little about your crafting process and what you make."
            {...form.register("name")} // Link input to react-hook-form
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-y-2">
          <Label>Email</Label>
          <Input placeholder="www.example.com"
            {...form.register("email")} // Link input to react-hook-form
            disabled={isPending}
            type="text"
          />
        </div>

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Category</FormLabel>
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

        <div className="flex flex-col gap-y-2">
          <Label>How can we help you?</Label>
          <Textarea placeholder="Type your message here."
            {...form.register("helpDescription")} // Link input to react-hook-form
            disabled={isPending}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Submitbutton title="Submit" />
      </CardFooter>
    </form>
  );
};

export default ContactUsForm;