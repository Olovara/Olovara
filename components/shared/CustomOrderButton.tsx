"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, FileText, LogIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getPublicCustomOrderForm, submitCustomOrderForm } from "@/actions/customOrderFormActions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface CustomOrderButtonProps {
  sellerId: string;
  sellerName: string;
  acceptsCustom: boolean;
}

export default function CustomOrderButton({ 
  sellerId, 
  sellerName, 
  acceptsCustom 
}: CustomOrderButtonProps) {
  const { data: session, status } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [submissionData, setSubmissionData] = useState({
    customerEmail: session?.user?.email || "",
    customerName: session?.user?.name || "",
    responses: [] as Array<{ fieldId: string; value: string }>,
  });
  const router = useRouter();

  const handleCustomOrderClick = async () => {
    if (!acceptsCustom) {
      toast.error("This seller doesn't accept custom orders");
      return;
    }

    // Check if user is authenticated
    if (status === "loading") {
      return; // Still loading session
    }

    if (!session?.user) {
      toast.error("Please sign in to submit a custom order request");
      return;
    }

    setIsLoading(true);
    try {
      // Get the seller's custom order form
      const result = await getPublicCustomOrderForm(sellerId);
      if (result.error) {
        toast.error("No custom order form available");
        return;
      }
      
      setFormData(result.data);
      setIsModalOpen(true);
    } catch (error) {
      toast.error("Failed to load custom order form");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.email) {
      toast.error("Please sign in to submit a custom order request");
      return;
    }

    // Validate required fields
    const requiredFields = formData.fields.filter((field: any) => field.required);
    for (const field of requiredFields) {
      const response = submissionData.responses.find(r => r.fieldId === field.id);
      if (!response || !response.value.trim()) {
        toast.error(`Please fill in the required field: ${field.label}`);
        return;
      }
    }

    setIsLoading(true);
    try {
      const result = await submitCustomOrderForm({
        formId: formData.id,
        customerEmail: session.user.email,
        customerName: session.user.name || "",
        responses: submissionData.responses,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Custom order request submitted successfully!");
        setIsModalOpen(false);
        setSubmissionData({
          customerEmail: "",
          customerName: "",
          responses: [],
        });
      }
    } catch (error) {
      toast.error("Failed to submit custom order request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    setSubmissionData(prev => {
      const existingIndex = prev.responses.findIndex(r => r.fieldId === fieldId);
      if (existingIndex >= 0) {
        const newResponses = [...prev.responses];
        newResponses[existingIndex] = { fieldId, value };
        return { ...prev, responses: newResponses };
      } else {
        return {
          ...prev,
          responses: [...prev.responses, { fieldId, value }],
        };
      }
    });
  };

  if (!acceptsCustom) {
    return null;
  }

  // Show sign in prompt if not authenticated
  if (status === "unauthenticated") {
    return (
      <Button
        asChild
        variant="outline"
        className="flex items-center gap-2"
      >
        <Link href="/login">
          <LogIn className="h-4 w-4" />
          Sign In for Custom Orders
        </Link>
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={handleCustomOrderClick}
        disabled={isLoading || status === "loading"}
        variant="outline"
        className="flex items-center gap-2"
      >
        <FileText className="h-4 w-4" />
        Custom Order
        <Badge variant="secondary" className="ml-1">
          New
        </Badge>
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Custom Order Request</DialogTitle>
            <DialogDescription>
              Fill out the form below to request a custom order from {sellerName}
            </DialogDescription>
          </DialogHeader>

          {formData && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Your Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Name</label>
                      <p className="text-sm font-medium">{session?.user?.name || "Not provided"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-sm font-medium">{session?.user?.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">{formData.title}</h3>
                {formData.description && (
                  <p className="text-sm text-gray-600">{formData.description}</p>
                )}

                {formData.fields.map((field: any) => (
                  <div key={field.id} className="space-y-2">
                    <label className="text-sm font-medium">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>

                    {field.type === "text" && (
                      <input
                        type="text"
                        value={submissionData.responses.find(r => r.fieldId === field.id)?.value || ""}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={field.placeholder || ""}
                        required={field.required}
                      />
                    )}

                    {field.type === "textarea" && (
                      <textarea
                        value={submissionData.responses.find(r => r.fieldId === field.id)?.value || ""}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={field.placeholder || ""}
                        rows={4}
                        required={field.required}
                      />
                    )}

                    {field.type === "number" && (
                      <input
                        type="number"
                        value={submissionData.responses.find(r => r.fieldId === field.id)?.value || ""}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={field.placeholder || ""}
                        required={field.required}
                      />
                    )}

                    {field.type === "email" && (
                      <input
                        type="email"
                        value={submissionData.responses.find(r => r.fieldId === field.id)?.value || ""}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={field.placeholder || ""}
                        required={field.required}
                      />
                    )}

                    {field.type === "phone" && (
                      <input
                        type="tel"
                        value={submissionData.responses.find(r => r.fieldId === field.id)?.value || ""}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={field.placeholder || ""}
                        required={field.required}
                      />
                    )}

                    {field.type === "select" && (
                      <select
                        value={submissionData.responses.find(r => r.fieldId === field.id)?.value || ""}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required={field.required}
                      >
                        <option value="">{field.placeholder || "Select an option..."}</option>
                        {field.options.map((option: string, index: number) => (
                          <option key={index} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}

                    {field.type === "multiselect" && (
                      <div className="space-y-2">
                        {field.options.map((option: string, index: number) => (
                          <label key={index} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={submissionData.responses.find(r => r.fieldId === field.id)?.value.includes(option) || false}
                              onChange={(e) => {
                                const currentValue = submissionData.responses.find(r => r.fieldId === field.id)?.value || "";
                                const values = currentValue ? currentValue.split(", ") : [];
                                if (e.target.checked) {
                                  values.push(option);
                                } else {
                                  const index = values.indexOf(option);
                                  if (index > -1) values.splice(index, 1);
                                }
                                handleFieldChange(field.id, values.join(", "));
                              }}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {field.type === "date" && (
                      <input
                        type="date"
                        value={submissionData.responses.find(r => r.fieldId === field.id)?.value || ""}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required={field.required}
                      />
                    )}

                    {field.type === "boolean" && (
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={submissionData.responses.find(r => r.fieldId === field.id)?.value === "true" || false}
                          onChange={(e) => handleFieldChange(field.id, e.target.checked.toString())}
                          className="rounded border-gray-300"
                          required={field.required}
                        />
                        <span className="text-sm">{field.label}</span>
                      </label>
                    )}

                    {field.helpText && (
                      <p className="text-xs text-gray-500">{field.helpText}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 