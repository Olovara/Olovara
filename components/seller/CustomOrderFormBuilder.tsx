"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, GripVertical, Trash2, Eye } from "lucide-react";
import { saveCustomOrderForm } from "@/actions/customOrderFormActions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CUSTOM_ORDER_MAX_REFERENCE_IMAGES } from "@/lib/custom-order-reference-config";

/** Radix Select highlights options with data-highlighted on hover / keyboard. */
const FIELD_TYPE_SELECT_ITEM_CLASS =
  "cursor-pointer data-[highlighted]:bg-brand-primary-100 data-[highlighted]:text-brand-dark-neutral-900 focus:bg-brand-primary-100 focus:text-brand-dark-neutral-900";

interface FormField {
  id?: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "multiselect" | "file" | "date" | "boolean";
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options: string[];
  order: number;
  isActive: boolean;
}

interface CustomOrderFormBuilderProps {
  initialData?: any;
  mode: "create" | "edit";
}

export default function CustomOrderFormBuilder({ initialData, mode }: CustomOrderFormBuilderProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    description: "",
    isActive: true,
  });
  const [fields, setFields] = useState<FormField[]>([]);

  // Initialize form data when editing
  useEffect(() => {
    if (initialData && mode === "edit") {
      setFormData({
        id: initialData.id,
        title: initialData.title,
        description: initialData.description || "",
        isActive: initialData.isActive,
      });
      setFields(initialData.fields.map((field: any) => ({
        id: field.id,
        label: field.label,
        type: field.type,
        required: field.required,
        placeholder: field.placeholder || "",
        helpText: field.helpText || "",
        options: field.options || [],
        order: field.order,
        isActive: field.isActive,
      })));
    }
  }, [initialData, mode]);

  const addField = () => {
    const newField: FormField = {
      label: "",
      type: "text",
      required: false,
      placeholder: "",
      helpText: "",
      options: [],
      order: fields.length,
      isActive: true,
    };
    setFields([...fields, newField]);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], ...updates };
    setFields(updatedFields);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const addOption = (fieldIndex: number) => {
    const updatedFields = [...fields];
    updatedFields[fieldIndex].options.push("");
    setFields(updatedFields);
  };

  const updateOption = (fieldIndex: number, optionIndex: number, value: string) => {
    const updatedFields = [...fields];
    updatedFields[fieldIndex].options[optionIndex] = value;
    setFields(updatedFields);
  };

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const updatedFields = [...fields];
    updatedFields[fieldIndex].options.splice(optionIndex, 1);
    setFields(updatedFields);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error("Form title is required");
      return;
    }

    if (fields.length === 0) {
      toast.error("At least one field is required");
      return;
    }

    // Validate fields
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      if (!field.label.trim()) {
        toast.error(`Field ${i + 1} label is required`);
        return;
      }
      if (field.type === "select" || field.type === "multiselect") {
        const normalizedOptions = (field.options || [])
          .map((opt) => opt.trim())
          .filter(Boolean);
        if (normalizedOptions.length === 0) {
          toast.error(`Field "${field.label}" needs at least one option`);
          return;
        }
      }
      if ((field.type === "select" || field.type === "multiselect") && field.options.some((opt) => !opt.trim())) {
        toast.error(`Field "${field.label}" has empty options — fill them in or remove them`);
        return;
      }
    }

    setIsPending(true);

    try {
      const result = await saveCustomOrderForm({
        id: formData.id, // Will be undefined for create mode
        title: formData.title,
        description: formData.description,
        isActive: formData.isActive,
        fields: fields.map((field, index) => ({
          ...field,
          order: index,
          options:
            field.type === "select" || field.type === "multiselect"
              ? (field.options || []).map((opt) => opt.trim()).filter(Boolean)
              : [],
        })),
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(mode === "create" ? "Form created successfully!" : "Form updated successfully!");
        router.push("/seller/dashboard/custom-orders");
      }
    } catch (error) {
      toast.error(`Failed to ${mode} form`);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form Builder */}
      <div className="space-y-6">
        <Card className="border-brand-dark-neutral-200 bg-brand-light-neutral-100">
          <CardHeader>
            <CardTitle>{mode === "create" ? "Create New Form" : "Edit Form"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Form Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Custom Jewelry Order Form"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of what this form is for..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isActive">Active</Label>
                <p className="text-sm text-muted-foreground">
                  When active, customers can submit this form
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-brand-dark-neutral-200 bg-brand-light-neutral-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Form Fields</CardTitle>
              <Button onClick={addField} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {fields.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No fields added yet</p>
                <p className="text-sm">Click &quot;Add Field&quot; to start building your form</p>
              </div>
            ) : (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <Card
                    key={index}
                    className="border-2 border-brand-dark-neutral-200 bg-brand-light-neutral-50"
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="outline">Field {index + 1}</Badge>
                          <Badge variant={field.isActive ? "default" : "secondary"}>
                            {field.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeField(index)}
                          className="shrink-0 text-muted-foreground hover:bg-brand-primary-700 hover:text-brand-light-neutral-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Field Label *</Label>
                          <Input
                            placeholder="e.g., What type of jewelry do you want?"
                            value={field.label}
                            onChange={(e) => updateField(index, { label: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Field Type *</Label>
                          <Select
                            value={field.type}
                            onValueChange={(value: any) => updateField(index, { type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem className={FIELD_TYPE_SELECT_ITEM_CLASS} value="text">
                                Text
                              </SelectItem>
                              <SelectItem className={FIELD_TYPE_SELECT_ITEM_CLASS} value="textarea">
                                Long Text
                              </SelectItem>
                              <SelectItem className={FIELD_TYPE_SELECT_ITEM_CLASS} value="number">
                                Number
                              </SelectItem>
                              <SelectItem className={FIELD_TYPE_SELECT_ITEM_CLASS} value="select">
                                Dropdown
                              </SelectItem>
                              <SelectItem className={FIELD_TYPE_SELECT_ITEM_CLASS} value="multiselect">
                                Multi-select
                              </SelectItem>
                              <SelectItem className={FIELD_TYPE_SELECT_ITEM_CLASS} value="date">
                                Date
                              </SelectItem>
                              <SelectItem className={FIELD_TYPE_SELECT_ITEM_CLASS} value="boolean">
                                Yes/No
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <Label>Placeholder Text</Label>
                          <Input
                            placeholder="Optional placeholder text"
                            value={field.placeholder}
                            onChange={(e) => updateField(index, { placeholder: e.target.value })}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`required-${index}`}
                            checked={field.required}
                            onCheckedChange={(checked) => updateField(index, { required: checked })}
                          />
                          <Label htmlFor={`required-${index}`}>Required Field</Label>
                        </div>
                      </div>

                      <div className="mt-4">
                        <Label>Help Text</Label>
                        <Textarea
                          placeholder="Optional help text to guide customers"
                          value={field.helpText}
                          onChange={(e) => updateField(index, { helpText: e.target.value })}
                          rows={2}
                        />
                      </div>

                      {(field.type === "select" || field.type === "multiselect") && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <Label>Options *</Label>
                            <Button
                              type="button"
                              variant="outlinePrimary"
                              size="sm"
                              onClick={() => addOption(index)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Option
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {field.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center gap-2">
                                <Input
                                  placeholder={`Option ${optionIndex + 1}`}
                                  value={option}
                                  onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeOption(index, optionIndex)}
                                  className="shrink-0 text-muted-foreground hover:bg-brand-primary-700 hover:text-brand-light-neutral-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 mt-4">
                        <Switch
                          id={`active-${index}`}
                          checked={field.isActive}
                          onCheckedChange={(checked) => updateField(index, { isActive: checked })}
                        />
                        <Label htmlFor={`active-${index}`}>Field Active</Label>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full"
        >
          {isPending ? "Saving..." : mode === "create" ? "Create Form" : "Update Form"}
        </Button>
      </div>

      {/* Live Preview */}
      <div className="space-y-6">
        <Card className="border-brand-dark-neutral-200 bg-brand-light-neutral-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Live Preview</CardTitle>
              <Badge variant="outline">Preview</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The sections below mirror what buyers see before your custom fields. Name, email,
                budget, and optional reference images are always on the request form, you do not add
                them as custom form fields.
              </p>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-medium">Your Information</h3>
                  <Badge variant="secondary" className="font-normal">
                    Always included
                  </Badge>
                </div>
                <div className="rounded-lg border border-brand-light-neutral-200 bg-brand-light-neutral-100 p-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input placeholder="Your name" disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Email
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input type="email" placeholder="you@example.com" disabled />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-medium">Your budget</h3>
                  <Badge variant="secondary" className="font-normal">
                    Always included
                  </Badge>
                </div>
                <div className="rounded-lg border border-brand-light-neutral-200 bg-brand-light-neutral-100 p-4 space-y-3">
                  <div className="space-y-2">
                    <Label>
                      How much are you planning to spend?{" "}
                      <span className="text-red-500">*</span>
                      <span className="ml-1 font-normal text-muted-foreground">
                        (customer&apos;s currency)
                      </span>
                    </Label>
                    <Input
                      type="number"
                      placeholder="Amount"
                      disabled
                      inputMode="decimal"
                    />
                    <p className="text-xs text-muted-foreground">
                      If you set a minimum in shop settings, the live form may show that hint here.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="preview-budget-flexible" disabled checked={false} />
                    <Label
                      htmlFor="preview-budget-flexible"
                      className="text-sm font-normal leading-snug"
                    >
                      I&apos;m flexible on budget if the project needs it
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-medium">Reference images</h3>
                  <Badge variant="secondary" className="font-normal">
                    Optional · always on form
                  </Badge>
                </div>
                <div className="rounded-lg border border-dashed border-brand-light-neutral-200 bg-brand-light-neutral-100 p-4 text-center text-sm text-muted-foreground">
                  Buyers may upload up to {CUSTOM_ORDER_MAX_REFERENCE_IMAGES} images (style, color,
                  inspiration). Field is optional.
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t border-brand-dark-neutral-200">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold">{formData.title || "Form Title"}</h3>
                  <Badge variant="outline" className="font-normal">
                    Your form fields
                  </Badge>
                </div>
                {formData.description && (
                  <p className="text-muted-foreground">{formData.description}</p>
                )}

              {fields.filter(f => f.isActive).map((field, index) => (
                <div key={index} className="space-y-2">
                  <Label>
                    {field.label || "Field Label"}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  
                  {field.type === "text" && (
                    <Input placeholder={field.placeholder || "Enter text..."} disabled />
                  )}
                  
                  {field.type === "textarea" && (
                    <Textarea placeholder={field.placeholder || "Enter text..."} disabled />
                  )}
                  
                  {field.type === "number" && (
                    <Input type="number" placeholder={field.placeholder || "Enter number..."} disabled />
                  )}
                  
                  {field.type === "select" && (
                    <Select disabled>
                      <SelectTrigger>
                        <SelectValue placeholder={field.placeholder || "Select an option..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map((option, optionIndex) => (
                          <SelectItem
                            key={optionIndex}
                            value={option.trim() ? option : `option-${optionIndex}`}
                          >
                            {option || `Option ${optionIndex + 1}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {field.type === "multiselect" && (
                    <div className="space-y-2">
                      {field.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2">
                          <input type="checkbox" disabled />
                          <Label className="text-sm">{option || `Option ${optionIndex + 1}`}</Label>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {field.type === "date" && (
                    <Input type="date" disabled />
                  )}
                  
                  {field.type === "boolean" && (
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" disabled />
                      <Label className="text-sm">Yes</Label>
                    </div>
                  )}
                  
                  {field.helpText && (
                    <p className="text-sm text-muted-foreground">{field.helpText}</p>
                  )}
                </div>
              ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 