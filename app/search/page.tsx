import { db } from "@/lib/db";
import Image from "next/image";

export const metadata = {
  title: "Yarnnu - Search Results",
};

interface SearchPageProps {
  searchParams: { q: string };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q;

  // Fetch matching products from the database
  const products = await db.product.findMany({
    where: {
      name: {
        contains: query,
        mode: "insensitive", // Case-insensitive search
      },
    },
    select: {
      id: true,
      name: true,
      price: true,
      images: true,
    },
  });

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
      <h1 className="text-2xl font-bold mb-6">
        Search Results for {query}
      </h1>
      {products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="border rounded-lg p-4 hover:shadow-lg"
            >
              <Image
                src={product.images[0]}
                alt={product.name}
                className="w-full h-40 object-cover rounded-lg"
              />
              <h2 className="mt-4 text-lg font-semibold">{product.name}</h2>
              <p className="text-sm text-muted-foreground">${product.price}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>No products found for {query}.</p>
      )}
    </section>
  );
}
