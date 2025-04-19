import { ProductForm } from "@/components/forms/ProductForm";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Seller - Edit Product",
};

// Fetch the product data
async function getProduct(id: string) {
  const product = await db.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      status: true,
      shippingCost: true,
      handlingFee: true,
      itemWeight: true,
      itemLength: true,
      itemWidth: true,
      itemHeight: true,
      shippingNotes: true,
      freeShipping: true,
      isDigital: true,
      stock: true,
      images: true,
      productFile: true,
      numberSold: true,
      onSale: true,
      discount: true,
      primaryCategory: true,
      secondaryCategory: true,
      tags: true,
      materialTags: true,
      options: true,
      inStockProcessingTime: true,
      outStockLeadTime: true,
      howItsMade: true,
      productDrop: true,
      NSFW: true,
      dropDate: true,
      discountEndDate: true,
    },
  });

  if (!product) {
    notFound();
  }

  // Convert any null values to appropriate defaults
  return {
    ...product,
    description: product.description
      ? { ops: [{ insert: product.description as string }] }
      : { ops: [{ insert: "" }] },
    shippingCost: product.shippingCost || 0,
    handlingFee: product.handlingFee || 0,
    itemWeight: product.itemWeight || 0,
    itemLength: product.itemLength || 0,
    itemWidth: product.itemWidth || 0,
    itemHeight: product.itemHeight || 0,
    shippingNotes: product.shippingNotes || "",
    stock: product.stock ?? null,
    discount: product.discount || 0,
    numberSold: product.numberSold || 0,
    inStockProcessingTime: product.inStockProcessingTime || 0,
    outStockLeadTime: product.outStockLeadTime || 0,
    howItsMade: product.howItsMade || "",
    tags: product.tags || [],
    materialTags: product.materialTags || [],
    options: Array.isArray(product.options)
      ? product.options
          .map((opt: any) =>
            typeof opt === "object" && "name" in opt && "value" in opt
              ? { name: String(opt.name), value: String(opt.value) }
              : null
          )
          .filter((opt): opt is { name: string; value: string } => opt !== null)
      : [],
    dropDate: product.dropDate ? product.dropDate.toISOString() : null,
    discountEndDate: product.discountEndDate ?? undefined,
  };
}

export default async function EditProduct({
  params,
}: {
  params: { id: string };
}) {
  const product = await getProduct(params.id);

  return (
    <div className="flex items-center justify-center vertical-center">
      <ProductForm initialData={product} />
    </div>
  );
}
