import Script from 'next/script'

interface ProductStructuredDataProps {
  product: {
    id: string
    name: string
    description: string
    price: number
    currency: string
    images: string[]
    stock: number
    onSale: boolean
    discount?: number | null
    seller: {
      shopName: string
      shopNameSlug: string
    } | null
    isDigital: boolean
    tags: string[]
  }
}

export function ProductStructuredData({ product }: ProductStructuredDataProps) {
  // Calculate current price
  const currentPrice = product.onSale && product.discount 
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
      "availability": product.stock > 0 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      ...(product.seller && {
        "seller": {
          "@type": "Organization",
          "name": product.seller.shopName,
          "url": `${process.env.NEXT_PUBLIC_APP_URL}/shops/${product.seller.shopNameSlug}`
        }
      }),
      "url": `${process.env.NEXT_PUBLIC_APP_URL}/product/${product.id}`
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