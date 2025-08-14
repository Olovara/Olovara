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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import {
  Package,
  ArrowRight,
  ArrowLeft,
  Camera,
  DollarSign,
  FileText,
  Sparkles,
  Lightbulb,
  Heart,
  Upload,
} from "lucide-react";
import OnboardingProgress from "./OnboardingProgress";
import { createFirstProduct } from "@/actions/onboardingActions";
import { toast } from "sonner";

// Product categories for handmade items
const productCategories = [
  { id: "jewelry", name: "Jewelry & Accessories", icon: "💍" },
  { id: "clothing", name: "Clothing & Shoes", icon: "👕" },
  { id: "home", name: "Home & Living", icon: "🏠" },
  { id: "art", name: "Art & Collectibles", icon: "🎨" },
  { id: "toys", name: "Toys & Games", icon: "🧸" },
  { id: "beauty", name: "Beauty & Personal Care", icon: "💄" },
  { id: "books", name: "Books & Media", icon: "📚" },
  { id: "sports", name: "Sports & Outdoors", icon: "⚽" },
  { id: "other", name: "Other", icon: "✨" },
];

// Pricing suggestions based on category
const pricingSuggestions = {
  jewelry: { min: 15, max: 150, avg: 45 },
  clothing: { min: 25, max: 200, avg: 75 },
  home: { min: 20, max: 300, avg: 85 },
  art: { min: 30, max: 500, avg: 120 },
  toys: { min: 15, max: 100, avg: 35 },
  beauty: { min: 10, max: 80, avg: 25 },
  books: { min: 8, max: 50, avg: 20 },
  sports: { min: 20, max: 150, avg: 60 },
  other: { min: 15, max: 200, avg: 50 },
};

export default function CreateFirstProductForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    materials: "",
    dimensions: "",
    weight: "",
    processingTime: "3-5",
  });
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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleContinue = async () => {
    // Basic validation
    if (
      !formData.name.trim() ||
      !formData.category ||
      !formData.description.trim() ||
      !formData.price
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (parseFloat(formData.price) <= 0) {
      toast.error("Price must be greater than 0.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createFirstProduct({
        name: formData.name.trim(),
        category: formData.category,
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        materials: formData.materials.trim(),
        dimensions: formData.dimensions.trim(),
        weight: formData.weight.trim(),
        processingTime: formData.processingTime,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Your first product has been created!");
      router.push("/onboarding/payment-setup");
    } catch (error) {
      console.error("Error creating first product:", error);
      toast.error("Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push("/onboarding/shop-naming");
  };

  const handleSkip = () => {
    router.push("/onboarding/payment-setup");
  };

  const selectedCategory = productCategories.find(
    (cat) => cat.id === formData.category
  );
  const pricingGuide = formData.category
    ? pricingSuggestions[formData.category as keyof typeof pricingSuggestions]
    : null;

  return (
    <div className="space-y-8">
      <OnboardingProgress
        currentStep="create_first_product"
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
                <Package className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Create Your First Product
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 max-w-2xl mx-auto">
              Let&apos;s get you started! Create your first product listing to
              begin your selling journey.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Product Name */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Product Name *
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., Hand-knitted Wool Scarf, Ceramic Coffee Mug"
                className="text-lg p-4"
                maxLength={100}
              />
              <p className="text-sm text-gray-500">
                Be descriptive and include key details that buyers would search
                for
              </p>
            </div>

            {/* Category */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                Category *
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange("category", value)}
              >
                <SelectTrigger className="w-full text-lg p-4">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {productCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description *
              </Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe your product in detail. What makes it special? What materials did you use? What are its dimensions?"
                className="min-h-[120px] text-lg p-4"
                maxLength={1000}
              />
              <p className="text-sm text-gray-500">
                {formData.description.length}/1000 characters
              </p>
            </div>

            {/* Price */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Price (USD) *
              </Label>
              <Input
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                placeholder="0.00"
                type="number"
                step="0.01"
                min="0"
                className="text-lg p-4"
              />
              {pricingGuide && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Pricing Guide:</strong> Similar{" "}
                    {selectedCategory?.name.toLowerCase()} items typically range
                    from ${pricingGuide.min} to ${pricingGuide.max}, with an
                    average of ${pricingGuide.avg}.
                  </p>
                </div>
              )}
            </div>

            {/* Materials */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                Materials Used
              </Label>
              <Input
                value={formData.materials}
                onChange={(e) => handleInputChange("materials", e.target.value)}
                placeholder="e.g., 100% merino wool, sterling silver, ceramic"
                className="text-lg p-4"
              />
            </div>

            {/* Dimensions */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                Dimensions (Optional)
              </Label>
              <Input
                value={formData.dimensions}
                onChange={(e) =>
                  handleInputChange("dimensions", e.target.value)
                }
                placeholder="e.g., 8 inches x 6 inches x 2 inches, 12 inches length"
                className="text-lg p-4"
              />
            </div>

            {/* Weight */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                Weight (Optional)
              </Label>
              <Input
                value={formData.weight}
                onChange={(e) => handleInputChange("weight", e.target.value)}
                placeholder="e.g., 8 oz, 250g"
                className="text-lg p-4"
              />
            </div>

            {/* Processing Time */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                Processing Time
              </Label>
              <Select
                value={formData.processingTime}
                onValueChange={(value) =>
                  handleInputChange("processingTime", value)
                }
              >
                <SelectTrigger className="w-full text-lg p-4">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-2">1-2 business days</SelectItem>
                  <SelectItem value="3-5">3-5 business days</SelectItem>
                  <SelectItem value="1-2 weeks">1-2 weeks</SelectItem>
                  <SelectItem value="2-3 weeks">2-3 weeks</SelectItem>
                  <SelectItem value="3-4 weeks">3-4 weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tips */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Pro Tips for Your First Product
              </h3>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>
                  • Use clear, high-quality photos (you can add these later)
                </li>
                <li>• Be honest about materials and craftsmanship</li>
                <li>• Include all relevant measurements</li>
                <li>• Set a realistic processing time</li>
                <li>
                  • Price competitively but don&apos;t undervalue your work
                </li>
              </ul>
            </div>

            {/* Next Steps Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                What&apos;s Next?
              </h3>
              <p className="text-sm text-blue-800">
                After creating your first product, you&apos;ll be able to add
                photos, set up shipping, and start receiving orders. You can
                always edit your product details later!
              </p>
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
                  disabled={
                    isSubmitting ||
                    !formData.name.trim() ||
                    !formData.category ||
                    !formData.description.trim() ||
                    !formData.price
                  }
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-2"
                >
                  {isSubmitting ? (
                    "Creating..."
                  ) : (
                    <>
                      Create Product
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
