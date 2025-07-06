"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, Trash2, Copy, Users, Calendar, FileText, Plus } from "lucide-react";
import Link from "next/link";
import { getCustomOrderForms, deleteCustomOrderForm } from "@/actions/customOrderFormActions";
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
  const [forms, setForms] = useState<CustomOrderForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState<string | null>(null);

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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading forms...</div>
        </CardContent>
      </Card>
    );
  }

  if (forms.length === 0) {
    return (
      <Card>
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

      <Card>
        <CardHeader>
          <CardTitle>Your Custom Order Forms ({forms.length}/{formLimit})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {forms.map((form) => (
              <div
                key={form.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{form.title}</h3>
                    <Badge variant={form.isActive ? "default" : "secondary"}>
                      {form.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {form.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {form.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {form._count.submissions} submissions
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Created {format(new Date(form.createdAt), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyFormLink(form.id)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/seller/dashboard/custom-orders/${form.id}/submissions`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/seller/dashboard/custom-orders/${form.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
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