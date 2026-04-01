"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Edit, Eye, Trash2, Copy, Users, Calendar, FileText, Plus } from "lucide-react";
import Link from "next/link";
import {
  getCustomOrderForms,
  deleteCustomOrderForm,
  toggleCustomOrderFormActive,
} from "@/actions/customOrderFormActions";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

interface CustomOrderForm {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    submissions: number;
  };
}

export default function CustomOrderFormsList() {
  const router = useRouter();
  const [forms, setForms] = useState<CustomOrderForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const result = await getCustomOrderForms();
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        setForms(result.data);
      }
    } catch (error) {
      toast.error("Failed to load forms");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!formToDelete) return;

    try {
      const result = await deleteCustomOrderForm(formToDelete);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Form deleted successfully");
        fetchForms();
      }
    } catch (error) {
      toast.error("Failed to delete form");
    } finally {
      setDeleteDialogOpen(false);
      setFormToDelete(null);
    }
  };

  const copyFormLink = (formId: string) => {
    const link = `${window.location.origin}/custom-order/${formId}`;
    navigator.clipboard.writeText(link);
    toast.success("Form link copied to clipboard");
  };

  const handleToggleActive = async (formId: string, nextActive: boolean) => {
    setTogglingId(formId);
    try {
      const result = await toggleCustomOrderFormActive(formId, nextActive);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        nextActive
          ? "Form is active - customers can submit requests"
          : "Form is inactive - hidden from new submissions"
      );
      await fetchForms();
      router.refresh();
    } catch {
      toast.error("Failed to update form");
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <Card className="border-brand-dark-neutral-200 bg-brand-light-neutral-50">
        <CardContent className="p-6">
          <div className="text-center">Loading forms...</div>
        </CardContent>
      </Card>
    );
  }

  if (forms.length === 0) {
    return (
      <Card className="border-brand-dark-neutral-200 bg-brand-light-neutral-50">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4" />
              <h3 className="text-lg font-medium">No custom order forms yet</h3>
              <p className="text-sm">
                Create your first form to start collecting custom order requests from customers.
              </p>
            </div>
            <Button asChild>
              <Link href="/seller/dashboard/custom-orders/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Form
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show form limit warning if approaching limit
  const formLimit = 5;
  const formsRemaining = formLimit - forms.length;

  return (
    <>
      {formsRemaining <= 2 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <div className="text-sm">
                <strong>Form Limit:</strong> You have {formsRemaining} form{formsRemaining === 1 ? '' : 's'} remaining out of {formLimit} total.
                {formsRemaining === 0 && " Delete an existing form to create a new one."}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-brand-dark-neutral-200 bg-brand-light-neutral-50">
        <CardHeader>
          <CardTitle>Your Custom Order Forms ({forms.length}/{formLimit})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {forms.map((form) => (
              <div
                key={form.id}
                className="flex flex-col gap-4 rounded-lg border border-brand-dark-neutral-200 bg-brand-light-neutral-100 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-2">
                    <h3 className="font-medium">{form.title}</h3>
                  </div>
                  {form.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {form.description}
                    </p>
                  )}
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 shrink-0" />
                      <span>{form._count.submissions} submissions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span>
                        Created {format(new Date(form.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 border-brand-dark-neutral-200 sm:border-r sm:pr-3">
                    <Switch
                      id={`form-active-${form.id}`}
                      checked={form.isActive}
                      disabled={togglingId === form.id}
                      onCheckedChange={(checked) =>
                        void handleToggleActive(form.id, checked)
                      }
                    />
                    <Label
                      htmlFor={`form-active-${form.id}`}
                      className="cursor-pointer whitespace-nowrap text-sm font-normal leading-none"
                    >
                      {form.isActive ? "Active" : "Inactive"}
                    </Label>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outlinePrimary"
                      size="sm"
                      onClick={() => copyFormLink(form.id)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outlinePrimary" size="sm" asChild>
                      <Link
                        href={`/seller/dashboard/custom-orders/submissions?formId=${form.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outlinePrimary" size="sm" asChild>
                      <Link href={`/seller/dashboard/custom-orders/edit/${form.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outlinePrimary"
                      size="sm"
                      onClick={() => {
                        setFormToDelete(form.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Form</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this form? This action cannot be undone.
              All submissions for this form will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 