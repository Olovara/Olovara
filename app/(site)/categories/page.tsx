import { CategoriesMap } from "@/data/categories";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop by Category | Yarnnu",
  description: "Browse our wide selection of handcrafted goods by category. Find unique handmade items in accessories, toys, clothing, craft supplies, and patterns.",
  openGraph: {
    title: "Shop by Category | Yarnnu",
    description: "Browse our wide selection of handcrafted goods by category. Find unique handmade items in accessories, toys, clothing, craft supplies, and patterns.",
  },
};

export default function CategoriesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Shop by Category
          </h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Discover unique handcrafted goods organized by category
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {CategoriesMap.PRIMARY.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
            >
              <h2 className="text-2xl font-semibold mb-4">{category.name}</h2>
              
              <div className="space-y-2">
                {CategoriesMap.SECONDARY.filter(
                  (sub) => sub.primaryCategoryId === category.id
                ).map((subcategory) => {
                  const tertiaryCategories = CategoriesMap.getTertiaryCategories(subcategory.id);
                  return (
                    <div key={subcategory.id} className="ml-2">
                      <Link
                        href={`/categories/${category.id.toLowerCase()}/${subcategory.id.toLowerCase()}`}
                        className="block text-primary hover:text-primary/80 transition-colors font-medium"
                      >
                        {subcategory.name}
                      </Link>
                      {tertiaryCategories.length > 0 && (
                        <div className="ml-4 mt-1 space-y-1">
                          {tertiaryCategories.map((tertiaryId) => {
                            const tertiaryCategory = CategoriesMap.TERTIARY.find(t => t.id === tertiaryId);
                            return tertiaryCategory ? (
                              <Link
                                key={tertiaryId}
                                href={`/categories/${category.id.toLowerCase()}/${subcategory.id.toLowerCase()}/${tertiaryId.toLowerCase()}`}
                                className="block text-sm text-gray-600 hover:text-primary transition-colors"
                              >
                                {tertiaryCategory.name}
                              </Link>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <Link
                href={`/categories/${category.id.toLowerCase()}`}
                className="mt-4 inline-block text-sm font-medium text-primary hover:text-primary/80"
              >
                View all {category.name} →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
