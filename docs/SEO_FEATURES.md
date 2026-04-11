# SEO Features Documentation

## Overview

This document outlines the SEO (Search Engine Optimization) features implemented for both shops and products on the OLOVARA marketplace.

## Shop SEO Features

### Location
Shop SEO settings can be accessed through the seller dashboard at:
`/seller/dashboard/settings#seo`

### Available Fields

1. **Meta Title** (60 characters max)
   - Custom title for search engine results
   - Appears in browser tabs and search listings

2. **Meta Description** (160 characters max)
   - Brief description of the shop
   - Appears in search engine results

3. **Keywords** (Array)
   - SEO keywords to help search engines understand shop content
   - Can be added/removed dynamically

4. **Tags** (Array)
   - Shop categorization tags
   - Helps with internal search and discovery

5. **Social Media Sharing**
   - **Social Media Title**: Custom title for social media shares (60 characters max)
   - **Social Media Description**: Custom description for social media shares (160 characters max)
   - **Social Media Image URL**: Custom image for social media sharing (1200x630px recommended)

## Product SEO Features

### Location
Product SEO settings are integrated into the product creation/editing form.

### Available Fields

1. **Meta Title** (60 characters max)
   - Custom title for search engine results
   - Appears in browser tabs and search listings

2. **Meta Description** (160 characters max)
   - Brief description of the product
   - Appears in search engine results

3. **Keywords** (Array)
   - SEO keywords to help search engines understand product content
   - Can be added/removed dynamically

4. **Social Media Sharing**
   - **Social Media Title**: Custom title for social media shares (60 characters max)
   - **Social Media Description**: Custom description for social media shares (160 characters max)
   - **Social Media Image URL**: Custom image for social media sharing (1200x630px recommended)

## Technical Implementation

### Database Schema
- SEO fields have been added to both `Seller` and `Product` models in Prisma schema
- All fields are optional to maintain backward compatibility

### API Endpoints
- Shop SEO: `/api/seller/seo` (GET, PATCH)
- Product SEO: Integrated into existing product creation/editing endpoints

### Components
- `ShopSEOForm.tsx`: Shop-specific SEO form with validation
- `ProductSEOSection.tsx`: Product SEO section for product forms

### Server Actions
- `updateShopSEO.ts`: Server action for updating shop SEO settings

## Best Practices

### Meta Titles
- Keep under 60 characters
- Include primary keywords
- Make them compelling and descriptive

### Meta Descriptions
- Keep under 160 characters
- Include call-to-action when appropriate
- Summarize the key value proposition

### Keywords
- Focus on relevant, specific terms
- Include long-tail keywords
- Avoid keyword stuffing

### Social Media
- Use engaging, shareable content
- Include relevant hashtags in descriptions
- Use high-quality images (1200x630px)

## Future Enhancements

1. **SEO Analytics**: Track SEO performance and rankings
2. **Auto-suggestions**: Suggest keywords based on product/shop content
3. **Schema Markup**: Add structured data for better search results
4. **Sitemap Generation**: Automatic sitemap generation for shops and products
5. **Canonical URLs**: Prevent duplicate content issues

## Usage Examples

### Setting Shop SEO
```typescript
const seoData = {
  metaTitle: "Handmade Jewelry Shop - Unique Artisan Pieces",
  metaDescription: "Discover beautiful handmade jewelry crafted by skilled artisans. Unique pieces for every occasion.",
  keywords: ["handmade jewelry", "artisan jewelry", "unique jewelry", "handcrafted"],
  tags: ["jewelry", "handmade", "artisan", "accessories"],
  ogTitle: "Handmade Jewelry Shop - Unique Artisan Pieces",
  ogDescription: "Discover beautiful handmade jewelry crafted by skilled artisans. Unique pieces for every occasion.",
  ogImage: "https://example.com/shop-banner.jpg"
};
```

### Setting Product SEO
```typescript
const productSeoData = {
  metaTitle: "Handmade Silver Necklace - Artisan Jewelry",
  metaDescription: "Beautiful handmade silver necklace crafted by skilled artisan. Perfect gift for any occasion.",
  keywords: ["silver necklace", "handmade jewelry", "artisan necklace", "gift"],
  ogTitle: "Handmade Silver Necklace - Artisan Jewelry",
  ogDescription: "Beautiful handmade silver necklace crafted by skilled artisan. Perfect gift for any occasion.",
  ogImage: "https://example.com/necklace-image.jpg"
};
``` 