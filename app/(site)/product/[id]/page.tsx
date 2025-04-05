import { BuyButton } from "@/components/SubmitButtons";
import { db } from "@/lib/db";
import { unstable_noStore as noStore } from "next/cache";
import dynamic from "next/dynamic";
import { ObjectId } from "mongodb";
import Link from "next/link";
import QuantitySelector from "@/components/QuantitySelector";
import CheckoutButton from "@/components/CheckoutButton";
import ProductActions from "@/components/ProductPageActions";

// Dynamically import the ImageSlider component
const ImageSlider = dynamic(() => import("@/components/ImageSlider"), {
  ssr: false,
});

const ProductDescription = dynamic(
  () => import("@/components/ProductDescription"),
  {
    ssr: false,
  }
);

// Generate metadata dynamically
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
    where: { id: id },
    select: {
      id: true,
      name: true,
      images: true,
      price: true,
      discount: true,
      discountEndDate: true,
      description: true,
      status: true,
      isDigital: true,
      stock: true,
      productFile: true,
      handlingFee: true,
      shippingCost: true,
      itemWeight: true,
      itemLength: true,
      itemWidth: true,
      itemHeight: true,
      shippingNotes: true,
      freeShipping: true,
      inStockProcessingTime: true,
      howItsMade: true,
      tags: true,
      seller: {
        select: {
          shopName: true,
          shopNameSlug: true,
        },
      },
    },
  });

  return data;
}

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  noStore();
  const data = await getData(params.id);

  if (!data || !data.images || data.images.length === 0) {
    return (
      <div className="flex items-center justify-center">
        Product image not available.
      </div>
    );
  }

  // Calculate discounted price if applicable
  const isOnSale =
    data.discount &&
    data.discountEndDate &&
    new Date(data.discountEndDate) > new Date();
  const finalPrice = isOnSale
    ? data.price - data.price * (data.discount / 100)
    : data.price;

  return (
    <section className="mx-auto px-4 lg:mt-10 max-w-7xl lg:px-8">
      {/* Product Image and Name Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-1 lg:col-span-2 w-full h-full bg-gray-100 rounded-lg overflow-hidden">
          <ImageSlider urls={data.images} />
        </div>

        <div className="col-span-1 flex flex-col justify-center space-y-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            {data.name}
          </h1>
          {data.seller?.shopName && (
            <p className="text-gray-700 text-sm">
              Made by:&nbsp;
              <Link
                href={`/shop/${data.seller.shopNameSlug}`}
                className="font-medium text-purple-600 hover:underline"
              >
                {data.seller.shopName}
              </Link>
            </p>
          )}
          {!data.isDigital && data.stock > 0 && data.inStockProcessingTime && (
            <div>
              <p className="text-sm text-gray-500">
                Ships in {data.inStockProcessingTime} days.
              </p>
            </div>
          )}

          {/* Sale Price or Regular Price */}
          <p className="text-xl font-semibold text-gray-800">
            {isOnSale ? (
              <>
                <span className="line-through text-gray-500">
                  ${data.price.toFixed(2)}
                </span>{" "}
                <span className="text-red-600">${finalPrice.toFixed(2)}</span>
              </>
            ) : (
              <>${data.price.toFixed(2)}</>
            )}
          </p>

          {/* Handling Fee and Shipping */}
          {data.handlingFee && (
            <p className="text-sm text-gray-600">
              Handling Fee: ${data.handlingFee.toFixed(2)}
            </p>
          )}
          {data.shippingCost && !data.freeShipping && (
            <p className="text-sm text-gray-600">
              Shipping: ${data.shippingCost.toFixed(2)}
            </p>
          )}
          {data.freeShipping && (
            <p className="text-sm text-green-600">Free Shipping Available</p>
          )}
          {/* Display Stock Quantity if it's a physical product */}
          {!data.isDigital && (
            <p className="text-sm text-gray-600">
              {data.stock > 0
                ? `In Stock: ${data.stock} available`
                : "Out of Stock"}
            </p>
          )}
          {/* Quantity Selector & Buy Now Button */}
          <ProductActions productId={data.id} maxStock={data.stock} />

          {/* How It's Made Section */}
          {data.howItsMade && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">How It&apos;s Made</h3>
              <p className="text-gray-600">{data.howItsMade}</p>
            </div>
          )}

          {/* Shipping Notes Section */}
          {data.shippingNotes && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Shipping Notes</h3>
              <p className="text-gray-600">{data.shippingNotes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Additional Info Section */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="text-gray-700">
          <ProductDescription content={data.description} />
        </div>

        {/* Shipping and Dimensions */}
        {!data.isDigital && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold">Product Details</h3>
            {data.itemWeight && <p>Weight: {data.itemWeight}g</p>}
            {(data.itemLength || data.itemWidth || data.itemHeight) && (
              <p>
                Dimensions: {data.itemLength || 0} x {data.itemWidth || 0} x{" "}
                {data.itemHeight || 0}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Digital Product Download */}
      {data.isDigital && data.productFile && (
        <div className="mt-8 bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Digital Download</h3>
          <a
            href={data.productFile}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            Download Now
          </a>
        </div>
      )}
    </section>
  );
}
