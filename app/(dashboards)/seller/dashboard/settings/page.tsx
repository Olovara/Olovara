import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AddressForm from "@/components/forms/AddressForm";
import ShopQRCode from "@/components/ShopQRCode";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/db";
import ShippingProfilesTable from "./(components)/ShippingProfilesTable";
import { decryptData } from "@/lib/encryption";
import PermissionGate from "@/components/auth/permission-gate";
import { PERMISSIONS } from "@/data/roles-and-permissions";
import ShopPoliciesForm from "@/components/forms/ShopPoliciesForm";
import CountryExclusionsForm from "@/components/forms/CountryExclusionsForm";
import SellerAboutForm from "@/components/forms/SellerAboutForm";
import SellerInfoForm from "@/components/forms/SellerInfoForm";
import SellerPreferencesForm from "@/components/forms/SellerPreferencesForm";

export const metadata = {
  title: "Seller - Settings",
};

export default async function SellerSettings() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

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

  // Decrypt address data if it exists
  let decryptedAddressData = undefined;
  if (seller?.addresses[0]) {
    const address = seller.addresses[0];
    decryptedAddressData = {
      street1: decryptData(address.encryptedStreet, address.streetIV, address.streetSalt),
      street2: address.encryptedStreet2 ? decryptData(address.encryptedStreet2, address.street2IV!, address.street2Salt!) : undefined,
      city: decryptData(address.encryptedCity, address.cityIV, address.citySalt),
      state: address.encryptedState ? decryptData(address.encryptedState, address.stateIV!, address.stateSalt!) : undefined,
      postalCode: decryptData(address.encryptedPostal, address.postalIV, address.postalSalt),
      country: decryptData(address.encryptedCountry, address.countryIV, address.countrySalt),
      isDefault: address.isDefault,
      isBusinessAddress: address.isBusinessAddress,
    };
  }

  return (
    <PermissionGate requiredPermission="MANAGE_SELLER_SETTINGS">
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
        <div>
          <h3 className="text-lg font-medium">Settings</h3>
          <p className="text-sm text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
        <Tabs defaultValue="about" className="space-y-4">
        <div className="relative">
          <TabsList className="w-full overflow-x-auto scrollbar-hide bg-muted/50 border rounded-lg p-1 mx-4 sm:mx-0">
            <div className="flex min-w-max space-x-1 px-1">
              <TabsTrigger value="about" className="flex-shrink-0">About</TabsTrigger>
              <TabsTrigger value="info" className="flex-shrink-0">Info</TabsTrigger>
              <TabsTrigger value="preferences" className="flex-shrink-0">Preferences</TabsTrigger>
              <TabsTrigger value="address" className="flex-shrink-0">Address</TabsTrigger>
              <TabsTrigger value="shipping" className="flex-shrink-0">Shipping</TabsTrigger>
              <TabsTrigger value="policies" className="flex-shrink-0">Policies</TabsTrigger>
              <TabsTrigger value="exclusions" className="flex-shrink-0">Exclusions</TabsTrigger>
              <TabsTrigger value="qr" className="flex-shrink-0">QR Code</TabsTrigger>
            </div>
          </TabsList>
        </div>
          <TabsContent value="about" className="space-y-4">
            <Card className="w-full max-w-none">
              <CardContent className="p-4 sm:p-6">
                <SellerAboutForm />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="info" className="space-y-4">
            <Card className="w-full max-w-none">
              <CardContent className="p-4 sm:p-6">
                <SellerInfoForm />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="preferences" className="space-y-4">
            <Card className="w-full max-w-none">
              <CardContent className="p-4 sm:p-6">
                <SellerPreferencesForm />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="address" className="space-y-4">
            <Card className="w-full max-w-none">
              <CardHeader className="p-4 sm:p-6 pb-0">
                <CardTitle>Business Address</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <AddressForm type="seller" initialData={decryptedAddressData} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="shipping" className="space-y-4">
            <Card className="w-full max-w-none">
              <CardHeader className="p-4 sm:p-6 pb-0">
                <CardTitle>Shipping Profiles</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <ShippingProfilesTable profiles={seller?.shippingProfiles || []} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="policies" className="space-y-4">
            <Card className="w-full max-w-none">
              <CardContent className="p-4 sm:p-6">
                <ShopPoliciesForm />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="exclusions" className="space-y-4">
            <Card className="w-full max-w-none">
              <CardContent className="p-4 sm:p-6">
                <CountryExclusionsForm />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="qr" className="space-y-4">
            <Card className="w-full max-w-none">
              <CardHeader className="p-4 sm:p-6 pb-0">
                <CardTitle>Shop QR Code</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <ShopQRCode shopNameSlug={seller?.shopNameSlug || ""} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
    </PermissionGate>
  );
}
