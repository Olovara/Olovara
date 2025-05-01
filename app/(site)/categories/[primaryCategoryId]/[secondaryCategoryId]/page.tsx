import { db } from "@/lib/db";
import { CategoriesMap } from "@/data/categories";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Filters } from "@/components/filters";
import ProductCard from "@/components/ProductCard";


interface CategoryPageProps {
  params: {
    primaryCategoryId: string;
    secondaryCategoryId: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const primaryCategory = CategoriesMap.PRIMARY.find(
    (c) => c.id === params.primaryCategoryId
  );
  const secondaryCategory = CategoriesMap.SECONDARY.find(
    (c) => c.id === params.secondaryCategoryId
  );

  if (!primaryCategory || !secondaryCategory) {
    return {
      title: "Category Not Found | Yarnnu",
    };
  }

  return {
    title: `${secondaryCategory.name} ${primaryCategory.name} | Yarnnu`,
    description: `Shop our collection of ${secondaryCategory.name.toLowerCase()} ${primaryCategory.name.toLowerCase()}. Find unique handmade items in this category.`,
    openGraph: {
      title: `${secondaryCategory.name} ${primaryCategory.name} | Yarnnu`,
      description: `Shop our collection of ${secondaryCategory.name.toLowerCase()} ${primaryCategory.name.toLowerCase()}. Find unique handmade items in this category.`,
    },
  };
}

export default async function SecondaryCategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { primaryCategoryId, secondaryCategoryId } = params;

  const primaryCategory = CategoriesMap.PRIMARY.find(
    (c) => c.id.toLowerCase() === primaryCategoryId.toLowerCase()
  );
  const secondaryCategory = CategoriesMap.SECONDARY.find(
    (c) => c.id.toLowerCase() === secondaryCategoryId.toLowerCase()
  );

  if (!primaryCategory || !secondaryCategory) {
    notFound();
  }

  // Fetch products for this category
  const products = await db.product.findMany({
    where: {
      primaryCategory: primaryCategoryId,
      secondaryCategory: secondaryCategoryId,
      status: "ACTIVE",
    },
    take: 20,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            {secondaryCategory.name} {primaryCategory.name}
          </h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Browse our collection of {secondaryCategory.name.toLowerCase()}{" "}
            {primaryCategory.name.toLowerCase()}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/4">
            <Filters />
          </div>

          <div className="w-full md:w-3/4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 