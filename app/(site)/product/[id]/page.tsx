import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { unstable_noStore as noStore } from "next/cache";
import dynamic from "next/dynamic";
import { ObjectId } from "mongodb";
import ProductDetails from "@/components/ProductDetails";
import { auth } from "@/auth";
import { canUserAccessTestEnvironment } from "@/lib/test-environment";
import { WebsiteStructuredData } from "@/components/WebsiteStructuredData";

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
        // SEO fields
        metaTitle: true,
        metaDescription: true,
        keywords: true,
        ogTitle: true,
        ogDescription: true,
        ogImage: true,
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
      title: "Product Not Found | Yarnnu",
      description: "The requested product could not be found.",
    };
  }

  // Extract description from JSON content
  const description = typeof product.description === 'string' 
    ? product.description 
    : JSON.stringify(product.description);

  // Create a clean description for SEO
  const cleanDescription = description
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 160); // Limit to 160 characters

  // Generate keywords from product tags and name (fallback)
  const generatedKeywords = [
    product.name,
    ...(product.tags || []),
    'handmade',
    'artisan',
    product.seller?.shopName,
  ].filter(Boolean).join(', ');

  // Use custom SEO fields if available, fallback to generated ones
  const seoTitle = product.metaTitle || `${product.name} by ${product.seller?.shopName || 'Artisan'} | Yarnnu`;
  const seoDescription = product.metaDescription || cleanDescription;
  const seoKeywords = product.keywords && product.keywords.length > 0 
    ? [...product.keywords, ...(product.tags || [])].join(', ')
    : generatedKeywords;
  const ogTitle = product.ogTitle || product.metaTitle || `${product.name} by ${product.seller?.shopName || 'Artisan'}`;
  const ogDescription = product.ogDescription || product.metaDescription || cleanDescription;
  const ogImage = product.ogImage || (product.images && product.images.length > 0 ? product.images[0] : undefined);

  // Calculate price for structured data
  const currentPrice = product.onSale && product.discount 
    ? product.price - (product.price * product.discount / 100)
    : product.price;

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: seoKeywords,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [
        {
          url: ogImage,
          width: 800,
          height: 600,
          alt: product.name,
        }
      ] : (product.images && product.images.length > 0 ? [
        {
          url: product.images[0],
          width: 800,
          height: 600,
          alt: product.name,
        }
      ] : []),
      type: 'product',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [ogImage] : (product.images && product.images.length > 0 ? [product.images[0]] : []),
    },
    alternates: {
      canonical: `https://yarnnu.com/product/${product.id}`,
    },
    other: {
      'product:price:amount': (currentPrice / 100).toString(),
      'product:price:currency': product.currency,
      'product:availability': product.stock > 0 ? 'in stock' : 'out of stock',
    },
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

  return (
    <>
      <WebsiteStructuredData pageType="products" />
      <ProductDetails data={product} />
    </>
  );
}
