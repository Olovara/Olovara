"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";

import { useIsClient } from "@/hooks/use-is-client";
import Spinner from "../spinner";
import { RegisterSchema } from "@/schemas";
import CardWrapper from "./card-wrapper";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { PasswordInput } from "../password-input";
import { Button } from "../ui/button";
import FormError from "../form-error";
import FormSuccess from "../form-success";
import { register } from "@/actions/register";
import { ReCaptcha } from "../ui/recaptcha";
import { validateHoneypot } from "@/lib/recaptcha";

interface RegisterFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

const RegisterForm = ({ onSuccess, redirectTo }: RegisterFormProps) => {
  const isClient = useIsClient();

  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [recaptchaToken, setRecaptchaToken] = useState<string>("");
  const [shouldTriggerRecaptcha, setShouldTriggerRecaptcha] = useState(false);
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      passwordConfirmation: "",
      website: "",
      recaptchaToken: "",
    },
  });

  const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
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
    const finalToken = process.env.NODE_ENV === 'development' ? 'dev-token' : token;

    startTransition(() => {
      register({ ...values, recaptchaToken: finalToken }, redirectTo).then((data) => {
        if (data.success) {
          if (onSuccess) {
            // If onSuccess is provided (modal context), let the modal handle it
            onSuccess?.();
          } else {
            // If no onSuccess (standalone context), show toast and success message
            toast.success("Account created successfully! Please check your email to verify your account.");
            setSuccess(data.success);
          }
        }
        if (data?.error) setError(data.error);
        
        // Reset form and state after the request completes
        form.reset();
        setSuccess("");
        setError("");
        setRecaptchaToken("");
      });
    });
  };

  const handleRecaptchaError = (error: string) => {
    setRecaptchaError(error);
    setShouldTriggerRecaptcha(false);
    setError("Security verification failed. Please try again.");
  };

  if (!isClient) return <Spinner />;

  return (
    <CardWrapper
      backButtonLabel="Have an account already?"
      backButtonHref="/login"
      showSocial
      title="Create an account"
      subtitle="Join our community today"
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      type="text"
                      placeholder="Your Username"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      autoComplete="off"
                      tabIndex={-1}
                      style={{ display: 'none' }}
                    />
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
                    <Input
                      {...field}
                      disabled={isPending}
                      type="email"
                      placeholder="your.email@example.com"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      {...field}
                      disabled={isPending}
                      type="password"
                      placeholder="******"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="passwordConfirmation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm your password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      {...field}
                      disabled={isPending}
                      type="password"
                      placeholder="******"
                    />
                  </FormControl>
                  <FormMessage />
                  <Button
                    size="sm"
                    variant="link"
                    asChild
                    className="px-0 text-muted-foreground"
                  >
                    <Link href="/reset-password">Forgot your password?</Link>
                  </Button>
                </FormItem>
              )}
            />
          </div>
          {error && <FormError message={error} />}
          {success && <FormSuccess message={success} />}
          <ReCaptcha
            action="register"
            onVerify={handleRecaptchaSuccess}
            onError={handleRecaptchaError}
            trigger={shouldTriggerRecaptcha}
          />
          <Button
            type="submit"
            disabled={isPending || shouldTriggerRecaptcha}
            className="w-full hover:bg-purple-400"
          >
            {isPending || shouldTriggerRecaptcha ? "Processing..." : "Register"}
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
};

export default RegisterForm;