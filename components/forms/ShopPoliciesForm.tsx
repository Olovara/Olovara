"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Submitbutton } from "@/components/SubmitButtons";
import { useState, useEffect } from "react";
import { useIsClient } from "@/hooks/use-is-client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Spinner from "@/components/spinner";
import { ShopPoliciesSchema } from "@/schemas/ShopPoliciesSchema";
import { updateShopPolicies, getShopPolicies } from "@/actions/shopPoliciesActions";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ShopPoliciesForm = () => {
  const isClient = useIsClient();
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isPending, setIsPending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<z.infer<typeof ShopPoliciesSchema>>({
    resolver: zodResolver(ShopPoliciesSchema),
    defaultValues: {
      processingTime: "",
      returnsPolicy: "",
      exchangesPolicy: "",
      damagesPolicy: "",
      nonReturnableItems: "",
      refundPolicy: "",
      careInstructions: "",
    },
  });

  useEffect(() => {
    const fetchShopPolicies = async () => {
      try {
        const result = await getShopPolicies();
        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          // Type assertion since the database fields will be added later
          const data = result.data as any;
          const formData = {
            processingTime: data.processingTime || "",
            returnsPolicy: data.returnsPolicy || "",
            exchangesPolicy: data.exchangesPolicy || "",
            damagesPolicy: data.damagesPolicy || "",
            nonReturnableItems: data.nonReturnableItems || "",
            refundPolicy: data.refundPolicy || "",
            careInstructions: data.careInstructions || "",
          };
          form.reset(formData);
        }
      } catch (error) {
        setError("Failed to load shop policies");
      } finally {
        setIsLoading(false);
      }
    };

    fetchShopPolicies();
  }, [form]);

  const onSubmit = async (values: z.infer<typeof ShopPoliciesSchema>) => {
    try {
      setIsPending(true);
      setError("");
      setSuccess("");

      const result = await updateShopPolicies(values);

      if (result.error) {
        toast.error(result.error);
        throw new Error(result.error);
      }

      toast.success(result.success || "Successfully saved your shop policies.");
    } catch (error) {
      console.error("Error submitting form:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save shop policies";
      toast.error(errorMessage);
    } finally {
      setIsPending(false);
    }
  };

  if (!isClient || isLoading) return <Spinner />;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <CardHeader>
        <CardTitle>Shop Policies</CardTitle>
        <CardDescription>
          Set your shop policies to inform customers about your business practices
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-6">
        
        {/* Processing Time */}
        <div className="flex flex-col gap-y-2">
          <Label>Processing Time</Label>
          <Select
            onValueChange={(value) => form.setValue("processingTime", value)}
            defaultValue={form.watch("processingTime")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select processing time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Same day">Same day</SelectItem>
              <SelectItem value="1-2 business days">1-2 business days</SelectItem>
              <SelectItem value="3-5 business days">3-5 business days</SelectItem>
              <SelectItem value="1 week">1 week</SelectItem>
              <SelectItem value="1-2 weeks">1-2 weeks</SelectItem>
              <SelectItem value="2-3 weeks">2-3 weeks</SelectItem>
              <SelectItem value="3-4 weeks">3-4 weeks</SelectItem>
              <SelectItem value="Made to order">Made to order</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            How long it takes to process and ship orders
          </p>
        </div>

        {/* Returns Policy */}
        <div className="flex flex-col gap-y-2">
          <Label>Returns Policy</Label>
          <Textarea
            placeholder="Describe your returns policy (e.g., 30-day returns, buyer pays return shipping, etc.)"
            {...form.register("returnsPolicy")}
            disabled={isPending}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Explain your return policy, timeframes, and conditions
          </p>
        </div>

        {/* Exchanges Policy */}
        <div className="flex flex-col gap-y-2">
          <Label>Exchanges Policy</Label>
          <Textarea
            placeholder="Describe your exchanges policy (e.g., size exchanges, color changes, etc.)"
            {...form.register("exchangesPolicy")}
            disabled={isPending}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Explain your exchange policy and what items can be exchanged
          </p>
        </div>

        {/* Damages Policy */}
        <div className="flex flex-col gap-y-2">
          <Label>Damages & Issues Policy</Label>
          <Textarea
            placeholder="Describe how you handle damaged items or quality issues"
            {...form.register("damagesPolicy")}
            disabled={isPending}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Explain how you handle damaged items, defects, or quality issues
          </p>
        </div>

        {/* Non-Returnable Items */}
        <div className="flex flex-col gap-y-2">
          <Label>Exceptions & Non-Returnable Items</Label>
          <Textarea
            placeholder="List items that cannot be returned (e.g., custom orders, digital items, etc.)"
            {...form.register("nonReturnableItems")}
            disabled={isPending}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Specify items that cannot be returned or exchanged
          </p>
        </div>

        {/* Refund Policy */}
        <div className="flex flex-col gap-y-2">
          <Label>Refund Policy</Label>
          <Textarea
            placeholder="Describe your refund policy (e.g., full refunds, partial refunds, store credit, etc.)"
            {...form.register("refundPolicy")}
            disabled={isPending}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Explain your refund process, timeframes, and methods
          </p>
        </div>

        {/* Care Instructions */}
        <div className="flex flex-col gap-y-2">
          <Label>Care Instructions</Label>
          <Textarea
            placeholder="Provide care and maintenance instructions for your products (e.g., washing instructions, storage tips, cleaning methods, etc.)"
            {...form.register("careInstructions")}
            disabled={isPending}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Help customers maintain and care for your products properly
          </p>
        </div>

        <Submitbutton title="Save Policies" isPending={isPending} />
      </CardContent>
    </form>
  );
};

export default ShopPoliciesForm; 