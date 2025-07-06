"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { getCustomOrderForms } from "@/actions/customOrderFormActions";
import { toast } from "sonner";

export default function CustomOrderHeader() {
  const [formCount, setFormCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFormCount();
  }, []);

  const fetchFormCount = async () => {
    try {
      const result = await getCustomOrderForms();
      if (result.data) {
        setFormCount(result.data.length);
      }
    } catch (error) {
      console.error("Failed to fetch form count:", error);
    } finally {
      setLoading(false);
    }
  };

  const formLimit = 5;
  const canCreate = formCount < formLimit;

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Custom Orders</h1>
        <p className="text-muted-foreground">
          Create forms to collect information from customers requesting custom orders
        </p>
        {!loading && (
          <p className="text-sm text-muted-foreground mt-1">
            {formCount}/{formLimit} forms used
          </p>
        )}
      </div>
      <Button asChild disabled={!canCreate}>
        <Link href="/seller/dashboard/custom-orders/create">
          <Plus className="mr-2 h-4 w-4" />
          Create Form
        </Link>
      </Button>
    </div>
  );
} 