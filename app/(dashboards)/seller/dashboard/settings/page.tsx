import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { decryptData } from "@/lib/encryption";
import PermissionGate from "@/components/auth/permission-gate";
import { PERMISSIONS } from "@/data/roles-and-permissions";
import SettingsTabsWrapper from "./(components)/SettingsTabsWrapper";

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
        <SettingsTabsWrapper seller={seller} decryptedAddressData={decryptedAddressData} />
        </div>
    </PermissionGate>
  );
}
