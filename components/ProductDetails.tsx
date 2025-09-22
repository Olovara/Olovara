"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useCurrency } from "@/hooks/useCurrency";
import ProductActions from "@/components/ProductPageActions";
import { ProductStructuredData } from "@/components/ProductStructuredData";
import GPSRComplianceDisplay from "@/components/product/GPSRComplianceDisplay";
import { ChevronDown, ChevronUp } from "lucide-react";
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
  };
}

export default function ProductDetails({ data }: ProductDetailsProps) {
  const [convertedPrice, setConvertedPrice] = useState<string>("");
  const [convertedFinalPrice, setConvertedFinalPrice] = useState<string>("");
  const [convertedShippingCost, setConvertedShippingCost] =
    useState<string>("");
  const [currentTime, setCurrentTime] = useState(new Date());

  const { formatPrice } = useCurrency();

  // Update current time every minute for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Convert regular price
    formatPrice(data.price, true).then(setConvertedPrice).catch(console.error);

    // Calculate and convert final price (with discount if applicable)
    const finalPrice = data.discount
      ? data.price - (data.price * data.discount) / 100
      : data.price;

    formatPrice(finalPrice, true)
      .then(setConvertedFinalPrice)
      .catch(console.error);

    // Convert shipping cost if it exists
    if (data.shippingCost || data.handlingFee) {
      const totalShipping = (data.shippingCost || 0) + (data.handlingFee || 0);
      formatPrice(totalShipping, true)
        .then(setConvertedShippingCost)
        .catch(console.error);
    }
  }, [
    data.price,
    data.discount,
    data.shippingCost,
    data.handlingFee,
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-1 lg:col-span-2 w-full h-full bg-gray-100 rounded-lg overflow-hidden">
          <ImageSlider urls={data.images} />
        </div>

        <div className="col-span-1 flex flex-col justify-start space-y-3">
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
          <div className="text-gray-700 text-medium">
            <p className="whitespace-pre-line">{data.shortDescription}</p>
          </div>
          {!data.isDigital && data.stock > 0 && data.inStockProcessingTime && (
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
          {/* Quantity Selector & Buy Now Button */}
          <ProductActions
            productId={data.id}
            productName={data.name}
            maxStock={data.stock}
            dropDate={data.dropDate}
            dropTime={data.dropTime}
            isDigital={data.isDigital}
            price={data.price}
            shippingCost={data.shippingCost || 0}
            handlingFee={data.handlingFee || 0}
            sellerId={data.seller?.shopName ? data.seller.shopName : undefined}
            onSale={Boolean(isOnSale)}
            discount={data.discount}
          />

          {/* Collapsible Product Details Section */}
          <CollapsibleProductDetails data={data} />

          {/* How It's Made Section */}
          {data.howItsMade && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">How It&apos;s Made</h3>
              <p className="text-gray-600">{data.howItsMade}</p>
            </div>
          )}

          {/* Shipping Notes Section */}
          {data.shippingNotes && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Shipping Notes</h3>
              <p className="text-gray-600">{data.shippingNotes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Additional Info Section */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="text-gray-700">
          <ProtectedProductDescription
            content={data.description}
            NSFW={Boolean(data.NSFW)}
          />
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
function CollapsibleProductDetails({ data }: { data: ProductDetailsProps['data'] }) {
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
              {data.primaryCategory} {data.secondaryCategory && `> ${data.secondaryCategory}`} {data.tertiaryCategory && `> ${data.tertiaryCategory}`}
            </span>

            {/* Physical Product Details */}
            {!data.isDigital && (
              <>
                {/* Weight */}
                {data.itemWeight && (
                  <>
                    <span className="font-bold text-gray-600">Weight</span>
                    <span className="text-gray-800">{data.itemWeight} {data.itemWeightUnit}</span>
                  </>
                )}

                {/* Dimensions */}
                {(data.itemLength || data.itemWidth || data.itemHeight) && (
                  <>
                    <span className="font-bold text-gray-600">Dimensions</span>
                    <span className="text-gray-800">
                      {data.itemLength || 0}{data.itemDimensionUnit} × {data.itemWidth || 0}{data.itemDimensionUnit} × {data.itemHeight || 0}{data.itemDimensionUnit}
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
            {data.inStockProcessingTime && (
              <>
                <span className="font-bold text-gray-600">Processing Time</span>
                <span className="text-gray-800">{data.inStockProcessingTime} days</span>
              </>
            )}
          </div>
        </div>
      )}
      <div className="mt-4 border-b"></div>
    </div>
  );
}
