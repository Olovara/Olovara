import { MetadataRoute } from 'next'
import { productPublicPathFromFields } from '@/lib/product-public-path'
import { db } from '@/lib/db'
import { Categories } from '@/data/categories'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://olovara.com'
  
  // Get current timestamp for lastModified
  const currentDate = new Date().toISOString()

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: currentDate,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: currentDate,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/buyer-and-returns-policy`,
      lastModified: currentDate,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/handmade-guidelines`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    },
    {
      url: `${baseUrl}/prohibited-items`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    },
  ]

  // Category pages
  const categoryPages = Categories.flatMap(primaryCat => {
    const primaryUrl = `${baseUrl}/categories/${primaryCat.id.toLowerCase()}`
    
    const secondaryPages = primaryCat.children
      .map(secCat => {
        const secondaryUrl = `${primaryUrl}/${secCat.id.toLowerCase()}`

        return {
          url: secondaryUrl,
          lastModified: currentDate,
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }
      })

    return [
      {
        url: primaryUrl,
        lastModified: currentDate,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      },
      ...secondaryPages
    ]
  })

  // Get all active products
  const products = await db.product.findMany({
    where: {
      status: 'ACTIVE',
      isTestProduct: false,
    },
    select: {
      id: true,
      name: true,
      urlSlug: true,
      updatedAt: true,
    },
    take: 10000, // Limit to prevent timeout
  })

  const productPages = products.map(product => ({
    url: `${baseUrl}${productPublicPathFromFields(product)}`,
    lastModified: product.updatedAt.toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Get all published blog posts
  const blogPosts = await db.blogPost.findMany({
    where: {
      status: 'PUBLISHED',
      isPrivate: false,
    },
    select: {
      slug: true,
      updatedAt: true,
    },
    take: 1000, // Limit to prevent timeout
  })

  const blogPages = blogPosts.map(post => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt.toISOString(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  // Get all active sellers/shops
  const sellers = await db.seller.findMany({
    where: {
      isFullyActivated: true,
    },
    select: {
      shopNameSlug: true,
      updatedAt: true,
    },
    take: 1000, // Limit to prevent timeout
  })

  const shopPages = sellers.map(seller => ({
    url: `${baseUrl}/shops/${seller.shopNameSlug}`,
    lastModified: seller.updatedAt.toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [
    ...staticPages,
    ...categoryPages,
    ...productPages,
    ...blogPages,
    ...shopPages,
  ]
} 