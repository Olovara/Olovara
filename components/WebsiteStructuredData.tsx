import Script from 'next/script'

interface WebsiteStructuredDataProps {
  pageType: 'home' | 'products' | 'shops' | 'blog' | 'suggestions' | 'categories';
  categoryName?: string;
}

export function WebsiteStructuredData({ pageType, categoryName }: WebsiteStructuredDataProps) {
  const baseUrl = "https://olovara.com";
  
  const baseStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "OLOVARA",
    "description": "Your marketplace for high-quality handcrafted goods",
    "url": baseUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${baseUrl}/products?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  const pageSpecificData = (() => {
    switch (pageType) {
      case 'home':
        return {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "OLOVARA",
          "description": "Your marketplace for high-quality handcrafted goods",
          "url": baseUrl,
          "logo": `${baseUrl}/logo.png`,
          "sameAs": [
            baseUrl
          ]
        };
      case 'products':
        return {
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "Handmade Products",
          "description": "Browse our collection of unique handcrafted products from talented artisans",
          "url": `${baseUrl}/products`
        };
      case 'shops':
        return {
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "Handmade Shops",
          "description": "Browse our curated collection of handcrafted shops from talented artisans worldwide",
          "url": `${baseUrl}/shops`
        };
      case 'blog':
        return {
          "@context": "https://schema.org",
          "@type": "Blog",
          "name": "OLOVARA Blog",
          "description": "Discover articles, guides, and insights about handmade crafts, selling tips, and marketplace updates",
          "url": `${baseUrl}/blog`
        };
      case 'suggestions':
        return {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Feature Suggestions & Feedback",
          "description": "Share your ideas and feedback to help improve OLOVARA",
          "url": `${baseUrl}/suggestions`
        };
      case 'categories':
        return {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": `${categoryName || 'Category'} Products`,
          "description": `Browse our collection of ${categoryName?.toLowerCase() || 'handmade'} products`,
          "url": `${baseUrl}/categories/${categoryName?.toLowerCase() || ''}`
        };
      default:
        return baseStructuredData;
    }
  })();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(baseStructuredData)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(pageSpecificData)
        }}
      />
    </>
  );
} 