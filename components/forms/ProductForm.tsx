"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { toast } from "sonner";
import { ProductSchema } from "@/schemas/ProductSchema";

type ProductFormValues = z.infer<typeof ProductSchema>;

export function ProductForm() {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      isDigital: false,
    },
  });

  const onSubmit = (data: ProductFormValues) => {
    toast({
      title: "Product Created Successfully!",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-col gap-y-2">
          <Label>Product Name</Label>
          <Input placeholder="Product name" {...form.register("name")} />
        </div>

        <div className="flex flex-col gap-y-2">
          <Label>Description</Label>
          <Textarea placeholder="Product description" {...form.register("description")} />
        </div>

        <div className="flex flex-col gap-y-2">
          <Label>Price</Label>
          <Input type="number" placeholder="Price" {...form.register("price", { valueAsNumber: true })} />
        </div>

        <FormField
          control={form.control}
          name="isDigital"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(value) => field.onChange(value)}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Is this product digital?</FormLabel>
              </div>
            </FormItem>
          )}
        />

        {/* Conditional Fields */}
        {!form.watch("isDigital") && (
          <>
            <div className="flex flex-col gap-y-2">
              <Label>Shipping Cost</Label>
              <Input
                type="number"
                placeholder="Shipping cost"
                {...form.register("shippingCost", { valueAsNumber: true })}
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <Label>Stock</Label>
              <Input
                type="number"
                placeholder="Stock quantity"
                {...form.register("stock", { valueAsNumber: true })}
              />
            </div>
          </>
        )}

        {form.watch("isDigital") && (
          <div className="flex flex-col gap-y-2">
            <Label>Product File URL</Label>
            <Input
              type="url"
              placeholder="URL to the product file"
              {...form.register("productFile")}
            />
          </div>
        )}

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}