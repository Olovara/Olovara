import React from "react";
import { db } from "@/lib/db";
import Image from "next/image";
import { ContactSellerButton } from "@/components/shared/ContactSellerButton";
import CustomOrderButton from "@/components/shared/CustomOrderButton";
import ProductCard from "@/components/ProductCard";
import ShopPolicies from "@/components/shop/ShopPolicies";
import ExcludedCountries from "@/components/shop/ExcludedCountries";
import ReportButton from "@/components/ReportButton";
import FollowButton from "@/components/FollowButton";
import { MapPin } from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  PinterestIcon,
  TikTokIcon,
} from "@/components/ui/social-icon";
import { decryptData } from "@/lib/encryption";
import { getUserCountryCode } from "@/actions/locationFilterActions";
import {
  createProductFilterWhereClause,
  getProductFilterConfig,
} from "@/lib/product-filtering";
import { Metadata } from "next";
import { WebsiteStructuredData } from "@/components/WebsiteStructuredData";
import { shopValues } from "@/data/shop-values";

interface ShopPageProps {
  params: { shopNameSlug: string };
}

// Fetch seller and products
async function getShopData(
  shopNameSlug: string,
  userCountryCode?: string,
  canAccessTest: boolean = false
) {
  // Normalize shopNameSlug to lowercase - slugs are always stored in lowercase
  // This prevents case-sensitivity issues when users manually type URLs
  const normalizedSlug = shopNameSlug.toLowerCase();
  
  // Get centralized filter configuration
  const filterConfig = await getProductFilterConfig(
    userCountryCode,
    canAccessTest
  );
  // Use centralized filtering for products
  const productWhere = await createProductFilterWhereClause({}, filterConfig);

  const seller = await db.seller.findUnique({
    where: { shopNameSlug: normalizedSlug }, // Fetch using the normalized slug
    select: {
      id: true,
      shopName: true,
      shopNameSlug: true,
      shopTagLine: true,
      shopDescription: true,
      shopAnnouncement: true,
      behindTheHands: true,
      shopBannerImage: true,
      shopLogoImage: true,
      sellerImage: true,
      totalSales: true,
      followerCount: true,
      acceptsCustom: true,
      processingTime: true,
      returnsPolicy: true,
      exchangesPolicy: true,
      damagesPolicy: true,
      nonReturnableItems: true,
      refundPolicy: true,
      careInstructions: true,
      excludedCountries: true,
      shopValues: true,
      // Location fields (direct on seller model)
      shopCountry: true,
      shopState: true,
      shopCity: true,
      encryptedShopState: true,
      shopStateIV: true,
      shopStateSalt: true,
      encryptedShopCity: true,
      shopCityIV: true,
      shopCitySalt: true,
      // Social media links
      facebookUrl: true,
      instagramUrl: true,
      pinterestUrl: true,
      tiktokUrl: true,
      // SEO fields
      metaTitle: true,
      metaDescription: true,
      keywords: true,
      tags: true,
      ogTitle: true,
      ogDescription: true,
      ogImage: true,
      products: {
        where: productWhere,
        select: {
          id: true,
          name: true,
          price: true,
          currency: true,
          images: true,
          primaryCategory: true,
          secondaryCategory: true,
          status: true,
          isDigital: true,
          onSale: true,
          discount: true,
          saleStartDate: true,
          saleEndDate: true,
          saleStartTime: true,
          saleEndTime: true,
          stock: true,
          dropDate: true,
          dropTime: true,
          seller: {
            select: {
              shopName: true,
              shopNameSlug: true,
              shopValues: true,
              excludedCountries: true,
            },
          },
        },
      },
      reviews: {
        where: {
          status: "PUBLISHED",
        },
        select: {
          id: true,
          rating: true,
          comment: true,
          type: true,
          createdAt: true,
          reviewer: {
            select: {
              username: true,
              image: true,
            },
          },
          product: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      },
    },
  });

  return seller;
}

export async function generateMetadata({
  params,
}: ShopPageProps): Promise<Metadata> {
  const seller = await getShopData(params.shopNameSlug, undefined, false);

  if (!seller) {
    return {
      title: "Shop Not Found | Yarnnu",
      description: "The requested shop could not be found.",
    };
  }

  // Generate keywords from shop tags and values
  // Map shop value IDs to keyword strings
  const valueKeywords = (seller.shopValues || []).map((valueId) => {
    const value = shopValues.find(v => v.id === valueId);
    return value ? value.name.toLowerCase().replace(/\s+/g, "-") : null;
  }).filter(Boolean);

  const generatedKeywords = [
    seller.shopName,
    "handmade",
    "artisan",
    "handcrafted",
    ...(seller.tags || []),
    ...valueKeywords,
  ]
    .filter(Boolean)
    .join(", ");

  // Use custom SEO fields if available, fallback to generated ones
  const seoTitle =
    seller.metaTitle || `${seller.shopName} | Handmade Shop | Yarnnu`;
  const seoDescription =
    seller.metaDescription ||
    seller.shopDescription ||
    `Discover unique handmade products from ${seller.shopName}. Shop our curated collection of artisan goods.`;
  const seoKeywords =
    seller.keywords && seller.keywords.length > 0
      ? [...seller.keywords, ...(seller.tags || [])].join(", ")
      : generatedKeywords;
  const ogTitle =
    seller.ogTitle ||
    seller.metaTitle ||
    `${seller.shopName} | Handmade Shop | Yarnnu`;
  const ogDescription =
    seller.ogDescription ||
    seller.metaDescription ||
    seller.shopDescription ||
    `Discover unique handmade products from ${seller.shopName}.`;
  const ogImage =
    seller.ogImage || seller.shopBannerImage || seller.shopLogoImage;

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
            width: 1200,
            height: 630,
            alt: `${seller.shopName} shop`,
          },
        ]
        : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [ogImage] : [],
    },
    alternates: {
      canonical: `https://yarnnu.com/shops/${seller.shopNameSlug}`,
    },
  };
}

export default async function ShopPage({ params }: ShopPageProps) {
  // Get user's country code for location-based filtering
  const userCountryCode = await getUserCountryCode();
  // For shop page, test access is not needed for public view, so pass false
  const seller = await getShopData(
    params.shopNameSlug,
    userCountryCode || undefined,
    false
  );

  if (!seller) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg font-semibold text-gray-500">Shop not found</p>
      </div>
    );
  }

  // Social media links with icons
  const socialLinks = [
    {
      url: seller.facebookUrl || undefined,
      icon: FacebookIcon,
      label: "Facebook",
    },
    {
      url: seller.instagramUrl || undefined,
      icon: InstagramIcon,
      label: "Instagram",
    },
    {
      url: seller.pinterestUrl || undefined,
      icon: PinterestIcon,
      label: "Pinterest",
    },
    { url: seller.tiktokUrl || undefined, icon: TikTokIcon, label: "TikTok" },
  ].filter((link) => link.url);

  // Get location from seller's direct fields (shopCountry, shopState, shopCity)
  // Note: We no longer use addresses since we're not collecting that information
  let location = null;

  if (seller.shopCountry) {
    const locationData: {
      country: string;
      state: string | null;
      city: string | null;
    } = {
      country: seller.shopCountry,
      state: null,
      city: null,
    };

    // Try to get state from encrypted field or plain field
    if (seller.encryptedShopState && seller.shopStateIV && seller.shopStateSalt) {
      try {
        const decryptedState = decryptData(
          seller.encryptedShopState,
          seller.shopStateIV,
          seller.shopStateSalt
        );
        if (
          decryptedState &&
          decryptedState !== "Temporary Data - Please Update"
        ) {
          locationData.state = decryptedState;
        }
      } catch (error) {
        console.error("Error decrypting shop state:", error);
      }
    } else if (seller.shopState) {
      // Use plain shopState if available
      locationData.state = seller.shopState;
    }

    // Try to get city from encrypted field or plain field
    if (seller.encryptedShopCity && seller.shopCityIV && seller.shopCitySalt) {
      try {
        const decryptedCity = decryptData(
          seller.encryptedShopCity,
          seller.shopCityIV,
          seller.shopCitySalt
        );
        if (
          decryptedCity &&
          decryptedCity !== "Temporary Data - Please Update"
        ) {
          locationData.city = decryptedCity;
        }
      } catch (error) {
        console.error("Error decrypting shop city:", error);
      }
    } else if (seller.shopCity) {
      // Use plain shopCity if available
      locationData.city = seller.shopCity;
    }

    location = locationData;
  }

  return (
    <>
      <WebsiteStructuredData pageType="shops" />
      <div className="min-h-screen bg-gray-50">
        {/* HEADER SECTION */}
        <div className="bg-white border-b">
          {/* Shop Banner */}
          {seller.shopBannerImage && (
            <div className="relative w-full h-48 md:h-64 lg:h-80">
              <Image
                src={seller.shopBannerImage}
                alt={`${seller.shopName} banner`}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>
          )}

          <div className="container mx-auto px-4 py-6 max-w-7xl">
            {/* Shop Info */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Shop Logo */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                  {seller.shopLogoImage ? (
                    <Image
                      src={seller.shopLogoImage}
                      alt={`${seller.shopName} logo`}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-400">
                        {seller.shopName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Shop Details */}
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {seller.shopName}
                </h1>

                {seller.shopTagLine && (
                  <p className="text-lg text-gray-600 mb-3">
                    {seller.shopTagLine}
                  </p>
                )}

                {/* Social Links */}
                {socialLinks.length > 0 && (
                  <div className="flex flex-wrap gap-3 mb-4">
                    {socialLinks.map(({ url, icon: Icon, label }) => (
                      <a
                        key={label}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{label}</span>
                      </a>
                    ))}
                  </div>
                )}

                {/* Quick Stats */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                  <span>{seller.products.length} products</span>
                  <span>•</span>
                  <span>{seller.totalSales} sales</span>
                  <span>•</span>
                  <span>{seller.followerCount} followers</span>
                  {seller.acceptsCustom && (
                    <>
                      <span>•</span>
                      <span className="text-purple-600 font-medium">
                        Accepts Custom Orders
                      </span>
                    </>
                  )}
                </div>

                {/* Location */}
                {location && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="h-4 w-4" />
                    <span>
                      Handmade in: {location.city && `${location.city}, `}
                      {location.state && `${location.state}, `}
                      {location.country}
                    </span>
                  </div>
                )}
              </div>

              {/* Contact & Custom Order Buttons */}
              <div className="flex-shrink-0 flex flex-wrap items-center gap-2">
                <FollowButton
                  sellerId={seller.id}
                  sellerName={seller.shopName}
                  showCount={true}
                  initialFollowerCount={seller.followerCount}
                  variant="outline"
                  size="sm"
                />
                <ContactSellerButton
                  sellerId={seller.id}
                  sellerName={seller.shopName}
                  variant="outline"
                  size="sm"
                />
                <CustomOrderButton
                  sellerId={seller.id}
                  sellerName={seller.shopName}
                  acceptsCustom={seller.acceptsCustom}
                  variant="outline"
                  size="sm"
                />
                <ReportButton
                  reportType="SELLER"
                  targetId={seller.id}
                  targetName={seller.shopName}
                  variant="outline"
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* ITEMS SECTION */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Shop Items</h2>

            {/* Mobile Layout */}
            <div className="block lg:hidden">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Products ({seller.products.length})
                </h3>
                {seller.products.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No products available.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {seller.products.map((product, index) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        index={index}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6">
              {/* Filters Sidebar */}
              <aside className="col-span-3">
                <div className="sticky top-6 space-y-6">
                  {/* Shop Stats */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Shop Information
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>All Products ({seller.products.length})</li>
                      <li>
                        Physical Items (
                        {seller.products.filter((p) => !p.isDigital).length})
                      </li>
                      <li>
                        Digital Products (
                        {seller.products.filter((p) => p.isDigital).length})
                      </li>
                    </ul>

                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-600">
                        Total Sales: {seller.totalSales}
                      </p>
                      <p className="text-sm text-gray-600">
                        Followers: {seller.followerCount}
                      </p>
                      {seller.acceptsCustom && (
                        <p className="text-sm text-green-600 mt-2">
                          Accepts Custom Orders
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Excluded Countries */}
                  <ExcludedCountries
                    excludedCountries={seller.excludedCountries}
                  />
                </div>
              </aside>

              {/* Product Grid */}
              <div className="col-span-9">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  {seller.products.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No products available.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                      {seller.products.map((product, index) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          index={index}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* REVIEWS SECTION */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Reviews</h2>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              {seller.reviews.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No reviews yet.
                </p>
              ) : (
                <div className="space-y-6">
                  {seller.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border-b pb-4 last:border-b-0"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            {review.reviewer.image ? (
                              <Image
                                src={review.reviewer.image}
                                alt={review.reviewer.username || "Reviewer"}
                                width={40}
                                height={40}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-medium text-gray-600">
                                {review.reviewer.username
                                  ?.charAt(0)
                                  .toUpperCase() || "U"}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {review.reviewer.username || "Anonymous"}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={`text-sm ${i < review.rating
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                  }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          {review.comment && (
                            <p className="text-sm text-gray-600">
                              {review.comment}
                            </p>
                          )}
                          {review.product && (
                            <p className="text-xs text-gray-500 mt-1">
                              Review for: {review.product.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ABOUT SECTION */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">About This Shop</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Shop Description & Maker Image */}
              <div className="lg:col-span-2 space-y-6">
                {/* Shop Description */}
                {seller.shopDescription && (
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      About the Maker
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {seller.shopDescription}
                    </p>

                    {/* Maker Image */}
                    {seller.sellerImage && (
                      <div className="mt-4">
                        <Image
                          src={seller.sellerImage}
                          alt="Maker"
                          width={200}
                          height={200}
                          className="w-32 h-32 rounded-lg object-cover"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Behind the Hands */}
                {(seller as any).behindTheHands && (
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Behind the Hands
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {(seller as any).behindTheHands}
                    </p>
                  </div>
                )}

                {/* FAQ Section - Placeholder for now */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Frequently Asked Questions
                  </h3>
                  <p className="text-gray-500 text-center py-4">
                    FAQ section coming soon...
                  </p>
                </div>
              </div>

              {/* Shop Policies */}
              <div className="space-y-6">
                <ShopPolicies
                  processingTime={seller.processingTime}
                  returnsPolicy={seller.returnsPolicy}
                  exchangesPolicy={seller.exchangesPolicy}
                  damagesPolicy={seller.damagesPolicy}
                  nonReturnableItems={seller.nonReturnableItems}
                  refundPolicy={seller.refundPolicy}
                  careInstructions={seller.careInstructions}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
