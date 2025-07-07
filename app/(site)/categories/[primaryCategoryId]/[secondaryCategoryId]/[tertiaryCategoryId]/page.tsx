import { db } from "@/lib/db";
import { CategoriesMap } from "@/data/categories";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Filters } from "@/components/filters";
import ProductCard from "@/components/ProductCard";
import { getUserCountryCode } from "@/actions/locationFilterActions";
import { createLocationFilterWhereClause } from "@/lib/product-filtering";

interface TertiaryCategoryPageProps {
  params: {
    primaryCategoryId: string;
    secondaryCategoryId: string;
    tertiaryCategoryId: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({
  params,
}: TertiaryCategoryPageProps): Promise<Metadata> {
  const primaryCategory = CategoriesMap.PRIMARY.find(
    (c) => c.id === params.primaryCategoryId
  );
  const secondaryCategory = CategoriesMap.SECONDARY.find(
    (c) => c.id === params.secondaryCategoryId
  );
  const tertiaryCategory = CategoriesMap.TERTIARY.find(
    (c) => c.id === params.tertiaryCategoryId
  );

  if (!primaryCategory || !secondaryCategory || !tertiaryCategory) {
    return {
      title: "Category Not Found | Yarnnu",
    };
  }

  return {
    title: `${tertiaryCategory.name} ${secondaryCategory.name} ${primaryCategory.name} | Yarnnu`,
    description: `Shop our collection of ${tertiaryCategory.name.toLowerCase()} ${secondaryCategory.name.toLowerCase()} ${primaryCategory.name.toLowerCase()}. Find unique handmade items in this category.`,
    openGraph: {
      title: `${tertiaryCategory.name} ${secondaryCategory.name} ${primaryCategory.name} | Yarnnu`,
      description: `Shop our collection of ${tertiaryCategory.name.toLowerCase()} ${secondaryCategory.name.toLowerCase()} ${primaryCategory.name.toLowerCase()}. Find unique handmade items in this category.`,
    },
  };
}

export default async function TertiaryCategoryPage({
  params,
  searchParams,
}: TertiaryCategoryPageProps) {
  // Get user's country code for location-based filtering
  const userCountryCode = await getUserCountryCode();

  const { primaryCategoryId, secondaryCategoryId, tertiaryCategoryId } = params;

  const primaryCategory = CategoriesMap.PRIMARY.find(
    (c) => c.id.toLowerCase() === primaryCategoryId.toLowerCase()
  );
  const secondaryCategory = CategoriesMap.SECONDARY.find(
    (c) => c.id.toLowerCase() === secondaryCategoryId.toLowerCase()
  );
  const tertiaryCategory = CategoriesMap.TERTIARY.find(
    (c) => c.id.toLowerCase() === tertiaryCategoryId.toLowerCase()
  );

  if (!primaryCategory || !secondaryCategory || !tertiaryCategory) {
    notFound();
  }

  // Fetch products for this tertiary category
  const products = await db.product.findMany({
    where: {
      primaryCategory: primaryCategoryId,
      secondaryCategory: secondaryCategoryId,
      tertiaryCategory: tertiaryCategoryId,
      status: "ACTIVE",
      // Add location-based filtering
      ...createLocationFilterWhereClause(userCountryCode || ""),
    },
    select: {
      id: true,
      name: true,
      price: true,
      currency: true,
      images: true,
      primaryCategory: true,
      secondaryCategory: true,
      tertiaryCategory: true,
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
          excludedCountries: true,
        },
      },
    },
    take: 20,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
            <a href="/categories" className="hover:text-primary">Categories</a>
            <span>/</span>
            <a href={`/categories/${primaryCategoryId}`} className="hover:text-primary">
              {primaryCategory.name}
            </a>
            <span>/</span>
            <a href={`/categories/${primaryCategoryId}/${secondaryCategoryId}`} className="hover:text-primary">
              {secondaryCategory.name}
            </a>
            <span>/</span>
            <span className="text-foreground">{tertiaryCategory.name}</span>
          </nav>
          
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            {tertiaryCategory.name} {secondaryCategory.name} {primaryCategory.name}
          </h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Browse our collection of {tertiaryCategory.name.toLowerCase()}{" "}
            {secondaryCategory.name.toLowerCase()} {primaryCategory.name.toLowerCase()}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/4">
            <Filters />
          </div>

          <div className="w-full md:w-3/4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product, index) => (
                <ProductCard 
                  key={product.id} 
                  product={{
                    ...product,
                    secondaryCategory: product.secondaryCategory || undefined,
                    tertiaryCategory: product.tertiaryCategory || undefined,
                  }} 
                  index={index} 
                />
              ))}
            </div>
            
            {products.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No products found in this category.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 