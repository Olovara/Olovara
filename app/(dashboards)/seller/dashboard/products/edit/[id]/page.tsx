"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProductForm } from "@/components/forms/ProductForm";
import { ProductDraftStatus } from "@/components/product/ProductDraftStatus";
import { ProductSchema } from "@/schemas/ProductSchema";
import { z } from "zod";

type ProductFormValues = z.infer<typeof ProductSchema> & {
  id?: string;
};

interface ProductOption {
  name: string;
  value: string;
}

export default function EditProductPage() {
  const params = useParams();
  const [product, setProduct] = useState<ProductFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${params.id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Product not found");
          } else if (response.status === 401) {
            setError("You need to be logged in to edit this product");
          } else {
            setError("Failed to fetch product");
          }
          return;
        }

        const data = await response.json();

        // Transform the product data to match the expected format
        const transformedProduct: ProductFormValues = {
          ...data,
          description:
            typeof data.description === "string"
              ? {
                  html: data.description,
                  text: data.description.replace(/<[^>]*>?/gm, ""),
                }
              : data.description.ops
                ? {
                    html: data.description.ops
                      .map((op: { insert: string }) => op.insert)
                      .join(""),
                    text: data.description.ops
                      .map((op: { insert: string }) => op.insert)
                      .join("")
                      .replace(/<[^>]*>?/gm, ""),
                  }
                : data.description || { html: "", text: "" },
          shippingCost: data.shippingCost || 0,
          handlingFee: data.handlingFee || 0,
          itemWeight: data.itemWeight || 0,
          itemLength: data.itemLength || 0,
          itemWidth: data.itemWidth || 0,
          itemHeight: data.itemHeight || 0,
          shippingNotes: data.shippingNotes || "",
          stock: data.stock ?? null,
          discount: data.discount || 0,
          numberSold: data.numberSold || 0,
          inStockProcessingTime: data.inStockProcessingTime || 0,
          outStockLeadTime: data.outStockLeadTime || 0,
          howItsMade: data.howItsMade || "",
          tags: data.tags || [],
          materialTags: data.materialTags || [],
          options: data.options || null, // Pass options directly without transformation
          dropDate: data.dropDate ? new Date(data.dropDate) : null,
        };

        setProduct(transformedProduct);
      } catch (error) {
        console.error("Error fetching product:", error);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-red-500">
        {error}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        Product not found
      </div>
    );
  }

  return (
    <div className="w-full">
      <ProductDraftStatus
        product={product}
        onActivate={() => {
          // This will be handled by the ProductForm component
          window.location.reload();
        }}
      />
      <ProductForm initialData={product} />
    </div>
  );
}
