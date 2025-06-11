import { auth } from "@/auth";
import { redirect } from "next/navigation";
import MemberForm from "@/components/forms/MemberForm";
import SellerForm from "@/components/forms/SellerForm";
import AddressForm from "@/components/forms/AddressForm";
import ShopQRCode from "@/components/ShopQRCode";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMemberData } from "@/actions/getMemberData";
import { db } from "@/lib/db";
import ShippingProfilesTable from "./(components)/ShippingProfilesTable";
import { decryptData } from "@/lib/encryption";

export const metadata = {
  title: "Seller - Settings",
};

export default async function SellerSettings() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const memberData = await getMemberData(session.user.id);
  
  // Get seller data to access shopNameSlug and shipping profiles
  const seller = await db.seller.findUnique({
    where: { userId: session.user.id },
    select: { 
      shopNameSlug: true,
      addresses: {
        where: {
          isDefault: true
        },
        select: {
          id: true,
          encryptedStreet: true,
          streetIV: true,
          streetSalt: true,
          encryptedStreet2: true,
          street2IV: true,
          street2Salt: true,
          encryptedCity: true,
          cityIV: true,
          citySalt: true,
          encryptedState: true,
          stateIV: true,
          stateSalt: true,
          encryptedPostal: true,
          postalIV: true,
          postalSalt: true,
          encryptedCountry: true,
          countryIV: true,
          countrySalt: true,
          isDefault: true,
          isBusinessAddress: true
        }
      },
      shippingProfiles: {
        select: {
          id: true,
          name: true,
          isDefault: true,
          countryOfOrigin: true,
          sellerId: true,
          createdAt: true,
          updatedAt: true,
          rates: {
            select: {
              id: true,
              zone: true,
              isInternational: true,
              price: true,
              currency: true,
              estimatedDays: true,
              additionalItem: true,
              serviceLevel: true,
              isFreeShipping: true
            }
          }
        }
      }
    }
  });
  
  // Provide default values if member data is not available
  const initialData = {
    firstName: memberData?.firstName || "",
    lastName: memberData?.lastName || "",
    userBio: memberData?.userBio || "",
  };

  // Decrypt address data if it exists
  let decryptedAddressData = undefined;
  if (seller?.addresses[0]) {
    const address = seller.addresses[0];
    decryptedAddressData = {
      street1: await decryptData(address.encryptedStreet, address.streetIV, address.streetSalt),
      street2: address.encryptedStreet2 ? await decryptData(address.encryptedStreet2, address.street2IV!, address.street2Salt!) : undefined,
      city: await decryptData(address.encryptedCity, address.cityIV, address.citySalt),
      state: address.encryptedState ? await decryptData(address.encryptedState, address.stateIV!, address.stateSalt!) : undefined,
      postalCode: await decryptData(address.encryptedPostal, address.postalIV, address.postalSalt),
      country: await decryptData(address.encryptedCountry, address.countryIV, address.countrySalt),
      isDefault: address.isDefault,
      isBusinessAddress: address.isBusinessAddress,
    };
  }

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>
      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="address">Business Address</TabsTrigger>
          <TabsTrigger value="shop">Shop</TabsTrigger>
          <TabsTrigger value="shipping">Shipping Profiles</TabsTrigger>
          <TabsTrigger value="qrcode">QR Code</TabsTrigger>
        </TabsList>
        <div className="flex-1 pt-2">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Personal Settings */}
              <TabsContent value="personal">
                <MemberForm initialData={initialData} />
              </TabsContent>

              {/* Address Settings */}
              <TabsContent value="address">
                <AddressForm 
                  type="seller" 
                  initialData={decryptedAddressData}
                />
              </TabsContent>

              {/* Shop Settings */}
              <TabsContent value="shop">
                <SellerForm />
              </TabsContent>

              {/* Shipping Profiles Settings */}
              <TabsContent value="shipping">
                <ShippingProfilesTable profiles={seller?.shippingProfiles || []} />
              </TabsContent>

              {/* QR Code Settings */}
              <TabsContent value="qrcode">
                {seller?.shopNameSlug ? (
                  <ShopQRCode shopNameSlug={seller.shopNameSlug} />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Please set up your shop information first to generate a QR code.
                    </p>
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </main>
  );
}
