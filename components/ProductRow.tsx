import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Suspense } from "react";
import ProductCard from "./ProductCard";

interface iAppProps {
  category: "newest" | "templates" | "uikits" | "ACCESORIES";
}

async function getData({ category }: iAppProps) {
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5); // Calculate the date 5 days ago

  switch (category) {
    case "ACCESORIES": {
      const data = await db.product.findMany({
        where: {
          primaryCategory: "ACCESORIES",
        },
        select: {
          price: true,
          name: true,
          description: true,
          id: true,
          images: true,
        },
        take: 5,
      });

      return {
        data: data,
        title: "Accessories",
        link: "/products/accessories",
      };
    }
    case "newest": {
      const data = await db.product.findMany({
        where: {
          createdAt: {
            gte: fiveDaysAgo, // Only products created in the past 5 days
          },
        },
        select: {
          price: true,
          name: true,
          description: true,
          id: true,
          images: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      });

      return {
        data: data,
        title: "Newest Products",
        link: "/products/all",
      };
    }
    default: {
      return notFound();
    }
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

async function LoadRows({ category }: iAppProps) {
  const data = await getData({ category: category });
  return (
    <>
      <div className="md:flex md:items-center md:justify-between">
        <h2 className="text-2xl font-extrabold tracking-tighter ">{data.title}</h2>
        <Link
          href={data.link}
          className="text-sm hidden font-medium text-primary hover:text-primary/90 md:block"
        >
          All Products <span>&rarr;</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 sm:grid-cols-2 mt-4 gap-6">
        {data.data.map((product) => (
          <ProductCard
            key={product.id}
            product={product} // Pass entire product data
            index={data.data.indexOf(product)} // Optional for staggered animation
          />
        ))}
      </div>
    </>
  );
}
