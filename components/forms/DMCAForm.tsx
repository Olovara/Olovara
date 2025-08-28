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
import { DMCASchema } from "@/schemas/DMCASchema";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import Spinner from "@/components/spinner";
import { submitDMCAComplaint } from "@/actions/dmca-complaint";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { ReCaptcha } from "@/components/ui/recaptcha";
import { toast } from "sonner";
import { validateHoneypot } from "@/lib/recaptcha";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, FileText, X } from "lucide-react";
import { UploadButton } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";

const DMCAFormContent = () => {
  const isClient = useIsClient();
  const [isPending, startTransition] = useTransition();
  const [recaptchaToken, setRecaptchaToken] = useState<string>("");
  const [shouldTriggerRecaptcha, setShouldTriggerRecaptcha] = useState(false);
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);
  const [copyrightDocumentUrl, setCopyrightDocumentUrl] = useState<string>("");

  const form = useForm<z.infer<typeof DMCASchema>>({
    resolver: zodResolver(DMCASchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      productLink: "",
      infringingStatement: "",
      legalAgreement: false,
      website: "", // Honeypot field
    },
  });

  const onSubmit = async (values: z.infer<typeof DMCASchema>) => {
    if (!validateHoneypot(values.website)) {
      console.log("Bot detected via honeypot field");
      return;
    }

    setShouldTriggerRecaptcha(true);
    setRecaptchaError(null);
  };

  const handleRecaptchaSuccess = (token: string) => {
    setRecaptchaToken(token);
    setShouldTriggerRecaptcha(false);

    startTransition(async () => {
      const result = await submitDMCAComplaint({
        ...form.getValues(),
        recaptchaToken: token,
      });

      if (result?.error) {
        toast.error(result.error);
      } else if (result?.success) {
        toast.success(result.success);
        form.reset();
        setCopyrightDocumentUrl("");
      }
    });
  };

  const handleRecaptchaError = (error: string) => {
    setRecaptchaError(error);
    setShouldTriggerRecaptcha(false);
    toast.error("Security verification failed. Please try again.");
  };

  const handleFileUploadComplete = (res: any) => {
    if (res && res[0]) {
      setCopyrightDocumentUrl(res[0].url);
      form.setValue("copyrightDocumentUrl", res[0].url);
      toast.success("Document uploaded successfully!");
    }
  };

  const handleFileUploadError = (error: Error) => {
    toast.error("Failed to upload document. Please try again.");
    console.error("Upload error:", error);
  };

  const removeFile = () => {
    setCopyrightDocumentUrl("");
    form.setValue("copyrightDocumentUrl", "");
  };

  if (!isClient) return <Spinner />;

  return (
    <div className="w-full flex justify-center pt-10 pb-10">
      <FormProvider {...form}>
        <Card className="max-w-2xl w-full mx-auto shadow-lg p-8 rounded-lg bg-red-50">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-red-800">
                DMCA Takedown Notice
              </CardTitle>
              <CardDescription className="text-gray-600">
                Submit a formal copyright infringement complaint. Please ensure
                all information is accurate and complete.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Honeypot field */}
              <div className="hidden">
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input {...form.register("website")} />
                  </FormControl>
                </FormItem>
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-red-700">
                  Contact Information
                </h3>

                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Your full name"
                      {...form.register("name")}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>

                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="your@email.com"
                      {...form.register("email")}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>

                <FormItem>
                  <FormLabel>Phone Number (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+1 (555) 123-4567"
                      {...form.register("phoneNumber")}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </div>

              {/* Product Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-red-700">
                  Infringing Product Details
                </h3>

                <FormItem>
                  <FormLabel>Link to Infringing Product *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/product/123"
                      {...form.register("productLink")}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>

                <FormItem>
                  <FormLabel>Statement About Infringing Product *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide a detailed statement about how this product infringes on your copyright or intellectual property rights..."
                      {...form.register("infringingStatement")}
                      disabled={isPending}
                      rows={6}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </div>

              {/* File Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-red-700">
                  Copyright Document
                </h3>

                <FormItem>
                  <FormLabel>
                    Upload Copyright Document with Signature *
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      {copyrightDocumentUrl ? (
                        <div className="flex items-center justify-between p-4 border border-green-200 rounded-lg bg-green-50">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-green-600" />
                            <span className="text-sm text-green-800">
                              Document uploaded successfully
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={removeFile}
                            disabled={isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-400 transition-colors">
                          <UploadButton
                            endpoint="dmcaDocumentUpload"
                            onClientUploadComplete={handleFileUploadComplete}
                            onUploadError={handleFileUploadError}
                            className="w-full"
                            appearance={{
                              button:
                                "bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium",
                              allowedContent: "hidden",
                              container: "w-full",
                            }}
                          />
                          <div className="text-sm text-gray-600 mt-2">
                            <p className="text-xs">
                              PDF, DOC, DOCX, JPG, PNG (max 8MB)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </div>

              {/* Legal Agreement */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-red-700">
                  Legal Agreement
                </h3>

                <FormField
                  control={form.control}
                  name="legalAgreement"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isPending}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal">
                          I agree under penalty of perjury, that the information
                          in this notice is accurate, and that I am the
                          copyright or intellectual property owner or authorized
                          to act on the copyright or intellectual property
                          owner&apos;s behalf.
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Security Verification */}
              <div className="hidden">
                <ReCaptcha
                  action="dmca_form"
                  onVerify={handleRecaptchaSuccess}
                  onError={handleRecaptchaError}
                  trigger={shouldTriggerRecaptcha}
                />
              </div>
            </CardContent>

            <CardFooter>
              <Submitbutton
                title={isPending ? "Submitting..." : "Submit DMCA Complaint"}
                isPending={isPending || shouldTriggerRecaptcha}
              />
            </CardFooter>
          </form>
        </Card>
      </FormProvider>
    </div>
  );
};

export default DMCAFormContent;
