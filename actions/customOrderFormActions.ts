"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { CustomOrderFormSchema, CustomOrderSubmissionSchema, CustomOrderSubmissionStatusSchema } from "@/schemas/CustomOrderFormSchema";
import { revalidatePath } from "next/cache";

// Get all custom order forms for a seller
export async function getCustomOrderForms() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const forms = await db.customOrderForm.findMany({
      where: {
        sellerId: session.user.id,
      },
      include: {
        fields: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { data: forms };
  } catch (error) {
    console.error("Error fetching custom order forms:", error);
    return { error: "Failed to fetch forms" };
  }
}

// Get a specific custom order form
export async function getCustomOrderForm(formId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const form = await db.customOrderForm.findFirst({
      where: {
        id: formId,
        sellerId: session.user.id,
      },
      include: {
        fields: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!form) {
      return { error: "Form not found" };
    }

    return { data: form };
  } catch (error) {
    console.error("Error fetching custom order form:", error);
    return { error: "Failed to fetch form" };
  }
}

// Create or update a custom order form
export async function saveCustomOrderForm(values: any) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const validatedData = CustomOrderFormSchema.parse(values);
    
    // Check form limits (max 5 forms per seller)
    if (!validatedData.id) {
      // Creating new form - check limit
      const existingFormsCount = await db.customOrderForm.count({
        where: { sellerId: session.user.id },
      });
      
      if (existingFormsCount >= 5) {
        return { error: "You can only create up to 5 custom order forms. Please delete an existing form first." };
      }
    }
    
    const result = await db.$transaction(async (tx) => {
      if (validatedData.id) {
        // Update existing form
        const updatedForm = await tx.customOrderForm.update({
          where: {
            id: validatedData.id,
            sellerId: session.user.id,
          },
          data: {
            title: validatedData.title,
            description: validatedData.description,
            isActive: validatedData.isActive,
          },
        });

        // Get existing field IDs to track what's being removed
        const existingFields = await tx.customOrderFormField.findMany({
          where: { formId: validatedData.id },
          select: { id: true },
        });
        const existingFieldIds = existingFields.map(f => f.id);
        const updatedFieldIds: string[] = [];

        // Update or create fields
        for (const field of validatedData.fields) {
          if (field.id) {
            // Update existing field
            await tx.customOrderFormField.update({
              where: { id: field.id },
              data: {
                label: field.label,
                type: field.type,
                required: field.required,
                placeholder: field.placeholder,
                helpText: field.helpText,
                options: field.options,
                validation: field.validation,
                order: field.order,
                isActive: field.isActive,
              },
            });
            updatedFieldIds.push(field.id);
          } else {
            // Create new field
            const newField = await tx.customOrderFormField.create({
              data: {
                formId: validatedData.id,
                label: field.label,
                type: field.type,
                required: field.required,
                placeholder: field.placeholder,
                helpText: field.helpText,
                options: field.options,
                validation: field.validation,
                order: field.order,
                isActive: field.isActive,
              },
            });
            updatedFieldIds.push(newField.id);
          }
        }

        // Remove fields that are no longer in the form
        const fieldsToRemove = existingFieldIds.filter(id => !updatedFieldIds.includes(id));
        if (fieldsToRemove.length > 0) {
          await tx.customOrderFormField.deleteMany({
            where: { id: { in: fieldsToRemove } },
          });
        }

        return updatedForm;
      } else {
        // Create new form
        const newForm = await tx.customOrderForm.create({
          data: {
            sellerId: session.user.id!,
            title: validatedData.title,
            description: validatedData.description,
            isActive: validatedData.isActive,
          },
        });

        // Create fields
        for (const field of validatedData.fields) {
          await tx.customOrderFormField.create({
            data: {
              formId: newForm.id,
              label: field.label,
              type: field.type,
              required: field.required,
              placeholder: field.placeholder,
              helpText: field.helpText,
              options: field.options,
              validation: field.validation,
              order: field.order,
              isActive: field.isActive,
            },
          });
        }

        return newForm;
      }
    });

    revalidatePath("/seller/dashboard/custom-orders");
    return { success: "Form saved successfully", data: result };
  } catch (error) {
    console.error("Error saving custom order form:", error);
    return { error: "Failed to save form" };
  }
}

// Delete a custom order form
export async function deleteCustomOrderForm(formId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    await db.customOrderForm.delete({
      where: {
        id: formId,
        sellerId: session.user.id,
      },
    });

    revalidatePath("/seller/dashboard/custom-orders");
    return { success: "Form deleted successfully" };
  } catch (error) {
    console.error("Error deleting custom order form:", error);
    return { error: "Failed to delete form" };
  }
}

// Get submissions for a form
export async function getCustomOrderSubmissions(formId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const submissions = await db.customOrderSubmission.findMany({
      where: {
        formId,
        form: {
          sellerId: session.user.id,
        },
      },
      include: {
        responses: {
          include: {
            field: true,
          },
        },
        user: {
          select: {
            username: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { data: submissions };
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return { error: "Failed to fetch submissions" };
  }
}

// Update submission status
export async function updateSubmissionStatus(values: any) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const validatedData = CustomOrderSubmissionStatusSchema.parse(values);

    const submission = await db.customOrderSubmission.update({
      where: {
        id: validatedData.submissionId,
        form: {
          sellerId: session.user.id,
        },
      },
      data: {
        status: validatedData.status,
        notes: validatedData.notes,
      },
    });

    revalidatePath("/seller/dashboard/custom-orders");
    return { success: "Status updated successfully", data: submission };
  } catch (error) {
    console.error("Error updating submission status:", error);
    return { error: "Failed to update status" };
  }
}

// Public function to get a form for customers (no auth required)
export async function getPublicCustomOrderForm(sellerId: string) {
  try {
    const form = await db.customOrderForm.findFirst({
      where: {
        sellerId,
        isActive: true,
      },
      include: {
        fields: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
        seller: {
          select: {
            shopName: true,
          },
        },
      },
    });

    if (!form) {
      return { error: "No custom order form available" };
    }

    return { data: form };
  } catch (error) {
    console.error("Error fetching public form:", error);
    return { error: "Failed to fetch form" };
  }
}

// Submit a custom order form (requires authentication)
export async function submitCustomOrderForm(values: any) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Authentication required" };
  }

  // At this point, we know session.user.id exists
  const userId = session.user.id;

  try {
    const validatedData = CustomOrderSubmissionSchema.parse(values);

    // Get the form and its fields for validation
    const form = await db.customOrderForm.findFirst({
      where: {
        id: validatedData.formId,
        isActive: true,
      },
      include: {
        fields: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!form) {
      return { error: "Form not found or inactive" };
    }

    // Validate that all required fields are provided
    const requiredFields = form.fields.filter(field => field.required);
    const providedFieldIds = validatedData.responses.map(r => r.fieldId);
    
    for (const requiredField of requiredFields) {
      if (!providedFieldIds.includes(requiredField.id)) {
        return { error: `Required field "${requiredField.label}" is missing` };
      }
    }

    // Validate field values based on type and custom validation rules
    for (const response of validatedData.responses) {
      const field = form.fields.find(f => f.id === response.fieldId);
      if (!field) {
        return { error: "Invalid field ID provided" };
      }

      // Type-specific validation
      const validationError = validateFieldValue(field, response.value);
      if (validationError) {
        return { error: validationError };
      }
    }

    const result = await db.$transaction(async (tx) => {
      // Create submission
      const submission = await tx.customOrderSubmission.create({
        data: {
          formId: validatedData.formId,
          userId: userId,
          customerEmail: validatedData.customerEmail,
          customerName: validatedData.customerName,
        },
      });

      // Create responses
      for (const response of validatedData.responses) {
        await tx.customOrderSubmissionResponse.create({
          data: {
            submissionId: submission.id,
            fieldId: response.fieldId,
            value: response.value,
          },
        });
      }

      return submission;
    });

    return { success: "Form submitted successfully", data: result };
  } catch (error) {
    console.error("Error submitting form:", error);
    return { error: "Failed to submit form" };
  }
}

// Helper function to validate field values
function validateFieldValue(field: any, value: string): string | null {
  if (!value || value.trim() === "") {
    if (field.required) {
      return `Field "${field.label}" is required`;
    }
    return null; // Empty value is OK for non-required fields
  }

  switch (field.type) {
    case "number":
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return `Field "${field.label}" must be a valid number`;
      }
      // Check custom validation rules
      if (field.validation) {
        const validation = field.validation as any;
        if (validation.min !== undefined && numValue < validation.min) {
          return `Field "${field.label}" must be at least ${validation.min}`;
        }
        if (validation.max !== undefined && numValue > validation.max) {
          return `Field "${field.label}" must be no more than ${validation.max}`;
        }
      }
      break;

    case "select":
    case "multiselect":
      if (field.options && field.options.length > 0) {
        if (field.type === "multiselect") {
          const selectedValues = value.split(",").map(v => v.trim());
          for (const selected of selectedValues) {
            if (!field.options.includes(selected)) {
              return `Field "${field.label}" contains invalid option: ${selected}`;
            }
          }
        } else {
          if (!field.options.includes(value)) {
            return `Field "${field.label}" contains invalid option: ${value}`;
          }
        }
      }
      break;

    case "date":
      const dateValue = new Date(value);
      if (isNaN(dateValue.getTime())) {
        return `Field "${field.label}" must be a valid date`;
      }
      break;
  }

  // Check custom validation rules
  if (field.validation) {
    const validation = field.validation as any;
    if (validation.minLength && value.length < validation.minLength) {
      return `Field "${field.label}" must be at least ${validation.minLength} characters`;
    }
    if (validation.maxLength && value.length > validation.maxLength) {
      return `Field "${field.label}" must be no more than ${validation.maxLength} characters`;
    }
    if (validation.pattern) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        return `Field "${field.label}" format is invalid`;
      }
    }
  }

  return null;
} 