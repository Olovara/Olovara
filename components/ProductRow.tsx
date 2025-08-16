import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Suspense } from "react";
import ProductCard from "./ProductCard";
import { getUserCountryCode } from "@/actions/locationFilterActions";
import { createProductFilterWhereClause, getProductFilterConfig } from "@/lib/product-filtering";

interface iAppProps {
  category: "newest" | "ACCESORIES" | "random";
}

// Type for the database query result
type ProductWithSeller = {
  id: string;
  userId: string;
  name: string;
  description: any;
  price: number;
  currency: string;
  status: string;
  shippingCost: number | null;
  handlingFee: number | null;
  itemWeight: number | null;
  itemLength: number | null;
  itemWidth: number | null;
  itemHeight: number | null;
  shippingNotes: string | null;
  freeShipping: boolean;
  isDigital: boolean;
  stock: number;
  images: string[];
  productFile: string | null;
  numberSold: number;
  onSale: boolean;
  discount: number | null;
  saleStartDate: Date | null;
  saleEndDate: Date | null;
  saleStartTime: string | null;
  saleEndTime: string | null;
  primaryCategory: string;
  secondaryCategory: string | null;
  tertiaryCategory: string | null;
  tags: string[];
  materialTags: string[];
  options: any;
  inStockProcessingTime: number | null;
  outStockLeadTime: number | null;
  howItsMade: string | null;
  productDrop: boolean;
  NSFW: boolean;
  dropDate: Date | null;
  dropTime: string | null;
  discountEndDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  seller: {
    shopName: string;
    shopNameSlug: string;
    isWomanOwned: boolean;
    isMinorityOwned: boolean;
    isLGBTQOwned: boolean;
    isVeteranOwned: boolean;
    isSustainable: boolean;
    isCharitable: boolean;
    excludedCountries: string[] | null;
  } | null;
};

// Common product select fields used across all categories
const PRODUCT_SELECT_FIELDS = {
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
  saleStartDate: true,
  saleEndDate: true,
  saleStartTime: true,
  saleEndTime: true,
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
  seller: {
    select: {
      shopName: true,
      shopNameSlug: true,
      isWomanOwned: true,
      isMinorityOwned: true,
      isLGBTQOwned: true,
      isVeteranOwned: true,
      isSustainable: true,
      isCharitable: true,
      excludedCountries: true,
    },
  },
};

async function getData({ category }: iAppProps) {
  try {
    // Get user's country code for location-based filtering
    const userCountryCode = await getUserCountryCode();
    // Get centralized filter configuration
    const filterConfig = await getProductFilterConfig(userCountryCode || undefined);

    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    // Define category-specific configurations
    const categoryConfigs = {
      random: {
        where: {},
        skip: async () => {
          const productWhere = await createProductFilterWhereClause({}, filterConfig);
          const totalProducts = await db.product.count({ where: productWhere });
          return Math.floor(Math.random() * Math.max(0, totalProducts - 4));
        },
        take: 4,
        orderBy: undefined,
        title: "Featured Products",
        link: "/products"
      },
      ACCESORIES: {
        where: { primaryCategory: "ACCESORIES" },
        skip: 0,
        take: 5,
        orderBy: undefined,
        title: "Accessories",
        link: "/products/accessories"
      },
      newest: {
        where: { createdAt: { gte: fiveDaysAgo } },
        skip: 0,
        take: 4,
        orderBy: { createdAt: "desc" as const },
        title: "Newest Products",
        link: "/products"
      }
    } as const;

    const config = categoryConfigs[category];
    if (!config) {
      notFound();
      return { data: [], title: "Not Found", link: "#" }; // This line will never be reached
    }

    // Build the where clause
    const productWhere = await createProductFilterWhereClause(config.where, filterConfig);
    
    // Get skip value (handle async skip for random category)
    const skip = typeof config.skip === 'function' ? await config.skip() : config.skip;

    // Fetch products with common configuration
    const data = await db.product.findMany({
      where: productWhere,
      select: PRODUCT_SELECT_FIELDS,
      skip,
      take: config.take,
      orderBy: config.orderBy,
    });

    return { 
      data, 
      title: config.title, 
      link: config.link 
    };

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
        {(data.data as ProductWithSeller[]).map((product, index) => (
          <ProductCard
            key={product.id}
            product={{
              id: product.id,
              name: product.name,
              status: product.status,
              isDigital: product.isDigital,
              discount: product.discount,
              price: product.price,
              currency: product.currency,
              images: product.images,
              primaryCategory: product.primaryCategory,
              secondaryCategory: product.secondaryCategory || undefined,
              tertiaryCategory: product.tertiaryCategory || undefined,
              stock: product.stock,
              dropDate: product.dropDate,
              dropTime: product.dropTime,
              onSale: product.onSale,
              saleStartDate: product.saleStartDate,
              saleEndDate: product.saleEndDate,
              saleStartTime: product.saleStartTime,
              saleEndTime: product.saleEndTime,
              seller: product.seller ? {
                shopName: product.seller.shopName,
                shopNameSlug: product.seller.shopNameSlug,
                isWomanOwned: product.seller.isWomanOwned,
                isMinorityOwned: product.seller.isMinorityOwned,
                isLGBTQOwned: product.seller.isLGBTQOwned,
                isVeteranOwned: product.seller.isVeteranOwned,
                isSustainable: product.seller.isSustainable,
                isCharitable: product.seller.isCharitable
              } : null
            }}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}