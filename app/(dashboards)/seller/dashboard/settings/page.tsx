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
import PermissionGate from "@/components/auth/permission-gate";
import { PERMISSIONS } from "@/data/roles-and-permissions";

export const metadata = {
  title: "Seller - Settings",
};

export default async function SellerSettings() {
  const session = await auth();
  
  if (!session?.user?.id) {
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
    <PermissionGate requiredPermission={"MANAGE_SELLER_SETTINGS" as const}>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Settings</h3>
          <p className="text-sm text-muted-foreground">
            Manage your account settings and preferences.
          </p>
      </div>
        <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="seller">Seller</TabsTrigger>
            <TabsTrigger value="address">Address</TabsTrigger>
            <TabsTrigger value="shipping">Shipping</TabsTrigger>
            <TabsTrigger value="qr">QR Code</TabsTrigger>
        </TabsList>
          <TabsContent value="profile" className="space-y-4">
            <Card>
            <CardHeader>
                <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
                <MemberForm initialData={initialData} />
              </CardContent>
            </Card>
              </TabsContent>
          <TabsContent value="seller" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Seller Information</CardTitle>
              </CardHeader>
              <CardContent>
                <SellerForm />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="address" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Business Address</CardTitle>
              </CardHeader>
              <CardContent>
                <AddressForm type="seller" initialData={decryptedAddressData} />
              </CardContent>
            </Card>
              </TabsContent>
          <TabsContent value="shipping" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Profiles</CardTitle>
              </CardHeader>
              <CardContent>
                <ShippingProfilesTable profiles={seller?.shippingProfiles || []} />
              </CardContent>
            </Card>
              </TabsContent>
          <TabsContent value="qr" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Shop QR Code</CardTitle>
              </CardHeader>
              <CardContent>
                <ShopQRCode shopNameSlug={seller?.shopNameSlug || ""} />
            </CardContent>
          </Card>
          </TabsContent>
        </Tabs>
        </div>
    </PermissionGate>
  );
}
