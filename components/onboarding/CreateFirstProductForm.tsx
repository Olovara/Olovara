"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Truck,
  AlertTriangle,
  Info,
  Plus,
} from "lucide-react";

import { createFirstProduct } from "@/actions/onboardingActions";
import { toast } from "sonner";
import { EEA_COUNTRIES } from "@/lib/gpsr-compliance";

// Simplified product schema for onboarding
const FirstProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(100),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000),
  price: z.number().min(0.01, "Price must be greater than 0"),
  materials: z.string().optional(),
  dimensions: z.string().optional(),
  weight: z.string().optional(),
  processingTime: z.string().default("3-5"),
  isDigital: z.boolean().default(false),
  freeShipping: z.boolean().default(false),
  shippingCost: z.number().min(0).default(0),
  shippingProfileId: z.string().optional(),
});

type FirstProductFormValues = z.infer<typeof FirstProductSchema>;

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

// Shipping option creation schema
const ShippingOptionSchema = z.object({
  name: z.string().min(1, "Shipping option name is required"),
  price: z.number().min(0, "Price must be 0 or greater"),
  estimatedDays: z.string().min(1, "Estimated delivery time is required"),
  isFreeShipping: z.boolean().default(false),
});

type ShippingOptionFormValues = z.infer<typeof ShippingOptionSchema>;

interface ShippingOption {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
  isFreeShipping: boolean;
}

export default function CreateFirstProductForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sellerCountry, setSellerCountry] = useState<string>("");
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [isCreatingShipping, setIsCreatingShipping] = useState(false);

  const form = useForm<FirstProductFormValues>({
    resolver: zodResolver(FirstProductSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      price: 0,
      materials: "",
      dimensions: "",
      weight: "",
      processingTime: "3-5",
      isDigital: false,
      freeShipping: false,
      shippingCost: 0,
    },
  });

  const shippingForm = useForm<ShippingOptionFormValues>({
    resolver: zodResolver(ShippingOptionSchema),
    defaultValues: {
      name: "",
      price: 0,
      estimatedDays: "",
      isFreeShipping: false,
    },
  });

  const { watch, setValue } = form;
  const isDigital = watch("isDigital");
  const freeShipping = watch("freeShipping");
  const selectedCategory = watch("category");

  // Fetch seller's country and existing shipping options
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch seller's country
        const countryResponse = await fetch("/api/seller/country");
        if (countryResponse.ok) {
          const countryData = await countryResponse.json();
          setSellerCountry(countryData.country);
        }

        // Fetch existing shipping options
        const shippingResponse = await fetch("/api/shipping-profiles");
        if (shippingResponse.ok) {
          const shippingData = await shippingResponse.json();
          setShippingOptions(shippingData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Check if seller is in EU/EEA
  const isSellerInEU = sellerCountry && EEA_COUNTRIES.includes(sellerCountry.toUpperCase());

  const handleSubmit = async (data: FirstProductFormValues) => {
    setIsSubmitting(true);

    try {
      const result = await createFirstProduct({
        name: data.name.trim(),
        category: data.category,
        description: data.description.trim(),
        price: data.price,
        materials: data.materials?.trim() || "",
        dimensions: data.dimensions?.trim() || "",
        weight: data.weight?.trim() || "",
        processingTime: data.processingTime,
        isDigital: data.isDigital,
        freeShipping: data.freeShipping,
        shippingCost: data.shippingCost,
        shippingProfileId: data.shippingProfileId,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Success!");
      router.push("/onboarding/payment-setup");
    } catch (error) {
      console.error("Error creating first product:", error);
      toast.error("Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateShippingOption = async (data: ShippingOptionFormValues) => {
    setIsCreatingShipping(true);

    try {
      const response = await fetch("/api/shipping-profiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          isDefault: shippingOptions.length === 0,
          countryOfOrigin: sellerCountry,
          rates: [
            {
              zone: "Domestic",
              price: data.isFreeShipping ? 0 : data.price * 100, // Convert to cents
              currency: "USD",
              estimatedDays: parseInt(data.estimatedDays),
              additionalItem: null,
              serviceLevel: "Standard",
              isFreeShipping: data.isFreeShipping,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create shipping option");
      }

      const newShippingOption = await response.json();
      setShippingOptions([...shippingOptions, newShippingOption]);
      setValue("shippingProfileId", newShippingOption.id);
      setShowShippingModal(false);
      shippingForm.reset();
      toast.success("Shipping option created successfully!");
    } catch (error) {
      console.error("Error creating shipping option:", error);
      toast.error("Failed to create shipping option");
    } finally {
      setIsCreatingShipping(false);
    }
  };

  const handleBack = () => {
    router.push("/onboarding/shop-naming");
  };

  const handleSkip = () => {
    router.push("/onboarding/payment-setup");
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
                <Package className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Create Your First Product
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 max-w-2xl mx-auto">
              Let&apos;s get you started! Create your first product listing to begin your selling journey.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
              {/* Basic Information Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                </div>

                {/* Product Name */}
                <div className="space-y-3">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Product Name *
                  </Label>
                  <Input
                    {...form.register("name")}
                    placeholder="e.g., Hand-knitted Wool Scarf, Ceramic Coffee Mug"
                    className="text-lg p-4"
                    maxLength={100}
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    Be descriptive and include key details that buyers would search for
                  </p>
                </div>

                {/* Category */}
                <div className="space-y-3">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Category *
                  </Label>
                  <Select onValueChange={(value) => setValue("category", value)}>
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
                  {form.formState.errors.category && (
                    <p className="text-sm text-red-600">{form.formState.errors.category.message}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Description *
                  </Label>
                  <Textarea
                    {...form.register("description")}
                    placeholder="Describe your product in detail. What makes it special? What materials did you use?"
                    className="min-h-[120px] text-lg p-4"
                    maxLength={1000}
                  />
                  {form.formState.errors.description && (
                    <p className="text-sm text-red-600">{form.formState.errors.description.message}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    {form.watch("description")?.length || 0}/1000 characters
                  </p>
                </div>

                {/* Price */}
                <div className="space-y-3">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Price (USD) *
                  </Label>
                  <Input
                    {...form.register("price", { valueAsNumber: true })}
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    min="0"
                    className="text-lg p-4"
                  />
                  {form.formState.errors.price && (
                    <p className="text-sm text-red-600">{form.formState.errors.price.message}</p>
                  )}
                </div>

                {/* Digital Product Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isDigital"
                    checked={isDigital}
                    onCheckedChange={(checked) => setValue("isDigital", checked as boolean)}
                  />
                  <Label htmlFor="isDigital" className="text-base font-medium">
                    This is a digital product (downloadable file, digital art, etc.)
                  </Label>
                </div>
              </div>

              {/* Physical Product Details */}
              {!isDigital && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold">Product Details</h3>
                  </div>

                  {/* Materials */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Materials Used
                    </Label>
                    <Input
                      {...form.register("materials")}
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
                      {...form.register("dimensions")}
                      placeholder="e.g., 8 inches x 6 inches x 2 inches"
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
                      {...form.register("weight")}
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
                    <Select onValueChange={(value) => setValue("processingTime", value)}>
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
                </div>
              )}

              {/* Shipping Section */}
              {!isDigital && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold">Shipping</h3>
                  </div>

                  {/* Free Shipping Checkbox */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="freeShipping"
                      checked={freeShipping}
                      onCheckedChange={(checked) => {
                        setValue("freeShipping", checked as boolean);
                        if (checked) {
                          setValue("shippingCost", 0);
                        }
                      }}
                    />
                    <Label htmlFor="freeShipping" className="text-base font-medium">
                      Offer free shipping
                    </Label>
                  </div>

                  {/* Shipping Cost */}
                  {!freeShipping && (
                    <div className="space-y-3">
                      <Label className="text-base font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Shipping Cost (USD)
                      </Label>
                      <Input
                        {...form.register("shippingCost", { valueAsNumber: true })}
                        placeholder="0.00"
                        type="number"
                        step="0.01"
                        min="0"
                        className="text-lg p-4"
                      />
                    </div>
                  )}

                  {/* Shipping Options */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Shipping Options
                      </Label>
                      <Dialog open={showShippingModal} onOpenChange={setShowShippingModal}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Create Shipping Option
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Create Shipping Option</DialogTitle>
                            <DialogDescription>
                              Set up a shipping option for your products.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={shippingForm.handleSubmit(handleCreateShippingOption)} className="space-y-4">
                            <div className="space-y-2">
                              <Label>Name</Label>
                              <Input
                                {...shippingForm.register("name")}
                                placeholder="e.g., Standard Shipping"
                              />
                              {shippingForm.formState.errors.name && (
                                <p className="text-sm text-red-600">{shippingForm.formState.errors.name.message}</p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label>Price (USD)</Label>
                              <Input
                                {...shippingForm.register("price", { valueAsNumber: true })}
                                type="number"
                                step="0.01"
                                min="0"
                                disabled={shippingForm.watch("isFreeShipping")}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Estimated Delivery (days)</Label>
                              <Input
                                {...shippingForm.register("estimatedDays")}
                                placeholder="e.g., 3-5"
                              />
                              {shippingForm.formState.errors.estimatedDays && (
                                <p className="text-sm text-red-600">{shippingForm.formState.errors.estimatedDays.message}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="isFreeShipping"
                                checked={shippingForm.watch("isFreeShipping")}
                                onCheckedChange={(checked) => {
                                  shippingForm.setValue("isFreeShipping", checked as boolean);
                                  if (checked) {
                                    shippingForm.setValue("price", 0);
                                  }
                                }}
                              />
                              <Label htmlFor="isFreeShipping">Free shipping</Label>
                            </div>
                            <div className="flex gap-2 pt-4">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowShippingModal(false)}
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                disabled={isCreatingShipping}
                                className="flex-1"
                              >
                                {isCreatingShipping ? "Creating..." : "Create"}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                    {shippingOptions.length > 0 ? (
                      <div className="space-y-2">
                        {shippingOptions.map((option) => (
                          <div
                            key={option.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{option.name}</p>
                              <p className="text-sm text-gray-600">
                                {option.isFreeShipping ? "Free" : `$${option.price}`} • {option.estimatedDays} days
                              </p>
                            </div>
                            <Checkbox
                              checked={form.watch("shippingProfileId") === option.id}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setValue("shippingProfileId", option.id);
                                }
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No shipping options created yet. Create one to continue.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* EU Compliance Alert */}
              {isSellerInEU && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Selling to EU buyers?</strong> You&apos;ll need to provide GPSR product safety details before your products can go live in those countries. You can still sell elsewhere without this step.
                  </AlertDescription>
                </Alert>
              )}

              {/* Tips */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Pro Tips for Your First Product
                </h3>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• Use clear, high-quality photos (you can add these later)</li>
                  <li>• Be honest about materials and craftsmanship</li>
                  <li>• Include all relevant measurements</li>
                  <li>• Set a realistic processing time</li>
                  <li>• Price competitively but don&apos;t undervalue your work</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSkip}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Skip for now
                  </Button>

                  <Button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !form.watch("name")?.trim() ||
                      !form.watch("category") ||
                      !form.watch("description")?.trim() ||
                      !form.watch("price") ||
                      (!isDigital && shippingOptions.length === 0)
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
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
