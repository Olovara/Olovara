"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AddressForm from "@/components/forms/AddressForm";
import ShopQRCode from "@/components/ShopQRCode";
import ShippingProfilesTable from "./ShippingProfilesTable";
import ShopPoliciesForm from "@/components/forms/ShopPoliciesForm";
import CountryExclusionsForm from "@/components/forms/CountryExclusionsForm";
import SellerAboutForm from "@/components/forms/SellerAboutForm";
import SellerInfoForm from "@/components/forms/SellerInfoForm";
import SellerPreferencesForm from "@/components/forms/SellerPreferencesForm";

interface SettingsTabsWrapperProps {
  seller: any;
  decryptedAddressData: any;
}

export default function SettingsTabsWrapper({ seller, decryptedAddressData }: SettingsTabsWrapperProps) {
  const [activeTab, setActiveTab] = useState("about");

  useEffect(() => {
    // Check if there's a hash in the URL and set the active tab accordingly
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (hash && ['about', 'info', 'preferences', 'address', 'shipping', 'policies', 'exclusions', 'qr'].includes(hash)) {
        setActiveTab(hash);
      }
    }
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update the URL hash without causing a page reload
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${value}`);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4" id="settings-tabs">
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
  );
} 