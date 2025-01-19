"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { toast } from "sonner";
import { ProductSchema } from "@/schemas/ProductSchema";
import { QuillEditor } from "../QuillEditor";
import { useState } from "react";
import { UploadDropzone } from "@/lib/uploadthing";

type ProductFormValues = z.infer<typeof ProductSchema>;

export function ProductForm() {
  const [descriptionJson, setDescriptionJson] = useState<any>({ ops: [] }); // Default to empty Delta JSON
  const [images, setImages] = useState<null | string[]>(null);
  const [productFile, SetProductFile] = useState<null | string>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Description JSON:", descriptionJson);
    // Send `descriptionJson` to your backend or Prisma schema
  };
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
          <Label className="block text-sm font-medium">
            Product Description
          </Label>
          <QuillEditor json={descriptionJson} setJson={setDescriptionJson} />
        </div>

        <div className="flex flex-col gap-y-2">
          <Label>Price</Label>
          <Input
            type="number"
            placeholder="Price"
            {...form.register("price", { valueAsNumber: true })}
          />
        </div>

        {/* For images upload */}
        <div className="flex flex-col gap-y-2">
          <input type="hidden" name="images" value={JSON.stringify(images)} />
          <Label>Product Images</Label>
          <UploadDropzone
            endpoint="imageUploader"
            onClientUploadComplete={(res) => {
              const urls = res.map((item) => item.url);
              setImages(urls);
              form.setValue("images", urls); // Sync with form state
            }}
            onUploadError={(error: Error) => {
              toast.error("Something went wrong, try again");
            }}
          />
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

        {/* For digital product file upload */}
        {form.watch("isDigital") && (
          <div className="flex flex-col gap-y-2">
            <input type="hidden" name="productFile" value={productFile ?? ""} />
            <Label>Product File</Label>
            <UploadDropzone
              onClientUploadComplete={(res) => {
                SetProductFile(res[0].url);
                toast.success("Your Product file has been uploaded!");
              }}
              endpoint="productFileUpload"
              onUploadError={(error: Error) => {
                toast.error("Something went wrong, try again");
              }}
            />
          </div>
        )}

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
