import { notFound, permanentRedirect } from "next/navigation";
import { db } from "@/lib/db";
import { unstable_noStore as noStore } from "next/cache";
import ProductDetails from "@/components/ProductDetails";
import { auth } from "@/auth";
import { WebsiteStructuredData } from "@/components/WebsiteStructuredData";
import { getProductPageData } from "@/lib/server/get-product-page-data";
import {
  absoluteProductPageUrl,
  extractMongoProductIdFromSlugParam,
  productPublicPathFromFields,
} from "@/lib/product-public-path";

interface ProductPageProps {
  params: { slugId: string };
}

function decodedSlugParam(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function generateMetadata({ params }: ProductPageProps) {
  const id = extractMongoProductIdFromSlugParam(params.slugId);
  if (!id) {
    return {
      title: "Product Not Found | OLOVARA",
      description: "The requested product could not be found.",
    };
  }

  const product = await getProductPageData(id);

  if (!product) {
    return {
      title: "Product Not Found | OLOVARA",
      description: "The requested product could not be found.",
    };
  }

  const description =
    typeof product.description === "string"
      ? product.description
      : JSON.stringify(product.description);

  const cleanDescription = description
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .substring(0, 160);

  const generatedKeywords = [
    product.name,
    ...(product.tags || []),
    "handmade",
    "artisan",
    product.seller?.shopName,
  ]
    .filter(Boolean)
    .join(", ");

  const seoTitle =
    product.metaTitle ||
    `${product.name} by ${product.seller?.shopName || "Artisan"} | OLOVARA`;
  const seoDescription = product.metaDescription || cleanDescription;
  const seoKeywords =
    product.keywords && product.keywords.length > 0
      ? [...product.keywords, ...(product.tags || [])].join(", ")
      : generatedKeywords;
  const ogTitle =
    product.ogTitle ||
    product.metaTitle ||
    `${product.name} by ${product.seller?.shopName || "Artisan"}`;
  const ogDescription =
    product.ogDescription || product.metaDescription || cleanDescription;
  const ogImage =
    product.ogImage ||
    (product.images && product.images.length > 0
      ? product.images[0]
      : undefined);

  const currentPrice =
    product.onSale && product.discount
      ? product.price - (product.price * product.discount) / 100
      : product.price;

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: seoKeywords,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      images: ogImage
        ? [
            {
              url: ogImage,
              width: 800,
              height: 600,
              alt: product.name,
            },
          ]
        : product.images && product.images.length > 0
          ? [
              {
                url: product.images[0],
                width: 800,
                height: 600,
                alt: product.name,
              },
            ]
          : [],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: ogImage
        ? [ogImage]
        : product.images && product.images.length > 0
          ? [product.images[0]]
          : [],
    },
    alternates: {
      canonical: absoluteProductPageUrl({
        id: product.id,
        name: product.name,
        urlSlug: product.urlSlug,
      }),
    },
    other: {
      "product:price:amount": (currentPrice / 100).toString(),
      "product:price:currency": product.currency,
      "product:availability":
        product.isDigital || product.stock > 0 ? "in stock" : "out of stock",
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  noStore();
  const id = extractMongoProductIdFromSlugParam(params.slugId);
  if (!id) {
    notFound();
  }

  const product = await getProductPageData(id);

  if (!product) {
    notFound();
  }

  if (product.status.toUpperCase() !== "ACTIVE") {
    notFound();
  }

  const slugDecoded = decodedSlugParam(params.slugId);
  const canonicalPath = productPublicPathFromFields({
    id: product.id,
    name: product.name,
    urlSlug: product.urlSlug,
  });
  if (`/products/${slugDecoded}` !== canonicalPath) {
    permanentRedirect(canonicalPath);
  }

  let hasPurchasedDigitalProduct = false;
  if (product.isDigital && product.productFile) {
    const session = await auth();
    if (session?.user?.id) {
      const order = await db.order.findFirst({
        where: {
          userId: session.user.id,
          productId: product.id,
          isDigital: true,
          status: "COMPLETED",
          paymentStatus: "PAID",
          NOT: { status: "REFUNDED" },
        },
        select: { id: true },
      });
      hasPurchasedDigitalProduct = !!order;
    }
  }

  if (!product.images || product.images.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            Product Image Not Available
          </h2>
          <p className="text-gray-600">
            This product does not have any images.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <WebsiteStructuredData pageType="products" />
      <ProductDetails
        data={product}
        hasPurchasedDigitalProduct={hasPurchasedDigitalProduct}
      />
    </>
  );
}
