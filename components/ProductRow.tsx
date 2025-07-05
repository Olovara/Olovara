import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Suspense } from "react";
import ProductCard from "./ProductCard";

interface iAppProps {
  category: "newest" | "templates" | "uikits" | "ACCESORIES" | "random";
}

async function getData({ category }: iAppProps) {
  try {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    switch (category) {
      case "random": {
        // First get the total count of active products
        const totalProducts = await db.product.count({
          where: { 
            status: "ACTIVE"
          }
        });

        // Calculate a random offset
        const randomOffset = Math.floor(Math.random() * Math.max(0, totalProducts - 4));

        const data = await db.product.findMany({
          where: { 
            status: "ACTIVE"
          },
          select: {
            id: true,
            userId: true,
            name: true,
            description: true,
            price: true,
            currency: true,
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
            tertiaryCategory: true,
            tags: true,
            materialTags: true,
            options: true,
            inStockProcessingTime: true,
            outStockLeadTime: true,
            howItsMade: true,
            productDrop: true,
            NSFW: true,
            dropDate: true,
            dropTime: true,
            discountEndDate: true,
            createdAt: true,
            updatedAt: true,
          },
          skip: randomOffset,
          take: 4,
        });

        return { data, title: "Featured Products", link: "/products" };
      }
      case "ACCESORIES": {
        const data = await db.product.findMany({
          where: { 
            primaryCategory: "ACCESORIES",
            status: "ACTIVE"
          },
          select: {
            id: true,
            userId: true,
            name: true,
            description: true,
            price: true,
            currency: true,
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
            tertiaryCategory: true,
            tags: true,
            materialTags: true,
            options: true,
            inStockProcessingTime: true,
            outStockLeadTime: true,
            howItsMade: true,
            productDrop: true,
            NSFW: true,
            dropDate: true,
            dropTime: true,
            discountEndDate: true,
            createdAt: true,
            updatedAt: true,
          },
          take: 5,
        });

        return { data, title: "Accessories", link: "/products/accessories" };
      }
      case "newest": {
        const data = await db.product.findMany({
          where: { 
            createdAt: { gte: fiveDaysAgo },
            status: "ACTIVE"
          },
          select: {
            id: true,
            userId: true,
            name: true,
            description: true,
            price: true,
            currency: true,
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
            tertiaryCategory: true,
            tags: true,
            materialTags: true,
            options: true,
            inStockProcessingTime: true,
            outStockLeadTime: true,
            howItsMade: true,
            productDrop: true,
            NSFW: true,
            dropDate: true,
            dropTime: true,
            discountEndDate: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 4,
        });

        return { data, title: "Newest Products", link: "/products" };
      }
      default: {
        return notFound();
      }
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    return { data: [], title: "Error", link: "#" };
  }
}

export function ProductRow({ category }: iAppProps) {
  return (
    <section className="mt-12">
      <Suspense fallback={<div>Loading...</div>}>
        <LoadRows category={category} />
      </Suspense>
    </section>
  );
}

export async function LoadRows({ category }: iAppProps) {
  const data = await getData({ category });

  // Hide the section if there are no products
  if (data.data.length === 0) {
    return null;
  }

  return (
    <section className="mt-12">
      <div className="md:flex md:items-center md:justify-between">
        <h2 className="text-2xl font-extrabold tracking-tighter">
          {data.title}
        </h2>
        <Link
          href={data.link}
          className="text-sm hidden font-medium text-primary hover:text-primary/90 md:block"
        >
          All Products <span>&rarr;</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
        {data.data.map((product) => (
          <ProductCard
            key={product.id}
            product={{
              ...product,
              secondaryCategory: product.secondaryCategory || undefined,
              tertiaryCategory: product.tertiaryCategory || undefined,
            }}
            index={data.data.indexOf(product)}
          />
        ))}
      </div>
    </section>
  );
}