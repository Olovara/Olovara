"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useCurrency } from "@/hooks/useCurrency";
import ProductActions from "@/components/ProductPageActions";
import { ProductStructuredData } from "@/components/ProductStructuredData";
import GPSRComplianceDisplay from "@/components/product/GPSRComplianceDisplay";
import ProductOptionSelector from "@/components/ProductOptionSelector";
import { ChevronDown, ChevronUp, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

// Dynamically import the ImageSlider component
const ImageSlider = dynamic(() => import("@/components/ImageSlider"), {
  ssr: false,
});

const ProtectedProductDescription = dynamic(
  () => import("@/components/ProtectedProductDescription"),
  { ssr: false }
);

interface ProductDetailsProps {
  data: {
    id: string;
    name: string;
    shortDescription: string;
    shortDescriptionBullets?: string[];
    options?: {
      label: string;
      values: {
        name: string;
        price?: number;
        stock: number;
      }[];
    }[];
    images: string[];
    price: number;
    currency: string;
    discount: number | null;
    onSale: boolean;
    saleStartDate: Date | null;
    saleEndDate: Date | null;
    saleStartTime: string | null;
    saleEndTime: string | null;
    description: any;
    status: string;
    isDigital: boolean;
    stock: number;
    productFile: string | null;
    handlingFee: number | null;
    shippingCost: number | null;
    itemWeight: number | null;
    itemWeightUnit: string | null;
    itemLength: number | null;
    itemWidth: number | null;
    itemHeight: number | null;
    itemDimensionUnit: string | null;
    shippingNotes: string | null;
    freeShipping: boolean;
    inStockProcessingTime: number | null;
    howItsMade: string | null;
    tags: string[];
    materialTags: string[];
    primaryCategory: string;
    secondaryCategory: string;
    tertiaryCategory: string | null;
    sku: string | null;
    NSFW: boolean;
    // GPSR compliance fields
    safetyWarnings?: string | null;
    materialsComposition?: string | null;
    safeUseInstructions?: string | null;
    ageRestriction?: string | null;
    chokingHazard?: boolean;
    smallPartsWarning?: boolean;
    chemicalWarnings?: string | null;
    careInstructions?: string | null;
    seller: {
      shopName: string;
      shopNameSlug: string;
      userId: string;
      behindTheHands: string | null;
    } | null;
    dropDate: Date | null;
    dropTime: string | null;
    batchNumber?: string | null;
    // GPSR compliance additional data
    responsiblePerson?: {
      name: string;
      email: string;
      phone: string;
      companyName: string;
      vatNumber?: string;
      address: {
        street: string;
        street2?: string;
        city: string;
        state?: string;
        country: string;
        postalCode: string;
      };
    } | null;
    businessAddress?: {
      street: string;
      street2?: string;
      city: string;
      state?: string;
      country: string;
      postalCode: string;
    } | null;
    reviews: {
      id: string;
      rating: number;
      comment: string | null;
      createdAt: Date;
      reviewer: {
        id: string;
        username: string | null;
        image: string | null;
      };
    }[];
  };
}

export default function ProductDetails({ data }: ProductDetailsProps) {
  const [convertedPrice, setConvertedPrice] = useState<string>("");
  const [convertedFinalPrice, setConvertedFinalPrice] = useState<string>("");
  const [convertedShippingCost, setConvertedShippingCost] =
    useState<string>("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});
  const [optionAdjustedPrice, setOptionAdjustedPrice] = useState(data.price);

  const { formatPrice } = useCurrency();

  // Handle option selection changes
  const handleOptionSelectionChange = (
    options: Record<string, string>,
    totalPrice: number
  ) => {
    setSelectedOptions(options);
    setOptionAdjustedPrice(totalPrice);
  };

  // Update current time every minute for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updatePrices = async () => {
      try {
        // Convert regular price
        const regularPrice = await formatPrice(data.price, true);
        setConvertedPrice(regularPrice);

        // Calculate and convert final price (with discount if applicable)
        const finalPrice = data.discount
          ? optionAdjustedPrice - (optionAdjustedPrice * data.discount) / 100
          : optionAdjustedPrice;

        const finalPriceFormatted = await formatPrice(finalPrice, true);
        setConvertedFinalPrice(finalPriceFormatted);

        // Convert shipping cost if it exists
        if (data.shippingCost || data.handlingFee) {
          const totalShipping =
            (data.shippingCost || 0) + (data.handlingFee || 0);
          const shippingFormatted = await formatPrice(totalShipping, true);
          setConvertedShippingCost(shippingFormatted);
        }
      } catch (error) {
        console.error("Error updating prices:", error);
      }
    };

    updatePrices();
  }, [
    data.price,
    data.discount,
    data.shippingCost,
    data.handlingFee,
    optionAdjustedPrice,
    formatPrice,
  ]);

  // Check if sale is currently active
  const isOnSale = (() => {
    if (!data.onSale || !data.discount) return false;

    const now = new Date();

    // Check sale start date/time
    if (data.saleStartDate) {
      const saleStart = new Date(data.saleStartDate);
      if (data.saleStartTime) {
        const [hours, minutes] = data.saleStartTime.split(":").map(Number);
        saleStart.setHours(hours, minutes, 0, 0);
      }
      if (now < saleStart) return false;
    }

    // Check sale end date/time
    if (data.saleEndDate) {
      const saleEnd = new Date(data.saleEndDate);
      if (data.saleEndTime) {
        const [hours, minutes] = data.saleEndTime.split(":").map(Number);
        saleEnd.setHours(hours, minutes, 0, 0);
      }
      if (now > saleEnd) return false;
    }

    return true;
  })();

  // Calculate time remaining for sale
  const getSaleTimeRemaining = () => {
    if (!data.saleEndDate) return null;

    const saleEnd = new Date(data.saleEndDate);

    if (data.saleEndTime) {
      const [hours, minutes] = data.saleEndTime.split(":").map(Number);
      saleEnd.setHours(hours, minutes, 0, 0);
    }

    const timeDiff = saleEnd.getTime() - currentTime.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff <= 0) return "Ends today";
    if (daysDiff === 1) return "Ends tomorrow";
    if (daysDiff <= 7) return `Ends in ${daysDiff} days`;

    return `Ends ${saleEnd.toLocaleDateString()}`;
  };

  return (
    <section className="mx-auto px-4 lg:mt-10 max-w-7xl lg:px-8">
      {/* Product Image and Name Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="col-span-1 lg:col-span-2">
          <div className="w-full bg-gray-100 rounded-lg overflow-hidden">
            <ImageSlider urls={data.images} />
          </div>

          {/* Product Description Section */}
          <div className="mt-8">
            <h3 className="font-medium text-gray-700 mb-4">
              PRODUCT DESCRIPTION
            </h3>
            <div className="text-gray-800">
              <ProtectedProductDescription
                content={data.description}
                NSFW={Boolean(data.NSFW)}
              />
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-8">
            <h3 className="font-medium text-gray-700 mb-4">
              REVIEWS{" "}
              {data.reviews && data.reviews.length > 0
                ? `(${data.reviews.length})`
                : "(0)"}
            </h3>
            {data.reviews && data.reviews.length > 0 ? (
              <div className="space-y-6">
                {data.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-b border-gray-200 pb-6 last:border-b-0"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {review.reviewer.image ? (
                          <Image
                            src={review.reviewer.image}
                            alt={review.reviewer.username || "Reviewer"}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-gray-600 text-sm font-medium">
                              {review.reviewer.username?.charAt(0) || "?"}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <p className="text-sm font-medium text-gray-900">
                            {review.reviewer.username || "Anonymous"}
                          </p>
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <Star className="h-12 w-12 mx-auto" />
                </div>
                <p className="text-gray-500 text-sm">No reviews yet</p>
                <p className="text-gray-400 text-xs mt-1">
                  Be the first to review this product!
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-1 flex flex-col space-y-3">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl uppercase">
            {data.name}
          </h1>
          {data.seller?.shopName && (
            <p className="text-gray-700 text-sm -mt-1">
              Handmade by:&nbsp;
              <Link
                href={`/shops/${data.seller.shopNameSlug}`}
                className="font-medium text-purple-600 hover:underline"
              >
                {data.seller.shopName}
              </Link>
            </p>
          )}
          {/* Only show short description if it exists and is not empty/zero */}
          {(() => {
            // Explicitly check for non-empty string (not "", null, undefined, or "0")
            const hasDescription =
              data.shortDescription &&
              typeof data.shortDescription === "string" &&
              data.shortDescription.trim().length > 0 &&
              data.shortDescription.trim() !== "0";

            // Check bullets with proper type narrowing
            const bullets = data.shortDescriptionBullets;
            const hasBullets =
              bullets &&
              Array.isArray(bullets) &&
              bullets.length > 0 &&
              bullets.some(
                (bullet) =>
                  bullet &&
                  typeof bullet === "string" &&
                  bullet.trim().length > 0 &&
                  bullet.trim() !== "0"
              );

            if (!hasDescription && !hasBullets) return null;

            return (
              <div className="text-gray-700 text-medium">
                {hasDescription && (
                  <p className="whitespace-pre-line">{data.shortDescription}</p>
                )}
                {hasBullets && bullets && (
                  <ul className="mt-3 space-y-1">
                    {bullets
                      .filter(
                        (bullet) =>
                          bullet &&
                          typeof bullet === "string" &&
                          bullet.trim().length > 0 &&
                          bullet.trim() !== "0"
                      )
                      .map((bullet, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-gray-500 mt-1">•</span>
                          <span className="text-sm">{bullet}</span>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            );
          })()}
          {!data.isDigital &&
            data.stock > 0 &&
            data.inStockProcessingTime &&
            data.inStockProcessingTime > 0 && (
              <div>
                <p className="text-sm text-gray-500">
                  Ships in {data.inStockProcessingTime} days.
                </p>
              </div>
            )}

          {/* Sale Badge */}
          {isOnSale && (
            <div className="inline-block bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
              SALE -{data.discount}% OFF
              {getSaleTimeRemaining() && (
                <span className="ml-2 text-xs">• {getSaleTimeRemaining()}</span>
              )}
            </div>
          )}

          {/* Sale Price or Regular Price */}
          <p className="text-xl font-semibold text-gray-800">
            {isOnSale ? (
              <>
                <span className="line-through text-gray-500">
                  {convertedPrice}
                </span>{" "}
                <span className="text-green-600">{convertedFinalPrice}</span>
              </>
            ) : (
              convertedPrice
            )}
          </p>

          {/* Combined Shipping and Handling Fee */}
          {!data.freeShipping && (data.shippingCost || data.handlingFee) && (
            <p className="text-sm text-gray-600">
              Shipping & Handling: {convertedShippingCost}
            </p>
          )}
          {data.freeShipping && (
            <p className="text-sm text-green-600">Free Shipping Available</p>
          )}

          {/* Display Stock Quantity if it's a physical product */}
          {!data.isDigital && (
            <p className="text-sm text-gray-600">
              {data.stock > 0
                ? `In Stock: ${data.stock} available`
                : "Out of Stock"}
            </p>
          )}
          {/* Product Options */}
          {data.options && data.options.length > 0 && (
            <ProductOptionSelector
              options={data.options}
              basePrice={data.price}
              baseStock={data.stock}
              currency={data.currency}
              onSelectionChange={handleOptionSelectionChange}
            />
          )}

          {/* Quantity Selector & Buy Now Button */}
          <ProductActions
            productId={data.id}
            productName={data.name}
            maxStock={data.stock}
            dropDate={data.dropDate}
            dropTime={data.dropTime}
            isDigital={data.isDigital}
            price={optionAdjustedPrice}
            shippingCost={data.shippingCost || 0}
            handlingFee={data.handlingFee || 0}
            sellerId={data.seller?.shopName ? data.seller.shopName : undefined}
            onSale={Boolean(isOnSale)}
            discount={data.discount}
          />

          {/* Collapsible Product Details Section */}
          <CollapsibleProductDetails data={data} />

          {/* Collapsible Shipping Notes Section */}
          {data.shippingNotes && <CollapsibleShippingNotes data={data} />}

          {/* Collapsible How It's Made Section */}
          {data.howItsMade && <CollapsibleHowItsMade data={data} />}

          {/* Collapsible Behind the Hands Section */}
          {data.seller?.behindTheHands && (
            <CollapsibleBehindTheHands data={data} />
          )}
        </div>
      </div>

      {/* GPSR Compliance Information - Only for physical products */}
      {!data.isDigital && (
        <div className="mt-8 pb-8">
          <GPSRComplianceDisplay
            safetyWarnings={data.safetyWarnings}
            materialsComposition={data.materialsComposition}
            safeUseInstructions={data.safeUseInstructions}
            ageRestriction={data.ageRestriction}
            chokingHazard={data.chokingHazard}
            smallPartsWarning={data.smallPartsWarning}
            chemicalWarnings={data.chemicalWarnings}
            careInstructions={data.careInstructions}
            responsiblePerson={data.responsiblePerson}
            businessAddress={data.businessAddress}
            showAll={true}
          />
        </div>
      )}

      {/* Digital Product Download */}
      {data.isDigital && data.productFile && (
        <div className="mt-8 bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Digital Download</h3>
          {/*
            Use the secure download API route to prevent unauthorized access.
            The API will check if the user has a completed, paid order before redirecting to the file.
          */}
          <a
            href={`/api/download/${data.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            Download Now
          </a>
        </div>
      )}

      {/* Add structured data for SEO */}
      <ProductStructuredData product={data} />
    </section>
  );
}

// Collapsible Product Details Component
function CollapsibleProductDetails({
  data,
}: {
  data: ProductDetailsProps["data"];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-4 border-t pt-4">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between p-0 h-auto font-medium text-gray-700 hover:bg-transparent"
      >
        <span>PRODUCT DETAILS</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {isOpen && (
        <div className="mt-4 text-sm">
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            {/* Product Information */}
            <span className="font-bold text-gray-600">Product ID</span>
            <span className="text-gray-800">{data.id}</span>

            {data.sku && (
              <>
                <span className="font-bold text-gray-600">SKU</span>
                <span className="text-gray-800">{data.sku}</span>
              </>
            )}

            {/* Categories */}
            <span className="font-bold text-gray-600">Categories</span>
            <span className="text-gray-800">
              {data.primaryCategory}{" "}
              {data.secondaryCategory && `> ${data.secondaryCategory}`}{" "}
              {data.tertiaryCategory && `> ${data.tertiaryCategory}`}
            </span>

            {/* Physical Product Details */}
            {!data.isDigital && (
              <>
                {/* Weight - Only show if weight exists and is greater than 0 */}
                {data.itemWeight && data.itemWeight > 0 && (
                  <>
                    <span className="font-bold text-gray-600">Weight</span>
                    <span className="text-gray-800">
                      {data.itemWeight.toFixed(2)} {data.itemWeightUnit}
                    </span>
                  </>
                )}

                {/* Dimensions - Only show if at least one dimension exists and is greater than 0 */}
                {(() => {
                  const dimensions = [];
                  if (data.itemLength && data.itemLength > 0) {
                    dimensions.push(
                      `${data.itemLength}${data.itemDimensionUnit}`
                    );
                  }
                  if (data.itemWidth && data.itemWidth > 0) {
                    dimensions.push(
                      `${data.itemWidth}${data.itemDimensionUnit}`
                    );
                  }
                  if (data.itemHeight && data.itemHeight > 0) {
                    dimensions.push(
                      `${data.itemHeight}${data.itemDimensionUnit}`
                    );
                  }
                  return dimensions.length > 0;
                })() && (
                  <>
                    <span className="font-bold text-gray-600">Dimensions</span>
                    <span className="text-gray-800">
                      {(() => {
                        const dimensions = [];
                        if (data.itemLength && data.itemLength > 0) {
                          dimensions.push(
                            `${data.itemLength}${data.itemDimensionUnit}`
                          );
                        }
                        if (data.itemWidth && data.itemWidth > 0) {
                          dimensions.push(
                            `${data.itemWidth}${data.itemDimensionUnit}`
                          );
                        }
                        if (data.itemHeight && data.itemHeight > 0) {
                          dimensions.push(
                            `${data.itemHeight}${data.itemDimensionUnit}`
                          );
                        }
                        return dimensions.join(" × ");
                      })()}
                    </span>
                  </>
                )}

                {/* Stock */}
                <span className="font-bold text-gray-600">Stock</span>
                <span className="text-gray-800">{data.stock} available</span>
              </>
            )}

            {/* Digital Product Details */}
            {data.isDigital && (
              <>
                <span className="font-bold text-gray-600">Type</span>
                <span className="text-gray-800">Digital Download</span>
              </>
            )}

            {/* Processing Time */}
            {data.inStockProcessingTime && data.inStockProcessingTime > 0 && (
              <>
                <span className="font-bold text-gray-600">Processing Time</span>
                <span className="text-gray-800">
                  {data.inStockProcessingTime} days
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Collapsible Shipping Notes Component
function CollapsibleShippingNotes({
  data,
}: {
  data: ProductDetailsProps["data"];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-t pt-4">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between p-0 h-auto font-medium text-gray-700 hover:bg-transparent"
      >
        <span>SHIPPING NOTES</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {isOpen && (
        <div className="mt-4 text-sm">
          <div className="text-gray-800 leading-relaxed">
            {data.shippingNotes}
          </div>
        </div>
      )}
    </div>
  );
}

// Collapsible How It's Made Component
function CollapsibleHowItsMade({
  data,
}: {
  data: ProductDetailsProps["data"];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-t pt-4">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between p-0 h-auto font-medium text-gray-700 hover:bg-transparent"
      >
        <span>HOW IT&apos;S MADE</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {isOpen && (
        <div className="mt-4 text-sm">
          <div className="text-gray-800 leading-relaxed">{data.howItsMade}</div>
        </div>
      )}
    </div>
  );
}

// Collapsible Behind the Hands Component
function CollapsibleBehindTheHands({
  data,
}: {
  data: ProductDetailsProps["data"];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-t pt-4">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between p-0 h-auto font-medium text-gray-700 hover:bg-transparent"
      >
        <span>BEHIND THE HANDS</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {isOpen && (
        <div className="mt-4 text-sm">
          <div className="text-gray-800 leading-relaxed">
            {data.seller?.behindTheHands}
          </div>
        </div>
      )}
    </div>
  );
}
