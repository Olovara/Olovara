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
        // Handle description transformation - it can be a string, object with html/text, object with ops, or null/undefined
        let transformedDescription: { html: string; text: string };
        if (!data.description || data.description === null) {
          // If description is null or undefined, use empty default
          transformedDescription = { html: "", text: "" };
        } else if (typeof data.description === "string") {
          // If it's a string, convert to object format
          transformedDescription = {
            html: data.description,
            text: data.description.replace(/<[^>]*>?/gm, ""),
          };
        } else if (typeof data.description === "object") {
          // If it's already an object, check its structure
          if (data.description.html !== undefined || data.description.text !== undefined) {
            // Has html or text property - use them, generating missing one if needed
            // Priority: if both exist, use them; if only one exists, generate the other
            let html = "";
            let text = "";
            
            if (data.description.html) {
              html = data.description.html;
              // Generate text from html if text doesn't exist or is empty
              text = data.description.text || html.replace(/<[^>]*>?/gm, "").trim();
            } else if (data.description.text) {
              text = data.description.text;
              // If only text exists, use it as html (it might already be HTML or plain text)
              html = text;
            }
            
            transformedDescription = {
              html: html,
              text: text,
            };
          } else if (data.description.ops && Array.isArray(data.description.ops)) {
            // Old format with ops array (Quill Delta format)
            transformedDescription = {
              html: data.description.ops
                .map((op: { insert: string }) => op.insert)
                .join(""),
              text: data.description.ops
                .map((op: { insert: string }) => op.insert)
                .join("")
                .replace(/<[^>]*>?/gm, ""),
            };
          } else {
            // Unknown object format, try to extract text or use empty
            const htmlStr = JSON.stringify(data.description);
            transformedDescription = {
              html: htmlStr,
              text: htmlStr.replace(/<[^>]*>?/gm, ""),
            };
          }
        } else {
          // Fallback for any other type
          transformedDescription = { html: "", text: "" };
        }

        const transformedProduct: ProductFormValues = {
          ...data,
          description: transformedDescription,
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
          attributes: data.attributes || null, // Pass attributes directly
          options: data.options || null, // Pass options directly without transformation
          dropDate: data.dropDate ? new Date(data.dropDate) : null,
          // Sale-related fields - ensure they're properly transformed
          onSale: data.onSale || false,
          saleEndDate: data.saleEndDate ? new Date(data.saleEndDate) : undefined,
          saleEndTime: data.saleEndTime || "",
          saleStartDate: data.saleStartDate ? new Date(data.saleStartDate) : undefined,
          saleStartTime: data.saleStartTime || "",
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
