"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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

interface FormField {
  id?: string;
  label: string;
  type: "text" | "textarea" | "number" | "email" | "phone" | "select" | "multiselect" | "file" | "date" | "boolean";
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options: string[];
  order: number;
  isActive: boolean;
}

export default function CustomOrderFormBuilder() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    isActive: true,
  });
  const [fields, setFields] = useState<FormField[]>([]);

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
        toast.success("Form created successfully!");
        router.push("/seller/dashboard/custom-orders");
      }
    } catch (error) {
      toast.error("Failed to create form");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form Builder */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Form Details</CardTitle>
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

        <Card>
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
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline">Field {index + 1}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeField(index)}
                        className="ml-auto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Field Label *</Label>
                        <Input
                          placeholder="e.g., Product Type"
                          value={field.label}
                          onChange={(e) => updateField(index, { label: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Field Type</Label>
                        <Select
                          value={field.type}
                          onValueChange={(value: FormField["type"]) => updateField(index, { type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="textarea">Long Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Phone</SelectItem>
                            <SelectItem value="select">Dropdown</SelectItem>
                            <SelectItem value="multiselect">Multiple Choice</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="boolean">Yes/No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Placeholder</Label>
                        <Input
                          placeholder="Optional placeholder text"
                          value={field.placeholder || ""}
                          onChange={(e) => updateField(index, { placeholder: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`required-${index}`}
                          checked={field.required}
                          onCheckedChange={(checked) => updateField(index, { required: checked })}
                        />
                        <Label htmlFor={`required-${index}`}>Required</Label>
                      </div>
                    </div>

                    <div>
                      <Label>Help Text</Label>
                      <Input
                        placeholder="Optional help text for this field"
                        value={field.helpText || ""}
                        onChange={(e) => updateField(index, { helpText: e.target.value })}
                      />
                    </div>

                    {(field.type === "select" || field.type === "multiselect") && (
                      <div>
                        <Label>Options</Label>
                        <div className="space-y-2">
                          {field.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex gap-2">
                              <Input
                                placeholder={`Option ${optionIndex + 1}`}
                                value={option}
                                onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeOption(index, optionIndex)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addOption(index)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Option
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Button onClick={handleSubmit} disabled={isPending} className="w-full">
          {isPending ? "Creating..." : "Create Form"}
        </Button>
      </div>

      {/* Preview */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Form Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">{formData.title || "Untitled Form"}</h3>
                {formData.description && (
                  <p className="text-sm text-muted-foreground">{formData.description}</p>
                )}
              </div>

              {fields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Eye className="h-8 w-8 mx-auto mb-2" />
                  <p>Preview will appear here</p>
                  <p className="text-sm">Add fields to see how your form will look</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={index} className="space-y-2">
                      <Label>
                        {field.label || "Untitled Field"}
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
                      
                      {field.type === "email" && (
                        <Input type="email" placeholder={field.placeholder || "Enter email..."} disabled />
                      )}
                      
                      {field.type === "phone" && (
                        <Input type="tel" placeholder={field.placeholder || "Enter phone number..."} disabled />
                      )}
                      
                      {field.type === "select" && (
                        <Select disabled>
                          <SelectTrigger>
                            <SelectValue placeholder={field.placeholder || "Select an option..."} />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options.map((option, optionIndex) => (
                              <SelectItem key={optionIndex} value={option || `option-${optionIndex}`}>
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
                          <Label className="text-sm">{field.label || "Yes/No"}</Label>
                        </div>
                      )}
                      
                      {field.helpText && (
                        <p className="text-xs text-muted-foreground">{field.helpText}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 