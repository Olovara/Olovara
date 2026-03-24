"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

import { useIsClient } from "@/hooks/use-is-client";
import Spinner from "../spinner";
import { LoginSchema } from "@/schemas";
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
import { login } from "@/actions/login";

interface LoginFormProps {
  onSuccess?: () => void;
}

const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const urlError =
    searchParams.get("error") === "OAuthAccountNotLinked"
      ? "Email already in use with a different provider!"
      : "";

  // Check if this is part of the seller signup flow
  const isSellerSignupFlow = callbackUrl === "/seller-application";

  const [showTwoFactor, setShowTwoFactor] = useState(false);

  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const [isPending, startTransition] = useTransition();

  const isClient = useIsClient();

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
      code: "",
    },
  });

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    startTransition(() => {
      try {
        login(values, callbackUrl).then((data) => {
          if (data?.error) {
            form.reset();
            setError(data.error);
          }

          if (data?.success) {
            form.reset();
            if (isSellerSignupFlow) {
              setSuccess(
                "Signing you in and redirecting to seller application..."
              );
            } else {
              setSuccess(data.success);
            }
            onSuccess?.();

            // Handle redirect client-side after successful login
            if (data.redirectTo) {
              // CRITICAL: Use window.location.href instead of router.push()
              // This forces a full page reload, ensuring:
              // 1. Session cookie is properly sent with the request
              // 2. Middleware can properly validate the session
              // 3. No race condition where session isn't ready yet
              //
              // Small delay to show success message and ensure session cookie is set
              setTimeout(() => {
                // Force full page reload to ensure session cookie is sent
                // This prevents race conditions where middleware doesn't see the session
                window.location.href = data.redirectTo;
              }, 800);
            }
          }

          if (data?.twoFactor) {
            setShowTwoFactor(true);
          }
        });
      } catch (err) {
        setError(`Something went wrong! Error:${err}`);
      } finally {
        setShowTwoFactor(false);
        setSuccess("");
        setError("");
      }
    });
  };

  if (!isClient) return <Spinner />;

  return (
    <CardWrapper
      backButtonLabel="Don't have an account?"
      backButtonHref="/register"
      showSocial
      title={isSellerSignupFlow ? "Sign in to Continue" : "Welcome back"}
      subtitle={
        isSellerSignupFlow
          ? "Complete your seller application"
          : "Sign in to your account"
      }
    >
      {({ headingId }) => (
      <Form {...form}>
        <form
          aria-labelledby={headingId}
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <div className="space-y-4">
            {showTwoFactor && (
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Two Factor Authentication Code</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        autoComplete="one-time-code"
                        inputMode="numeric"
                        disabled={isPending}
                        placeholder="123456"
                        type="text"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {!showTwoFactor && (
              <>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          autoComplete="email"
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
                          autoComplete="current-password"
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
                        className="px-0 text-brand-primary-700 hover:text-brand-primary-600"
                      >
                        <Link href="/reset-password">
                          Forgot your password?
                        </Link>
                      </Button>
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
          {error && <FormError message={error || urlError} />}
          {success && <FormSuccess message={success} />}
          <Button
            type="submit"
            disabled={isPending}
            aria-busy={isPending}
            className="w-full"
          >
            {showTwoFactor ? "Confirm" : "Login"}
          </Button>
        </form>
      </Form>
      )}
    </CardWrapper>
  );
};

export default LoginForm;
