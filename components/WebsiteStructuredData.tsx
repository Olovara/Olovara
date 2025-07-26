import Script from 'next/script'

interface WebsiteStructuredDataProps {
  pageType?: 'home' | 'products' | 'blog' | 'about' | 'contact'
}

export function WebsiteStructuredData({ pageType = 'home' }: WebsiteStructuredDataProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yarnnu.com'

  // Organization structured data
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Yarnnu",
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`,
    "description": "A handmade marketplace connecting talented artisans with customers worldwide. Discover unique handcrafted products including crochet patterns, handmade jewelry, home decor, and accessories.",
    "foundingDate": "2024",
    "sameAs": [
      "https://twitter.com/yarnnu",
      "https://facebook.com/yarnnu",
      "https://instagram.com/yarnnu"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "url": `${baseUrl}/contact`
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "US"
    }
  }

  // Website structured data
  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Yarnnu",
    "url": baseUrl,
    "description": "Handmade marketplace for unique artisan products",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/products?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  }

  // Breadcrumb structured data for specific pages
  const getBreadcrumbData = () => {
    const breadcrumbs = [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": baseUrl
      }
    ]

    switch (pageType) {
      case 'products':
        breadcrumbs.push({
          "@type": "ListItem",
          "position": 2,
          "name": "Products",
          "item": `${baseUrl}/products`
        })
        break
      case 'blog':
        breadcrumbs.push({
          "@type": "ListItem",
          "position": 2,
          "name": "Blog",
          "item": `${baseUrl}/blog`
        })
        break
      case 'about':
        breadcrumbs.push({
          "@type": "ListItem",
          "position": 2,
          "name": "About",
          "item": `${baseUrl}/about`
        })
        break
      case 'contact':
        breadcrumbs.push({
          "@type": "ListItem",
          "position": 2,
          "name": "Contact",
          "item": `${baseUrl}/contact`
        })
        break
    }

    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs
    }
  }

  return (
    <>
      <Script
        id="organization-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationData)
        }}
      />
      <Script
        id="website-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteData)
        }}
      />
      {pageType !== 'home' && (
        <Script
          id="breadcrumb-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getBreadcrumbData())
          }}
        />
      )}
    </>
  )
} 