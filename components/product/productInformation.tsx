"use client";

import { useFormContext, UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { QuillEditor } from "../QuillEditor";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "../ui/checkbox";
import { X } from "lucide-react";
import { useState } from "react";

type ProductInfoSectionProps = {
  form: UseFormReturn<any>;
  descriptionJson: any;
  setDescriptionJson: (value: any) => void;
  tags: string[];
  setTags: (tags: string[]) => void;
  materialTags: string[];
  setMaterialTags: (tags: string[]) => void;
};

const CategoriesMap = {
  PRIMARY: [
    { id: "yarn", name: "Yarn" },
    { id: "patterns", name: "Patterns" },
    { id: "tools", name: "Tools" },
  ],
};

const secondaryCategories = [
  { id: "crochet", name: "Crochet" },
  { id: "knitting", name: "Knitting" },
  { id: "supplies", name: "Supplies" },
];

export const ProductInfoSection = ({
  form,
  descriptionJson,
  setDescriptionJson,
  tags,
  setTags,
  materialTags,
  setMaterialTags,
}: ProductInfoSectionProps) => {
  const { register, control, setValue } = useFormContext();

  const [tagInput, setTagInput] = useState("");
  const [materialTagInput, setMaterialTagInput] = useState("");

  // Add tag
  const addTag = () => {
    if (tagInput.trim() !== "" && !tags.includes(tagInput.trim())) {
      const updatedTags = [...tags, tagInput.trim()];
      setTags(updatedTags);
      setValue("tags", updatedTags);
      setTagInput("");
    }
  };

  // Add material tag
  const addMaterialTag = () => {
    if (materialTagInput.trim() && !materialTags.includes(materialTagInput)) {
      const updatedMaterialTags = [...materialTags, materialTagInput.trim()];
      setMaterialTags(updatedMaterialTags);
      setValue("materialTags", updatedMaterialTags);
      setMaterialTagInput("");
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    const updatedTags = tags.filter((tag) => tag !== tagToRemove.toLowerCase());
    setTags(updatedTags);
    setValue("tags", updatedTags);
  };

  // Remove material tag
  const removeMaterialTag = (tagToRemove: string) => {
    const updatedMaterialTags = materialTags.filter(
      (tag) => tag !== tagToRemove.toLowerCase()
    );
    setMaterialTags(updatedMaterialTags);
    setValue("materialTags", updatedMaterialTags);
  };

  return (
    <div className="space-y-6">
      {/* Product Name */}
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <div className="flex flex-col gap-y-2">
            <Label>Product Name</Label>
            <Input
              placeholder="Product name"
              {...register("name", { required: "Product name is required" })}
            />
          </div>
        )}
      />

      {/* Product Description */}
      <div className="flex flex-col gap-y-2">
        <Label>Product Description</Label>
        <QuillEditor json={descriptionJson} setJson={setDescriptionJson} />
      </div>

      {/* Price */}
      <div className="flex flex-col gap-y-2">
        <Label>Price</Label>
        <Input
          type="number"
          placeholder="Price"
          {...register("price", {
            valueAsNumber: true,
            required: "Price is required",
          })}
        />
      </div>

      {/* Primary Category */}
      <FormField
        control={control}
        name="primaryCategory"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Primary Category</FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value || ""}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select primary category" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {CategoriesMap.PRIMARY.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      {/* Secondary Categories */}
      <FormField
        control={control}
        name="secondaryCategory"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Secondary Categories</FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value || ""}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select secondary category" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {secondaryCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      {/* Product Status */}
      <FormField
        control={control}
        name="status"
        render={({ field }) => (
          <RadioGroup
            value={field.value}
            onValueChange={field.onChange}
            className="flex flex-col gap-y-2"
          >
            {["ACTIVE", "DISABLED", "HIDDEN"].map((status) => (
              <FormItem key={status} className="flex items-center space-x-2">
                <FormControl>
                  <RadioGroupItem value={status} id={status.toLowerCase()} />
                </FormControl>
                <Label htmlFor={status.toLowerCase()}>
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </Label>
              </FormItem>
            ))}
          </RadioGroup>
        )}
      />

      {/* Is Product Digital or Physical */}
      <FormField
        control={control}
        name="isDigital"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Is this product digital?</FormLabel>
            </div>
          </FormItem>
        )}
      />

      {/* Product Tags */}
      <div className="flex flex-col gap-y-2">
        <Label>Product Tags</Label>
        <div className="flex space-x-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Enter a tag..."
          />
          <Button onClick={addTag} type="button" disabled={!tagInput.trim()}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag) => (
            <div
              key={tag}
              className="flex items-center px-2 py-1 text-sm bg-gray-100 rounded-full"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Remove tag ${tag}`}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Material Tags */}
      <div className="flex flex-col gap-y-2">
        <Label>Material Tags</Label>
        <div className="flex space-x-2">
          <Input
            value={materialTagInput}
            onChange={(e) => setMaterialTagInput(e.target.value)}
            placeholder="Enter a material tag..."
          />
          <Button
            onClick={addMaterialTag}
            type="button"
            disabled={!materialTagInput.trim()}
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {materialTags.map((tag) => (
            <div
              key={tag}
              className="flex items-center px-2 py-1 text-sm bg-gray-100 rounded-full"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeMaterialTag(tag)}
                aria-label={`Remove material tag ${tag}`}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
