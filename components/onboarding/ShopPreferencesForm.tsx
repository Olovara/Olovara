"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Globe,
  DollarSign,
  Languages,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import OnboardingProgress from "./OnboardingProgress";
import { saveShopPreferences } from "@/actions/onboardingActions";
import { toast } from "sonner";

// Define available countries with their currencies
const countries = [
  { code: "US", name: "United States", currency: "USD", flag: "🇺🇸" },
  { code: "CA", name: "Canada", currency: "CAD", flag: "🇨🇦" },
  { code: "GB", name: "United Kingdom", currency: "GBP", flag: "🇬🇧" },
  { code: "AU", name: "Australia", currency: "AUD", flag: "🇦🇺" },
  { code: "DE", name: "Germany", currency: "EUR", flag: "🇩🇪" },
  { code: "FR", name: "France", currency: "EUR", flag: "🇫🇷" },
  { code: "IT", name: "Italy", currency: "EUR", flag: "🇮🇹" },
  { code: "ES", name: "Spain", currency: "EUR", flag: "🇪🇸" },
  { code: "NL", name: "Netherlands", currency: "EUR", flag: "🇳🇱" },
  { code: "JP", name: "Japan", currency: "JPY", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", currency: "KRW", flag: "🇰🇷" },
  { code: "SG", name: "Singapore", currency: "SGD", flag: "🇸🇬" },
];

// Define currencies
const currencies = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
];

// Define languages (for future implementation)
const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
];

export default function ShopPreferencesForm() {
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onboardingSteps = [
    {
      id: "shop_preferences",
      title: "Shop Setup",
      path: "/onboarding/shop-preferences",
    },
    { id: "shop_naming", title: "Shop Name", path: "/onboarding/shop-naming" },
    {
      id: "create_first_product",
      title: "First Product",
      path: "/onboarding/create-first-product",
    },
    {
      id: "payment_setup",
      title: "Get Paid",
      path: "/onboarding/payment-setup",
    },
    { id: "dashboard", title: "Dashboard", path: "/seller/dashboard" },
  ];

  // Auto-select currency when country changes
  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    const country = countries.find((c) => c.code === countryCode);
    if (country) {
      setSelectedCurrency(country.currency);
    }
  };

  const handleContinue = async () => {
    if (!selectedCountry || !selectedCurrency) {
      toast.error("Please select your country and currency.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Save the shop preferences to the database
      const result = await saveShopPreferences({
        country: selectedCountry,
        currency: selectedCurrency,
        language: selectedLanguage,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Shop preferences saved!");
      router.push("/onboarding/shop-naming");
    } catch (error) {
      console.error("Error saving shop preferences:", error);
      toast.error("Failed to save shop preferences");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push("/onboarding/help-preferences");
  };

  const selectedCountryData = countries.find((c) => c.code === selectedCountry);
  const selectedCurrencyData = currencies.find(
    (c) => c.code === selectedCurrency
  );

  return (
    <div className="space-y-8">
      <OnboardingProgress
        currentStep="shop_preferences"
        steps={onboardingSteps}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl mx-auto"
      >
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full">
                <Globe className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Shop Preferences
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Let&apos;s set up your shop location and preferences to
              personalize your experience.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Country Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Where are you located? *
              </Label>
              <Select
                value={selectedCountry}
                onValueChange={handleCountryChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      <div className="flex items-center gap-2">
                        <span>{country.flag}</span>
                        <span>{country.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Currency Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                What currency do you want to use? *
              </Label>
              <Select
                value={selectedCurrency}
                onValueChange={setSelectedCurrency}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <div className="flex items-center gap-2">
                        <span>{currency.symbol}</span>
                        <span>
                          {currency.name} ({currency.code})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Language Selection (Coming Soon) */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <Languages className="h-4 w-4" />
                Language Preference
                <Badge variant="secondary" className="text-xs">
                  Coming Soon
                </Badge>
              </Label>
              <Select
                value={selectedLanguage}
                onValueChange={setSelectedLanguage}
                disabled
              >
                <SelectTrigger className="w-full opacity-50">
                  <SelectValue placeholder="Select your language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((language) => (
                    <SelectItem key={language.code} value={language.code}>
                      <div className="flex items-center gap-2">
                        <span>{language.flag}</span>
                        <span>{language.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                Language support will be available in a future update.
              </p>
            </div>

            {/* Summary */}
            {(selectedCountry || selectedCurrency) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-purple-50 border border-purple-200 rounded-lg p-4"
              >
                <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Your Preferences:
                </h3>
                <div className="space-y-1">
                  {selectedCountryData && (
                    <p className="text-sm text-purple-800">
                      <strong>Country:</strong> {selectedCountryData.flag}{" "}
                      {selectedCountryData.name}
                    </p>
                  )}
                  {selectedCurrencyData && (
                    <p className="text-sm text-purple-800">
                      <strong>Currency:</strong> {selectedCurrencyData.symbol}{" "}
                      {selectedCurrencyData.name}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              <Button
                onClick={handleContinue}
                disabled={isSubmitting || !selectedCountry || !selectedCurrency}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-2"
              >
                {isSubmitting ? (
                  "Setting up..."
                ) : (
                  <>
                    Complete Setup
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
