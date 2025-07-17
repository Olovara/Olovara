import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { unstable_noStore as noStore } from "next/cache";
import dynamic from "next/dynamic";
import { ObjectId } from "mongodb";
import Link from "next/link";
import ProductActions from "@/components/ProductPageActions";
import ProductDetails from "@/components/ProductDetails";
import { auth } from "@/auth";
import { canUserAccessTestEnvironment } from "@/lib/test-environment";

// Dynamically import the ImageSlider component
const ImageSlider = dynamic(() => import("@/components/ImageSlider"), {
  ssr: false,
});

const ProtectedProductDescription = dynamic(
  () => import("@/components/ProtectedProductDescription"),
  { ssr: false }
);

interface ProductPageProps {
  params: {
    id: string;
  };
  }

async function getData(id: string) {
  try {
    // Validate that the ID is a valid ObjectID before querying
    if (!ObjectId.isValid(id)) {
      console.error("Invalid ObjectID format:", id);
      return null;
    }

    // Check if user has test environment access
    const session = await auth();
    const canAccessTest = session?.user?.id 
      ? await canUserAccessTestEnvironment(session.user.id)
      : false;

    const product = await db.product.findUnique({
      where: {
        id,
        // Filter out test products unless user has test environment access
        ...(canAccessTest ? {} : { isTestProduct: false }),
      },
      select: {
        id: true,
        name: true,
        images: true,
        price: true,
        currency: true,
        discount: true,
        onSale: true,
        saleStartDate: true,
        saleEndDate: true,
        saleStartTime: true,
        saleEndTime: true,
        description: true,
        status: true,
        isDigital: true,
        stock: true,
        productFile: true,
        handlingFee: true,
        shippingCost: true,
        itemWeight: true,
        itemWeightUnit: true,
        itemLength: true,
        itemWidth: true,
        itemHeight: true,
        itemDimensionUnit: true,
        shippingNotes: true,
        freeShipping: true,
        inStockProcessingTime: true,
        howItsMade: true,
        tags: true,
        NSFW: true,
        seller: {
          select: {
            shopName: true,
            shopNameSlug: true,
          },
        },
        dropDate: true,
        dropTime: true,
      },
    });

    if (!product) {
      console.error("Product not found:", id);
      return null;
}

    return product;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

export async function generateMetadata({ params }: ProductPageProps) {
  const product = await getData(params.id);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  noStore();
  const product = await getData(params.id);

  if (!product) {
    notFound();
  }

  if (product.status.toUpperCase() !== "ACTIVE") {
    notFound();
  }

  if (!product.images || product.images.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Product Image Not Available</h2>
          <p className="text-gray-600">This product does not have any images.</p>
        </div>
      </div>
    );
  }

  return <ProductDetails data={product} />;
}
