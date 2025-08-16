"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Store,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Lightbulb,
  Heart,
} from "lucide-react";

import { saveShopName } from "@/actions/onboardingActions";
import { toast } from "sonner";
import { StepIndicator } from "@/components/onboarding/StepIndicator";

// Shop name suggestions based on common handmade categories
const shopNameSuggestions = [
  {
    category: "Knitting & Crochet",
    names: [
      "CozyStitches",
      "WoollyWonder",
      "KnitCraft",
      "YarnDreams",
      "StitchLove",
    ],
  },
  {
    category: "Jewelry",
    names: [
      "SparkleCraft",
      "GemstoneMagic",
      "BeadedBeauty",
      "MetalWorks",
      "JewelBox",
    ],
  },
  {
    category: "Ceramics & Pottery",
    names: [
      "ClayCreations",
      "PotteryParadise",
      "CeramicDreams",
      "EarthArt",
      "ClayCraft",
    ],
  },
  {
    category: "Woodworking",
    names: [
      "WoodWorks",
      "TimberCraft",
      "CarvedCreations",
      "WoodenWonders",
      "SawdustArt",
    ],
  },
  {
    category: "General Handmade",
    names: [
      "HandmadeHaven",
      "CraftCorner",
      "ArtisanAlley",
      "CreativeCove",
      "MakerSpace",
    ],
  },
];

export default function ShopNamingForm() {
  const router = useRouter();
  const [shopName, setShopName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameValidation, setNameValidation] = useState<{
    isValid: boolean;
    message: string;
    type: "success" | "error" | "warning" | "info";
  } | null>(null);



  // Validate shop name as user types
  useEffect(() => {
    if (!shopName) {
      setNameValidation(null);
      return;
    }

    const trimmedName = shopName.trim();

    // Basic validation rules
    if (trimmedName.length < 3) {
      setNameValidation({
        isValid: false,
        message: "Shop name must be at least 3 characters long",
        type: "error",
      });
    } else if (trimmedName.length > 30) {
      setNameValidation({
        isValid: false,
        message: "Shop name must be 30 characters or less",
        type: "error",
      });
    } else if (!/^[a-zA-Z0-9\s\-_&]+$/.test(trimmedName)) {
      setNameValidation({
        isValid: false,
        message:
          "Shop name can only contain letters, numbers, spaces, hyphens, underscores, and ampersands",
        type: "error",
      });
    } else if (trimmedName.toLowerCase().includes("yarnnu")) {
      setNameValidation({
        isValid: false,
        message: "Shop name cannot contain 'Yarnnu'",
        type: "error",
      });
    } else {
      // Check for common words that might be taken
      const commonWords = ["shop", "store", "market", "boutique", "studio"];
      const hasCommonWord = commonWords.some((word) =>
        trimmedName.toLowerCase().includes(word)
      );

      if (hasCommonWord) {
        setNameValidation({
          isValid: true,
          message: "Good! This name looks available",
          type: "success",
        });
      } else {
        setNameValidation({
          isValid: true,
          message: "Great name! It's unique and memorable",
          type: "success",
        });
      }
    }
  }, [shopName]);

  const handleContinue = async () => {
    if (!shopName.trim() || !nameValidation?.isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Save the shop name to the database
      const result = await saveShopName({
        shopName: shopName.trim(),
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Shop name saved!");
      router.push("/onboarding/create-first-product");
    } catch (error) {
      console.error("Error saving shop name:", error);
      toast.error("Failed to save shop name");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push("/onboarding/shop-preferences");
  };

  const handleSuggestionClick = (suggestion: string) => {
    setShopName(suggestion);
  };

  const getValidationIcon = () => {
    if (!nameValidation) return null;

    switch (nameValidation.type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getValidationColor = () => {
    if (!nameValidation) return "";

    switch (nameValidation.type) {
      case "success":
        return "border-green-200 bg-green-50 text-green-800";
      case "error":
        return "border-red-200 bg-red-50 text-red-800";
      case "warning":
        return "border-yellow-200 bg-yellow-50 text-yellow-800";
      default:
        return "border-blue-200 bg-blue-50 text-blue-800";
    }
  };

  return (
    <div className="space-y-8">
      {/* Step Indicator */}
      <div className="w-full max-w-4xl mx-auto">
        <StepIndicator currentStep="shop-naming" className="mb-8" />
      </div>

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
                <Store className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Name Your Shop
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose a memorable name that reflects your unique style and
              handmade creations.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Shop Name Input */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <Store className="h-4 w-4" />
                Shop Name *
              </Label>
              <Input
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Enter your shop name..."
                className="text-lg p-4"
                maxLength={30}
              />

              {/* Character count */}
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{shopName.length}/30 characters</span>
                {nameValidation && (
                  <div
                    className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getValidationColor()}`}
                  >
                    {getValidationIcon()}
                    <span className="text-sm font-medium">
                      {nameValidation.message}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Name Guidelines */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Naming Guidelines
              </h3>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• 3-30 characters long</li>
                <li>
                  • Letters, numbers, spaces, hyphens, underscores, and
                  ampersands only
                </li>
                <li>• Cannot contain &quot;Yarnnu&quot;</li>
                <li>• Should reflect your style and products</li>
                <li>• Easy to remember and spell</li>
              </ul>
            </div>

            {/* Name Suggestions */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Need inspiration? Try these:
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shopNameSuggestions.map((category) => (
                  <div key={category.category} className="space-y-2">
                    <h4 className="font-medium text-gray-700">
                      {category.category}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {category.names.map((name) => (
                        <Badge
                          key={name}
                          variant="outline"
                          className="cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-colors"
                          onClick={() => handleSuggestionClick(name)}
                        >
                          {name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Pro Tips
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use your name or a personal touch for authenticity</li>
                <li>
                  • Include your craft type (e.g., &quot;Knit&quot;,
                  &quot;Ceramic&quot;, &quot;Wood&quot;)
                </li>
                <li>• Keep it simple and easy to pronounce</li>
                <li>• Avoid numbers unless they&apos;re meaningful</li>
                <li>
                  • Check that it&apos;s not too similar to existing shops
                </li>
              </ul>
            </div>

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
                disabled={
                  isSubmitting || !shopName.trim() || !nameValidation?.isValid
                }
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-2"
              >
                {isSubmitting ? (
                  "Saving..."
                ) : (
                  <>
                    Continue
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
