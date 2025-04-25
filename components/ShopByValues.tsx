import { db } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";

const valueCategories = [
  {
    id: "woman-owned",
    title: "Woman-Owned",
    description: "Support women entrepreneurs",
    query: { isWomanOwned: true },
  },
  {
    id: "minority-owned",
    title: "Minority-Owned",
    description: "Support minority-owned businesses",
    query: { isMinorityOwned: true },
  },
  {
    id: "lgbtq-owned",
    title: "LGBTQ+-Owned",
    description: "Support LGBTQ+-owned businesses",
    query: { isLGBTQOwned: true },
  },
  {
    id: "veteran-owned",
    title: "Veteran-Owned",
    description: "Support veteran-owned businesses",
    query: { isVeteranOwned: true },
  },
  {
    id: "sustainable",
    title: "Sustainable",
    description: "Shop eco-friendly products",
    query: { isSustainable: true },
  },
  {
    id: "charitable",
    title: "Charitable",
    description: "Support businesses that give back",
    query: { isCharitable: true },
  },
];

export async function ShopByValues() {
  const valueSections = await Promise.all(
    valueCategories.map(async (category) => {
      const sellers = await db.seller.findMany({
        where: {
          ...category.query,
          valuesPreferNotToSay: false,
          applicationAccepted: true,
        },
        select: {
          userId: true,
        },
      });

      const sellerIds = sellers.map((seller) => seller.userId);

      const products = await db.product.findMany({
        where: {
          userId: { in: sellerIds },
          status: "ACTIVE",
        },
        take: 4,
        orderBy: { createdAt: "desc" },
      });

      return {
        ...category,
        products,
      };
    })
  );

  return (
    <section className="mt-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          Shop by Your Values
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Discover and support businesses that align with your values
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {valueSections.map((category) => (
          <Link
            key={category.id}
            href={`/products?values=${category.id}`}
            className="group relative overflow-hidden rounded-lg border bg-background p-2 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col h-full">
              <div className="flex-1 p-4">
                <h3 className="font-semibold text-lg">{category.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {category.description}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {category.products.slice(0, 2).map((product) => (
                  <div
                    key={product.id}
                    className="relative aspect-square overflow-hidden rounded-md"
                  >
                    <Image
                      src={product.images[0] || "/placeholder.jpg"}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
} 