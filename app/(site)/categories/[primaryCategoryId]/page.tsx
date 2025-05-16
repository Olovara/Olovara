import { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoriesMap } from "@/data/categories";
import { FilterBar } from "@/components/filter-bar";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import ProductCard from "@/components/ProductCard";


interface PrimaryCategoryPageProps {
  params: {
    primaryCategoryId: string;
  };
  searchParams: {
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    condition?: string;
    q?: string;
    page?: string;
    values?: string;
  };
}

export async function generateMetadata({
  params,
}: PrimaryCategoryPageProps): Promise<Metadata> {
  const primaryCategory = CategoriesMap.PRIMARY.find(
    (cat) => cat.id.toLowerCase() === params.primaryCategoryId.toLowerCase()
  );

  if (!primaryCategory) {
    return {
      title: "Category Not Found",
      description: "The requested category could not be found.",
    };
  }

  return {
    title: `${primaryCategory.name} | Yarnnu`,
    description: `Browse our collection of ${primaryCategory.name.toLowerCase()} products.`,
  };
}

export default async function PrimaryCategoryPage({
  params,
  searchParams,
}: PrimaryCategoryPageProps) {
  const primaryCategory = CategoriesMap.PRIMARY.find(
    (cat) => cat.id.toLowerCase() === params.primaryCategoryId.toLowerCase()
  );

  if (!primaryCategory) {
    notFound();
  }

  // Get subcategories for this primary category
  const subcategories = CategoriesMap.SECONDARY.filter(
    (cat) => cat.primaryCategoryId === params.primaryCategoryId
  );

  const { primaryCategoryId } = params;
  const { q, minPrice, maxPrice, sort, page, values } = searchParams;

  // Parse filters
  const priceRange = [minPrice ? Number(minPrice) : 0, maxPrice ? Number(maxPrice) : 1000];
  const currentPage = Number(page) || 1;
  const itemsPerPage = 12;
  const selectedValues = values?.split(",") || [];

  // Build where clause
  const where: Prisma.ProductWhereInput = {
    AND: [
      {
        primaryCategory: primaryCategoryId,
        status: "ACTIVE", // Only show active products
      },
      {
        price: {
          gte: priceRange[0],
          lte: priceRange[1],
        },
      },
      ...(q
        ? [
            {
              name: {
                contains: q,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          ]
        : []),
      ...(selectedValues.length > 0
        ? [
            {
              seller: {
                OR: selectedValues.map((value) => ({
                  [value]: true,
                })),
              },
            },
          ]
        : []),
    ],
  };

  // Get total count for pagination
  const totalProducts = await db.product.count({ where });
  const totalPages = Math.ceil(totalProducts / itemsPerPage);

  // Fetch products with pagination
  const products = await db.product.findMany({
    where,
    orderBy: sort === "price-asc" ? { price: "asc" } : sort === "price-desc" ? { price: "desc" } : { createdAt: "desc" },
    skip: (currentPage - 1) * itemsPerPage,
    take: itemsPerPage,
    select: {
      id: true,
      name: true,
      price: true,
      currency: true,
      images: true,
      primaryCategory: true,
      secondaryCategory: true,
      status: true,
      isDigital: true,
      onSale: true,
      discount: true,
      stock: true,
      dropDate: true,
      dropTime: true,
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
        },
      },
    },
  });

  // Transform products to match the expected type
  const transformedProducts = products.map(product => ({
    ...product,
    imageUrl: product.images[0] || "", // Use the first image as the main image
    currency: product.currency || "USD", // Ensure currency is included with a default
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
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{primaryCategory.name}</h1>
        <p className="text-gray-600">
          Browse our collection of {primaryCategory.name.toLowerCase()} products.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar with subcategories and filters */}
        <div className="md:col-span-1">
          <div className="sticky top-4">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Subcategories</h2>
              <ul className="space-y-2">
                {subcategories.map((subcategory) => (
                  <li key={subcategory.id}>
                    <a
                      href={`/categories/${params.primaryCategoryId}/${subcategory.id}`}
                      className="text-gray-600 hover:text-primary"
                    >
                      {subcategory.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <FilterBar />
          </div>
        </div>

        {/* Product grid */}
        <div className="md:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {transformedProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>

          {transformedProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No products found in this category.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 