import Script from 'next/script'
import { absoluteProductPageUrl } from '@/lib/product-public-path'

interface ProductStructuredDataProps {
  product: {
    id: string
    name: string
    urlSlug?: string | null
    description: string
    price: number
    currency: string
    images: string[]
    stock: number
    onSale: boolean
    discount?: number | null
    saleStartDate?: Date | null
    saleEndDate?: Date | null
    saleStartTime?: string | null
    saleEndTime?: string | null
    seller: {
      shopName: string
      shopNameSlug: string
    } | null
    isDigital: boolean
    tags: string[]
  }
}

export function ProductStructuredData({ product }: ProductStructuredDataProps) {
  // Check if sale is currently active
  const isOnSale = (() => {
    if (!product.onSale || !product.discount) return false;

    const now = new Date();

    // Check sale start date/time
    if (product.saleStartDate) {
      const saleStart = new Date(product.saleStartDate);
      if (product.saleStartTime) {
        const [hours, minutes] = product.saleStartTime.split(':').map(Number);
        saleStart.setHours(hours, minutes, 0, 0);
      }
      if (now < saleStart) return false;
    }

    // Check sale end date/time
    if (product.saleEndDate) {
      const saleEnd = new Date(product.saleEndDate);
      if (product.saleEndTime) {
        const [hours, minutes] = product.saleEndTime.split(':').map(Number);
        saleEnd.setHours(hours, minutes, 0, 0);
      }
      if (now > saleEnd) return false;
    }

    return true;
  })();

  // Calculate current price
  const currentPrice = isOnSale && product.discount 
    ? product.price - (product.price * product.discount / 100)
    : product.price

  // Create structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": typeof product.description === 'string' 
      ? product.description 
      : JSON.stringify(product.description),
    "image": product.images,
    ...(product.seller && {
      "brand": {
        "@type": "Brand",
        "name": product.seller.shopName
      }
    }),
    "offers": {
      "@type": "Offer",
      "price": (currentPrice / 100).toFixed(2),
      "priceCurrency": product.currency,
      "availability": product.isDigital || product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      ...(product.seller && {
        "seller": {
          "@type": "Organization",
          "name": product.seller.shopName,
          "url": `${process.env.NEXT_PUBLIC_APP_URL}/shops/${product.seller.shopNameSlug}`
        }
      }),
      "url": absoluteProductPageUrl({
        id: product.id,
        name: product.name,
        urlSlug: product.urlSlug,
      })
    },
    "category": product.tags?.[0] || "Handmade Product",
    "keywords": product.tags?.join(', ') || "handmade, artisan",
    "additionalProperty": [
      {
        "@type": "PropertyValue",
        "name": "Handmade",
        "value": "true"
      },
      {
        "@type": "PropertyValue", 
        "name": "Digital Product",
        "value": product.isDigital.toString()
      }
    ]
  }

  return (
    <Script
      id={`product-structured-data-${product.id}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData)
      }}
    />
  )
} 