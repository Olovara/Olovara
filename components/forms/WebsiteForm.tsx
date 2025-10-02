"use client";
import React, { useEffect } from "react";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { Website } from "@prisma/client";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

import { Button } from "../ui/button";
import { CreateWebsiteSchema } from "@/types/websiteBuilder";
import { createWebsite, updateWebsite } from "@/lib/queries";
import { v4 } from "uuid";
import { toast } from "../ui/use-toast";
import { useModal } from "@/providers/modal-provider";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import Spinner from "../spinner";

interface CreateWebsiteProps {
  defaultData?: Website;
  sellerId: string;
}

//CHALLENGE: Use favicons

const WebsiteForm: React.FC<CreateWebsiteProps> = ({
  defaultData,
  sellerId,
}) => {
  const { setClose } = useModal();
  const router = useRouter();
  const form = useForm<z.infer<typeof CreateWebsiteSchema>>({
    mode: "onChange",
    resolver: zodResolver(CreateWebsiteSchema),
    defaultValues: {
      name: defaultData?.name || "",
      description: defaultData?.description || "",
      theme: defaultData?.theme || "",
    },
  });

  useEffect(() => {
    if (defaultData) {
      form.reset({
        description: defaultData.description || "",
        name: defaultData.name || "",
        theme: defaultData.theme || "",
      });
    }
  }, [defaultData, form]);

  const isLoading = form.formState.isLoading;

  const onSubmit = async (values: z.infer<typeof CreateWebsiteSchema>) => {
    if (!sellerId) return;

    try {
      let response;
      if (defaultData?.id) {
        // Update existing website
        response = await updateWebsite(defaultData.id, values);
      } else {
        // Create new website
        response = await createWebsite(sellerId, values);
      }

      if (response) {
        toast({
          title: "Success",
          description: "Saved website details",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error!",
          description: "Could not save website details",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Could not save website details",
      });
    }

    setClose();
    router.refresh();
  };
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Website Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              disabled={isLoading}
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Name" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              disabled={isLoading}
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us a little bit more about this website."
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              disabled={isLoading}
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Theme</FormLabel>
                  <FormControl>
                    <Input placeholder="Website theme" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button className="w-20 mt-4" disabled={isLoading} type="submit">
              {form.formState.isSubmitting ? <Spinner /> : "Save"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default WebsiteForm;
