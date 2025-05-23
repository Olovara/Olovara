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

export const metadata = {
  title: "Seller - Settings",
};

export default async function SellerSettings() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const memberData = await getMemberData(session.user.id);
  
  // Get seller data to access shopNameSlug
  const seller = await db.seller.findUnique({
    where: { userId: session.user.id },
    select: { 
      shopNameSlug: true,
      addresses: {
        where: { isDefault: true },
        select: {
          id: true,
          encryptedStreet: true,
          encryptedStreet2: true,
          encryptedCity: true,
          encryptedState: true,
          encryptedPostal: true,
          encryptedCountry: true,
          isDefault: true,
          isBusinessAddress: true,
        },
      },
    },
  });
  
  // Provide default values if member data is not available
  const initialData = {
    firstName: memberData?.firstName || "",
    lastName: memberData?.lastName || "",
    userBio: memberData?.userBio || "",
  };

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>
      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="shop">Shop</TabsTrigger>
          <TabsTrigger value="address">Shipping Address</TabsTrigger>
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

              {/* Shop Settings */}
              <TabsContent value="shop">
                <SellerForm />
              </TabsContent>

              {/* Address Settings */}
              <TabsContent value="address">
                <AddressForm 
                  type="seller" 
                  initialData={seller?.addresses[0] ? {
                    street1: seller.addresses[0].encryptedStreet || undefined,
                    street2: seller.addresses[0].encryptedStreet2 || undefined,
                    city: seller.addresses[0].encryptedCity || undefined,
                    state: seller.addresses[0].encryptedState || undefined,
                    postalCode: seller.addresses[0].encryptedPostal || undefined,
                    country: seller.addresses[0].encryptedCountry || undefined,
                    isDefault: seller.addresses[0].isDefault,
                    isBusinessAddress: seller.addresses[0].isBusinessAddress,
                  } : undefined}
                />
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
