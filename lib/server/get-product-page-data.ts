import { db } from "@/lib/db";
import { auth } from "@/auth";
import { canUserAccessTestEnvironment } from "@/lib/test-environment";
import { ObjectId } from "mongodb";

export type PrismaProductResult = {
  id: string;
  userId: string;
  name: string;
  urlSlug: string | null;
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
  description: unknown;
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
  safetyWarnings?: string | null;
  materialsComposition?: string | null;
  safeUseInstructions?: string | null;
  ageRestriction?: string | null;
  chokingHazard?: boolean;
  smallPartsWarning?: boolean;
  chemicalWarnings?: string | null;
  careInstructions?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  keywords?: string[];
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  seller: {
    shopName: string;
    shopNameSlug: string;
    userId: string;
    behindTheHands: string | null;
  } | null;
  dropDate: Date | null;
  dropTime: string | null;
  batchNumber?: string | null;
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

export type ProductPageData = PrismaProductResult & {
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
      postalCode: string;
      country: string;
    };
  } | null;
  businessAddress?: {
    street: string;
    street2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  } | null;
};

export async function getProductPageData(
  id: string
): Promise<ProductPageData | null> {
  try {
    if (!ObjectId.isValid(id)) {
      console.error("Invalid ObjectID format:", id);
      return null;
    }

    const session = await auth();
    const canAccessTest = session?.user?.id
      ? await canUserAccessTestEnvironment(session.user.id)
      : false;

    const product = await db.product.findUnique({
      where: {
        id,
        ...(canAccessTest ? {} : { isTestProduct: false }),
      },
      select: {
        id: true,
        userId: true,
        name: true,
        urlSlug: true,
        shortDescription: true,
        shortDescriptionBullets: true,
        options: true,
        images: true,
        price: true,
        currency: true,
        discount: true,
        onSale: true,
        saleStartDate: true,
        saleEndDate: true,
        saleStartTime: true,
        saleEndTime: true,
        description: true,
        status: true,
        isDigital: true,
        stock: true,
        productFile: true,
        handlingFee: true,
        shippingCost: true,
        itemWeight: true,
        itemWeightUnit: true,
        itemLength: true,
        itemWidth: true,
        itemHeight: true,
        itemDimensionUnit: true,
        shippingNotes: true,
        freeShipping: true,
        inStockProcessingTime: true,
        howItsMade: true,
        tags: true,
        materialTags: true,
        primaryCategory: true,
        secondaryCategory: true,
        tertiaryCategory: true,
        sku: true,
        NSFW: true,
        safetyWarnings: true,
        materialsComposition: true,
        safeUseInstructions: true,
        ageRestriction: true,
        chokingHazard: true,
        smallPartsWarning: true,
        chemicalWarnings: true,
        careInstructions: true,
        metaTitle: true,
        metaDescription: true,
        keywords: true,
        ogTitle: true,
        ogDescription: true,
        ogImage: true,
        seller: {
          select: {
            shopName: true,
            shopNameSlug: true,
            userId: true,
            behindTheHands: true,
          },
        },
        dropDate: true,
        dropTime: true,
        batchNumber: true,
        reviews: {
          where: {
            status: "PUBLISHED",
            type: "PRODUCT",
          },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            reviewer: {
              select: {
                id: true,
                username: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      } as Parameters<(typeof db)["product"]["findUnique"]>[0]["select"],
    });

    if (!product) {
      console.error("Product not found:", id);
      return null;
    }

    let responsiblePersonData = null;
    let businessAddressData = null;

    if (product.userId) {
      try {
        const responsiblePerson = await db.responsiblePerson.findUnique({
          where: { sellerId: product.userId },
        });

        const businessAddress = await db.address.findFirst({
          where: {
            sellerId: product.userId,
            isBusinessAddress: true,
          },
        });

        if (responsiblePerson) {
          try {
            const { decryptResponsiblePerson } = await import(
              "@/lib/encryption"
            );

            const decryptedResponsiblePerson = decryptResponsiblePerson({
              encryptedName: responsiblePerson.encryptedName,
              nameIV: responsiblePerson.nameIV,
              nameSalt: responsiblePerson.nameSalt,
              encryptedEmail: responsiblePerson.encryptedEmail,
              emailIV: responsiblePerson.emailIV,
              emailSalt: responsiblePerson.emailSalt,
              encryptedPhone: responsiblePerson.encryptedPhone,
              phoneIV: responsiblePerson.phoneIV,
              phoneSalt: responsiblePerson.phoneSalt,
              encryptedCompanyName: responsiblePerson.encryptedCompanyName,
              companyNameIV: responsiblePerson.companyNameIV,
              companyNameSalt: responsiblePerson.companyNameSalt,
              encryptedVatNumber:
                responsiblePerson.encryptedVatNumber || undefined,
              vatNumberIV: responsiblePerson.vatNumberIV || undefined,
              vatNumberSalt: responsiblePerson.vatNumberSalt || undefined,
              encryptedStreet: responsiblePerson.encryptedStreet,
              streetIV: responsiblePerson.streetIV,
              streetSalt: responsiblePerson.streetSalt,
              encryptedStreet2: responsiblePerson.encryptedStreet2 || undefined,
              street2IV: responsiblePerson.street2IV || undefined,
              street2Salt: responsiblePerson.street2Salt || undefined,
              encryptedCity: responsiblePerson.encryptedCity,
              cityIV: responsiblePerson.cityIV,
              citySalt: responsiblePerson.citySalt,
              encryptedState: responsiblePerson.encryptedState || undefined,
              stateIV: responsiblePerson.stateIV || undefined,
              stateSalt: responsiblePerson.stateSalt || undefined,
              encryptedPostalCode: responsiblePerson.encryptedPostalCode,
              postalCodeIV: responsiblePerson.postalCodeIV,
              postalCodeSalt: responsiblePerson.postalCodeSalt,
              encryptedCountry: responsiblePerson.encryptedCountry,
              countryIV: responsiblePerson.countryIV,
              countrySalt: responsiblePerson.countrySalt,
            });

            responsiblePersonData = {
              name: decryptedResponsiblePerson.name,
              email: decryptedResponsiblePerson.email,
              phone: decryptedResponsiblePerson.phone,
              companyName: decryptedResponsiblePerson.companyName,
              vatNumber: decryptedResponsiblePerson.vatNumber,
              address: decryptedResponsiblePerson.address,
            };
          } catch (error) {
            console.error("Error processing responsible person data:", error);
            responsiblePersonData = null;
          }
        }

        if (businessAddress) {
          try {
            const { decryptAddress } = await import("@/lib/encryption");
            const decryptedAddress = decryptAddress({
              encryptedStreet: businessAddress.encryptedStreet,
              streetIV: businessAddress.streetIV,
              streetSalt: businessAddress.streetSalt,
              encryptedStreet2: businessAddress.encryptedStreet2 || undefined,
              street2IV: businessAddress.street2IV || undefined,
              street2Salt: businessAddress.street2Salt || undefined,
              encryptedCity: businessAddress.encryptedCity,
              cityIV: businessAddress.cityIV,
              citySalt: businessAddress.citySalt,
              encryptedState: businessAddress.encryptedState || undefined,
              stateIV: businessAddress.stateIV || undefined,
              stateSalt: businessAddress.stateSalt || undefined,
              encryptedPostal: businessAddress.encryptedPostal,
              postalIV: businessAddress.postalIV,
              postalSalt: businessAddress.postalSalt,
              encryptedCountry: businessAddress.encryptedCountry,
              countryIV: businessAddress.countryIV,
              countrySalt: businessAddress.countrySalt,
            });

            businessAddressData = {
              street: decryptedAddress.street,
              street2: decryptedAddress.street2,
              city: decryptedAddress.city,
              state: decryptedAddress.state,
              postalCode: decryptedAddress.postalCode,
              country: decryptedAddress.country,
            };
          } catch (error) {
            console.error("Error decrypting business address data:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching seller compliance data:", error);
      }
    }

    return {
      ...product,
      responsiblePerson: responsiblePersonData,
      businessAddress: businessAddressData,
    } as unknown as ProductPageData;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}
