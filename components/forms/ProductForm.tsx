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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ProductSchema } from "@/schemas/ProductSchema";
import { QuillEditor } from "../QuillEditor";
import { startTransition, useState, useTransition } from "react";
import { UploadDropzone } from "@/lib/uploadthing";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Submitbutton } from "../SubmitButtons";
import { useIsClient } from "@/hooks/use-is-client";
import Spinner from "../spinner";

type ProductFormValues = z.infer<typeof ProductSchema>;

export function ProductForm() {
  const [descriptionJson, setDescriptionJson] = useState<any>({ ops: [] }); // Default to empty Delta JSON
  const [images, setImages] = useState<null | string[]>(null);
  const [productFile, SetProductFile] = useState<null | string>(null);
  const isClient = useIsClient();
  
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  
  const [isPending, startTransition] = useTransition();

  const PrimaryCategories = [
    { id: "ACCESORIES", name: "Accessories" },
    { id: "CLOTHING", name: "Clothing" },
    { id: "CRAFT_SUPPLIES", name: "Craft Supplies" },
    { id: "PATTERNS", name: "Patterns" },
    { id: "TOYS", name: "Toys" },
  ];

  const SecondaryCategories = [
    { id: "AMIGURUMI", name: "Amigurumi" },
    { id: "CROCHET", name: "Crochet" },
    { id: "KINTTING", name: "Knitting" },
    { id: "SEWING", name: "Sewing" },
    { id: "TUNISIAN", name: "Tunisian" },
  ];

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      isDigital: false,
      primaryCategory: "", // Add this to match schema
    },
  });

  const onSubmit = async (values: z.infer<typeof ProductSchema>) => {
    const productData = {
      ...values,
      description: descriptionJson,  // Add the Quill description as part of the data
    };
  
    startTransition(() => {
      fetch("/api/products", {  // Use the correct API route
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),  // Send the form data as JSON
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            setSuccess(data.success);
            form.reset(); // Reset form after successful submission
            setDescriptionJson({ ops: [] }); // Reset Quill editor state
          } else if (data.error) {
            setError(data.error);
          }
        })
        .catch((error) => {
          setError("Something went wrong. Please try again.");
          console.error("Error creating product:", error);
        });
    });
  
    setSuccess("");
    setError("");
  };  

  if (!isClient) return <Spinner />;

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

        {/* Select Primary Category */}
        <FormField
          control={form.control}
          name="primaryCategory"
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
                  {PrimaryCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="secondaryCategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Secondary Categories</FormLabel>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full">
                    {field.value && field.value.length > 0
                      ? `Selected: ${field.value.length} categories`
                      : "Select categories"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-60 overflow-y-auto">
                  {SecondaryCategories.map((category) => (
                    <DropdownMenuCheckboxItem
                      key={category.id}
                      checked={field.value?.includes(category.id)}
                      onCheckedChange={(checked) => {
                        const current = field.value || [];
                        if (checked) {
                          field.onChange([...current, category.id]); // Add category
                        } else {
                          field.onChange(
                            current.filter((c) => c !== category.id)
                          ); // Remove category
                        }
                      }}
                    >
                      {category.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </FormItem>
          )}
        />

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

        <Submitbutton title="Submit" />
      </form>
    </Form>
  );
}
