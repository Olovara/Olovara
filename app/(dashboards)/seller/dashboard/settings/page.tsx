import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import PermissionGate from "@/components/auth/permission-gate";
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
      // SEO fields
      metaTitle: true,
      metaDescription: true,
      keywords: true,
      tags: true,
      ogTitle: true,
      ogDescription: true,
      ogImage: true,
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



  return (
    <PermissionGate requiredPermission="MANAGE_SELLER_SETTINGS">
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
        <div>
          <h3 className="text-lg font-medium">Settings</h3>
          <p className="text-sm text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
        <SettingsTabsWrapper seller={seller} />
        </div>
    </PermissionGate>
  );
}
