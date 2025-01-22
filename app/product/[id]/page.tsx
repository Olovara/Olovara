import { BuyButton } from "@/components/SubmitButtons";
import { db } from "@/lib/db";
import { unstable_noStore as noStore } from "next/cache";
import dynamic from "next/dynamic";

// Dynamically import the ImageSlider component with SSR disabled
const ImageSlider = dynamic(() => import("@/components/ImageSlider"), {
  ssr: false, // Disable SSR for this component
});

// Dynamically import the ProductDescription component with SSR disabled
const ProductDescription = dynamic(
  () => import("@/components/ProductDescription"),
  {
    ssr: false, // Disable SSR for this component
  }
);

// Fetch product data
async function getData(id: string) {
  const data = await db.product.findUnique({
    where: {
      id: id,
    },
    select: {
      name: true,  // Fetch the product name
      images: true, // Fetch the product images
      price: true, // Fetch the product price
      description: true, // Fetch the product description
    },
  });
  return data;
}

export default async function ProductPage({
  params,
}: {
  params: { id: string }; // Get the product ID from the URL
}) {
  noStore();
  const data = await getData(params.id); // Fetch product data

  if (!data || !data.images || data.images.length === 0) {
    return (
      <div className="flex items-center justify-center">
        Product image not available.
      </div>
    );
  }

  return (
    <section className="mx-auto px-4 lg:mt-10 max-w-7xl lg:px-8">
      {/* Product Image and Name Layout */}
      <div className="flex flex-col lg:flex-row items-center lg:space-x-8">
        {/* Product Image (Responsive Square) */}
        <div className="w-full sm:w-72 h-72 sm:h-72 bg-gray-100 rounded-lg overflow-hidden">
          <ImageSlider urls={data.images} />
        </div>

        {/* Product Name and Buy Button */}
        <div className="flex flex-col justify-center mt-6 lg:mt-0 lg:flex-grow">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            {data.name}
          </h1>

          {/* Buy Button */}
          <form action={"/buy-product"} method="POST">
            <input type="hidden" name="id" value={data.id} />
            <BuyButton price={data.price as number} />
          </form>
        </div>
      </div>

      {/* Product Description */}
      <div className="mt-8 text-gray-700">
      <ProductDescription content={data.description} />
      </div>
    </section>
  );
}