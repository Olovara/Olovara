import { BuyButton } from "@/components/SubmitButtons";
import { db } from "@/lib/db";
import { unstable_noStore as noStore } from "next/cache";
import dynamic from "next/dynamic";
import { ObjectId } from "mongodb";

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

// Dynamically generate metadata
export async function generateMetadata({ params }: { params: { id: string } }) {
  const { id } = params;

  if (!ObjectId.isValid(id)) {
    console.error("Invalid product ID:", id);
    return { title: "Invalid Product" };
  }

  const product = await getData(id);
  return { title: product?.name || "Product Not Found" };
}

// Fetch product data
async function getData(id: string) {
  const data = await db.product.findUnique({
    where: {
      id: id,
    },
    select: {
      name: true, // Fetch the product name
      images: true, // Fetch the product images
      price: true, // Fetch the product price
      description: true, // Fetch the product description
      options: true, // Fetch the product options
      seller: {
        select: {
          shopName: true, // Fetch the shop name from the related seller
        },
      },
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Product Image (2/3 of the space on large screens) */}
        <div className="col-span-1 lg:col-span-2 w-full h-full bg-gray-100 rounded-lg overflow-hidden">
          <ImageSlider urls={data.images} />
        </div>

        {/* Product Name and Buy Button (1/3 of the space on large screens) */}
        <div className="col-span-1 flex flex-col justify-center space-y-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            {data.name}
          </h1>
          {data.seller?.shopName && (
            <p className="text-gray-700 text-sm">
              Made by: <span className="font-medium">{data.seller.shopName}</span>
            </p>
          )}

          {/* Display Options if Available */}
          {data.options && data.options.length > 0 && (
            <div className="mt-2">
              {data.options.map(
                (
                  option: { label: string; values: string[] },
                  index: number
                ) => (
                  <div key={index} className="mb-2">
                    {/* Option Label */}
                    <p className="font-medium text-gray-700">{option.label}:</p>
                    {/* Option Values */}
                    <div className="flex flex-wrap gap-2 mt-1">
                      {Array.isArray(option.values) ? (
                        option.values.map((val, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-sm border rounded-md bg-gray-100"
                          >
                            {val}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 italic">
                          No options available
                        </span>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}

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
