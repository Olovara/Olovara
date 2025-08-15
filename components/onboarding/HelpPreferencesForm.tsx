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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Palette,
  Camera,
  DollarSign,
  Package,
  Calculator,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

import { saveHelpPreferences, getUserFirstName } from "@/actions/onboardingActions";
import { toast } from "sonner";

// Define the help categories with icons and descriptions
const helpCategories = [
  {
    id: "deciding_what_to_sell",
    title: "Deciding What to Sell",
    description: "Help choosing products and finding your niche",
    icon: Lightbulb,
    color: "bg-purple-100 text-purple-800",
  },
  {
    id: "naming_and_branding",
    title: "Naming & Branding",
    description: "Creating your shop name and visual identity",
    icon: Palette,
    color: "bg-purple-100 text-purple-800",
  },
  {
    id: "taking_photos",
    title: "Taking Photos",
    description: "Product photography tips and best practices",
    icon: Camera,
    color: "bg-purple-100 text-purple-800",
  },
  {
    id: "pricing",
    title: "Pricing Strategy",
    description: "Setting competitive prices and profit margins",
    icon: DollarSign,
    color: "bg-purple-100 text-purple-800",
  },
  {
    id: "packing_and_shipping",
    title: "Packing & Shipping",
    description: "Packaging materials and shipping methods",
    icon: Package,
    color: "bg-purple-100 text-purple-800",
  },
  {
    id: "understanding_finances",
    title: "Understanding Finances",
    description: "Tracking sales, expenses, and profitability",
    icon: Calculator,
    color: "bg-purple-100 text-purple-800",
  },
];

export default function HelpPreferencesForm() {
  const router = useRouter();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);

  // Get user's first name for personalization
  useEffect(() => {
    const fetchFirstName = async () => {
      try {
        const result = await getUserFirstName();
        if (result.firstName) {
          setFirstName(result.firstName);
        }
      } catch (error) {
        console.error("Error fetching first name:", error);
      }
    };

    fetchFirstName();
  }, []);



  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleContinue = async () => {
    setIsSubmitting(true);

    try {
      // Save the help preferences to the database
      const result = await saveHelpPreferences({
        helpCategories: selectedCategories,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Help preferences saved!");
      router.push("/onboarding/shop-preferences");
    } catch (error) {
      console.error("Error saving help preferences:", error);
      toast.error("Failed to save help preferences");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.push("/onboarding/shop-preferences");
  };

  const handleBack = () => {
    router.push("/onboarding/welcome");
  };

  return (
    <div className="space-y-8">


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
                <Sparkles className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {firstName ? `Hi, ${firstName}!` : "Hi!"}
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 max-w-2xl mx-auto">
              {firstName 
                ? `Let's get you set up for success, ${firstName}! What areas would you like help with?`
                : "Let's get you set up for success! What areas would you like help with?"
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Help Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {helpCategories.map((category, index) => {
                const IconComponent = category.icon;
                const isSelected = selectedCategories.includes(category.id);

                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        isSelected
                          ? "ring-2 ring-purple-500 bg-purple-50"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => handleCategoryToggle(category.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id={category.id}
                            checked={isSelected}
                            onChange={() => handleCategoryToggle(category.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <div
                                className={`p-2 rounded-lg ${category.color}`}
                              >
                                <IconComponent className="h-4 w-4" />
                              </div>
                              <Label
                                htmlFor={category.id}
                                className="text-base font-semibold cursor-pointer"
                              >
                                {category.title}
                              </Label>
                            </div>
                            <p className="text-sm text-gray-600">
                              {category.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Selected Categories Summary */}
            {selectedCategories.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-purple-50 border border-purple-200 rounded-lg p-4"
              >
                <h3 className="font-semibold text-purple-900 mb-2">
                  We&apos;ll help you with:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map((categoryId) => {
                    const category = helpCategories.find(
                      (c) => c.id === categoryId
                    );
                    return (
                      <Badge
                        key={categoryId}
                        variant="secondary"
                        className="bg-purple-100 text-purple-800"
                      >
                        {category?.title}
                      </Badge>
                    );
                  })}
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

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Skip for now
                </Button>

                                <Button
                  onClick={handleContinue}
                  disabled={isSubmitting}
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
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
