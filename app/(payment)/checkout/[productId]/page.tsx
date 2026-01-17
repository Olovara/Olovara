"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import DiscountCodeInput from "@/components/DiscountCodeInput";
import QuantitySelector from "@/components/QuantitySelector";
import { useAbandonedCart, useFormTracking } from "@/hooks/use-abandoned-cart";
import { useMarketplaceAnalytics } from "@/hooks/use-posthog";
import { Lock, Shield, Truck, CreditCard, CheckCircle, ArrowLeft } from "lucide-react";
import { useLocation } from "@/hooks/useLocation";
import { SUPPORTED_COUNTRIES, type Country } from "@/data/countries";
import { ReCaptcha } from "@/components/ui/recaptcha";
import EmbeddedPaymentForm from "@/components/EmbeddedPaymentForm";
import { useCurrentUser } from "@/hooks/use-current-user";

// Placeholder for product fetch (replace with real hook or API call)
async function fetchProduct(productId: string) {
  const response = await fetch(`/api/products/${productId}/checkout`);
  if (!response.ok) {
    throw new Error('Failed to fetch product');
  }
  return response.json();
}

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.productId as string;
  const { locationPreferences } = useLocation();
  const currentUser = useCurrentUser();

  // Get user's detected country or default to US
  const userCountry = locationPreferences?.countryCode || 'US';

  // State for product and form data
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string>("");
  const [shouldTriggerRecaptcha, setShouldTriggerRecaptcha] = useState(false);
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);
  const [appliedDiscountCode, setAppliedDiscountCode] = useState<string>("");
  const [appliedDiscountAmount, setAppliedDiscountAmount] = useState<number>(0);
  const [buyerEmail, setBuyerEmail] = useState<string>("");
  const [shippingAddress, setShippingAddress] = useState({
    name: "",
    street: "",
    city: "",
    state: "",
    postal: "",
    country: userCountry,
  });
  const [billingAddress, setBillingAddress] = useState({
    name: "",
    street: "",
    city: "",
    state: "",
    postal: "",
    country: userCountry,
  });
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [orderInstructions, setOrderInstructions] = useState<string>("");
  
  // Embedded payment form state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentCurrency, setPaymentCurrency] = useState<string>("USD");

  // Update country when location is detected
  useEffect(() => {
    if (locationPreferences?.countryCode) {
      const detectedCountry = locationPreferences.countryCode;
      // Check if the detected country is in our supported list
      const isValidCountry = SUPPORTED_COUNTRIES.some(country => country.code === detectedCountry);
      
      if (isValidCountry) {
        setShippingAddress(prev => ({ ...prev, country: detectedCountry }));
        setBillingAddress(prev => ({ ...prev, country: detectedCountry }));
      }
    }
  }, [locationPreferences?.countryCode]);

  // Get quantity and order instructions from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlQuantity = urlParams.get('quantity');
    if (urlQuantity) {
      setQuantity(parseInt(urlQuantity));
    }
    const urlInstructions = urlParams.get('instructions');
    if (urlInstructions) {
      setOrderInstructions(decodeURIComponent(urlInstructions));
    }
  }, []);

  // Fetch product info
  useEffect(() => {
    fetchProduct(productId).then(setProduct);
  }, [productId]);

  // Pre-fill email if user is logged in (only once when user email becomes available)
  useEffect(() => {
    if (currentUser?.email && !buyerEmail) {
      setBuyerEmail(currentUser.email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.email]);

  // Calculate prices
  const subtotal = product ? product.price * quantity : 0;
  const saleDiscount = product && product.onSale && product.discount ? Math.round(product.price * (product.discount / 100)) * quantity : 0;
  const shipping = product && !product.isDigital ? (product.shippingCost + product.handlingFee) : 0;
  const total = subtotal - saleDiscount - appliedDiscountAmount + shipping;

  // Abandoned cart tracking
  const cartData = useMemo(() => {
    if (!product) return null;
    
    const subtotal = product.price * quantity;
    const saleDiscount = product.onSale && product.discount ? Math.round(product.price * (product.discount / 100)) * quantity : 0;
    const shipping = !product.isDigital ? (product.shippingCost + product.handlingFee) : 0;
    const total = subtotal - saleDiscount - appliedDiscountAmount + shipping;
    
    return {
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity,
      total,
      isDigital: product.isDigital,
      sellerId: product.seller?.id,
      discountCode: appliedDiscountCode,
      discountAmount: appliedDiscountAmount,
      currency: product.currency,
      shippingCost: !product.isDigital ? product.shippingCost : 0,
      handlingFee: !product.isDigital ? product.handlingFee : 0,
      saleDiscount,
    };
  }, [product, quantity, appliedDiscountCode, appliedDiscountAmount]);

  const {
    startTracking,
    completeStep,
    abandonCart,
    completeCheckout,
    trackError,
    trackPaymentIntentCreated,
    trackPaymentFormDisplayed,
    trackPaymentAttempt,
    trackPaymentProcessing,
    isTracking,
    sessionId
  } = useAbandonedCart(cartData || {
    productId: '',
    productName: '',
    price: 0,
    quantity: 1,
    total: 0,
    isDigital: false,
  });

  const {
    trackFieldInteraction,
    trackFormError,
    trackFormComplete
  } = useFormTracking('shipping_address', cartData || {
    productId: '',
    productName: '',
    price: 0,
    quantity: 1,
    total: 0,
    isDigital: false,
  });

  // Start tracking when product loads
  useEffect(() => {
    if (product && cartData && !isTracking && cartData.productId) {
      startTracking();
    }
  }, [product, cartData, startTracking, isTracking]);

  // Track quantity changes
  useEffect(() => {
    if (isTracking && product) {
      completeStep('quantity_selected', { quantity });
    }
  }, [quantity, isTracking, product, completeStep]);

  // Discount code handlers
  const handleDiscountApplied = (code: string, amount: number) => {
    setAppliedDiscountCode(code);
    setAppliedDiscountAmount(amount);
    
    if (isTracking) {
      completeStep('discount_applied', { code, amount });
    }
  };
  
  const handleDiscountRemoved = () => {
    setAppliedDiscountCode("");
    setAppliedDiscountAmount(0);
    
    if (isTracking) {
      completeStep('discount_removed');
    }
  };

  // Shipping address change handler
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({ ...prev, [name]: value }));
    
    // Track field interaction
    trackFieldInteraction(name);
  };

  // Billing address change handler
  const handleBillingAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBillingAddress(prev => ({ ...prev, [name]: value }));
    
    // Track field interaction
    trackFieldInteraction(`billing_${name}`);
  };

  // Handle same as shipping checkbox
  const handleSameAsShippingChange = (checked: boolean) => {
    setSameAsShipping(checked);
    if (checked) {
      setBillingAddress(shippingAddress);
    }
    
    // Track billing address preference
    if (isTracking) {
      completeStep('billing_address_preference', { sameAsShipping: checked });
    }
  };

  // Validate all fields before proceeding
  const validate = () => {
    if (!product) return false;
    
    if (!quantity || quantity < 1 || quantity > product.stock) {
      trackFormError('quantity', 'Invalid quantity');
      toast.error("Invalid quantity");
      return false;
    }
    
    // Validate email (required for all checkouts)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!buyerEmail || !buyerEmail.trim()) {
      trackFormError('email', 'Email is required');
      toast.error("Please enter your email address");
      return false;
    }
    if (!emailRegex.test(buyerEmail)) {
      trackFormError('email', 'Invalid email format');
      toast.error("Please enter a valid email address");
      return false;
    }
    
    if (!product.isDigital) {
      // Validate shipping address
      for (const field of ["name", "street", "city", "state", "postal", "country"]) {
        if (!shippingAddress[field as keyof typeof shippingAddress]) {
          trackFormError(field, 'Required field missing');
          toast.error("Please fill out all shipping address fields");
          return false;
        }
      }
      
      // Validate billing address if different from shipping
      if (!sameAsShipping) {
        for (const field of ["name", "street", "city", "state", "postal", "country"]) {
          if (!billingAddress[field as keyof typeof billingAddress]) {
            trackFormError(`billing_${field}`, 'Required field missing');
            toast.error("Please fill out all billing address fields");
            return false;
          }
        }
      }
    }
    
    return true;
  };

  // Handle continue to payment
  const handleContinue = async () => {
    if (!validate()) return;
    
    // Track payment initiation
    if (isTracking) {
      completeStep('payment_initiated', {
        paymentMethod: 'embedded',
        hasAddresses: !product.isDigital
      });
    }
    
    // In development mode, skip reCAPTCHA and proceed directly
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Skipping reCAPTCHA verification');
      await handleRecaptchaSuccess('dev-token');
      return;
    }
    
    // Step 1: Trigger reCAPTCHA verification
    setShouldTriggerRecaptcha(true);
    setRecaptchaError(null);
  };

  const handleRecaptchaSuccess = async (token: string) => {
    setRecaptchaToken(token);
    setShouldTriggerRecaptcha(false);
    
    // Step 2: Proceed with payment after reCAPTCHA success
    setLoading(true);
    
    try {
      // Track form completion
      if (!product.isDigital) {
        trackFormComplete({
          shippingAddress,
          billingAddress: sameAsShipping ? shippingAddress : billingAddress,
          sameAsShipping
        });
      }
      
      completeStep('form_validated');
      
      const response = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          buyerEmail: buyerEmail.trim(), // Include buyer email
          discountCode: appliedDiscountCode || undefined,
          shippingAddress: !product.isDigital ? shippingAddress : undefined,
          billingAddress: !product.isDigital ? (sameAsShipping ? shippingAddress : billingAddress) : undefined,
          abandonedCartSessionId: sessionId, // Include abandoned cart session ID
          recaptchaToken: process.env.NODE_ENV === 'development' ? 'dev-token' : token,
          orderInstructions: orderInstructions.trim() || undefined, // Include order instructions if provided
        }),
      });

      const data = await response.json();

      if (response.ok && data.clientSecret) {
        console.log(`✅ Payment intent created successfully: ${data.paymentIntentId || 'ID not provided'}`);
        // Track successful payment intent creation
        trackPaymentIntentCreated(data);
        
        // Set up embedded payment form
        setClientSecret(data.clientSecret);
        setCustomerId(data.customerId);
        setPaymentAmount(data.amount);
        setPaymentCurrency(data.currency);
        setShowPaymentForm(true);
        
        // Track payment form displayed
        setTimeout(() => {
          trackPaymentFormDisplayed();
          document.getElementById('payment-form')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else if (response.status === 401 && data.requiresAuth) {
        // Track authentication requirement
        trackError('authentication_required', data.details || 'Authentication required');
        toast.error(data.details || "Authentication required");
        // You could redirect to login here
        // router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      } else if (response.status === 403 && data.error === "Shipping not available to your location") {
        // Track shipping restriction
        trackError('shipping_restriction', data.details || 'Shipping not available');
        toast.error(data.details || "This seller does not ship to your location.");
      } else if (response.status === 403 && data.error === "Security verification failed. Please try again.") {
        // Track reCAPTCHA error
        trackError('recaptcha_error', data.details || 'Security verification failed');
        toast.error("Security verification failed. Please refresh the page and try again.");
        // Reset reCAPTCHA token to allow retry
        setRecaptchaToken("");
      } else {
        // Track API error
        trackError('api_error', data.error || 'Unknown error');
        console.error("Checkout initialization failed:", data.error);
        toast.error(data.error || "Failed to initialize checkout.");
      }
    } catch (error) {
      // Track network error
      trackError('network_error', error instanceof Error ? error.message : 'Unknown error');
      console.error("Error:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecaptchaError = (error: string) => {
    setRecaptchaError(error);
    setShouldTriggerRecaptcha(false);
    toast.error("Security verification failed. Please try again.");
  };

  // Payment success handler
  const handlePaymentSuccess = (paymentIntentId: string) => {
    // Track successful payment
    completeCheckout();
    
    // Redirect to success page
    router.push(`/checkout/success?session_id=${paymentIntentId}`);
  };

  // Payment error handler
  const handlePaymentError = (error: string) => {
    // Track payment error
    trackError('payment_error', error);
    toast.error(error);
  };

  // Payment attempt handler (called when user submits payment form)
  const handlePaymentAttempt = () => {
    trackPaymentAttempt('card');
  };

  // Payment processing handler (called when payment is being processed)
  const handlePaymentProcessing = () => {
    trackPaymentProcessing();
  };

  // Track when user leaves the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isTracking) {
        abandonCart('page_navigation');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isTracking, abandonCart]);

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your order...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to product
              </button>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Lock className="h-4 w-4" />
              <span>Secure checkout</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Checkout Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Product Summary Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Image 
                      src={product.image} 
                      alt={product.name} 
                      width={80} 
                      height={80} 
                      className="rounded-lg object-cover"
                    />
                    {quantity > 1 && (
                      <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                        {quantity}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h1 className="text-xl font-semibold text-gray-900">{product.name}</h1>
                    <p className="text-sm text-gray-600">Sold by {product.seller.shopName}</p>
                    <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                      {product.isDigital ? (
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                          <span>Digital download</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Truck className="h-4 w-4 mr-1" />
                          <span>Physical item</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      ${((product.price * quantity) / 100).toFixed(2)}
                    </p>
                    {quantity > 1 && (
                      <p className="text-sm text-gray-500">
                        ${(product.price / 100).toFixed(2)} each
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="p-6 border-b border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Quantity
                </label>
                <QuantitySelector
                  name="quantity"
                  maxQuantity={product.stock}
                  quantity={quantity}
                  setQuantity={setQuantity}
                />
              </div>

              {/* Email Address - Required for order confirmation */}
              <div className="p-6 border-b border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email address <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  We&apos;ll send your order confirmation to this email
                </p>
                <Input 
                  type="email"
                  name="email"
                  placeholder="your.email@example.com" 
                  value={buyerEmail} 
                  onChange={(e) => {
                    setBuyerEmail(e.target.value);
                    trackFieldInteraction('email');
                  }}
                  onFocus={() => trackFieldInteraction('email')}
                  className="w-full"
                  required
                />
              </div>

              {/* Discount Code */}
              <div className="p-6 border-b border-gray-200">
                <DiscountCodeInput
                  sellerId={product.seller.userId}
                  productId={product.id}
                  orderAmount={subtotal - saleDiscount + shipping}
                  onDiscountApplied={handleDiscountApplied}
                  onDiscountRemoved={handleDiscountRemoved}
                  appliedDiscountCode={appliedDiscountCode}
                  appliedDiscountAmount={appliedDiscountAmount}
                  currency={product.currency}
                />
              </div>

              {/* Shipping Address */}
              {!product.isDigital && (
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping address</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full name
                      </label>
                      <Input 
                        name="name" 
                        placeholder="Enter your full name" 
                        value={shippingAddress.name} 
                        onChange={handleAddressChange}
                        onFocus={() => trackFieldInteraction('name')}
                        className="w-full"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <Input 
                        name="street" 
                        placeholder="Street address" 
                        value={shippingAddress.street} 
                        onChange={handleAddressChange}
                        onFocus={() => trackFieldInteraction('street')}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <Input 
                        name="city" 
                        placeholder="City" 
                        value={shippingAddress.city} 
                        onChange={handleAddressChange}
                        onFocus={() => trackFieldInteraction('city')}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State/Province
                      </label>
                      <Input 
                        name="state" 
                        placeholder="State" 
                        value={shippingAddress.state} 
                        onChange={handleAddressChange}
                        onFocus={() => trackFieldInteraction('state')}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Postal code
                      </label>
                      <Input 
                        name="postal" 
                        placeholder="Postal code" 
                        value={shippingAddress.postal} 
                        onChange={handleAddressChange}
                        onFocus={() => trackFieldInteraction('postal')}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country
                      </label>
                      <Select onValueChange={(value) => {
                        setShippingAddress(prev => ({ ...prev, country: value }));
                        trackFieldInteraction('country');
                      }} defaultValue={shippingAddress.country}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a country" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUPPORTED_COUNTRIES.map((country: Country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Billing Address */}
              {!product.isDigital && (
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <Checkbox
                      id="same-as-shipping"
                      checked={sameAsShipping}
                      onCheckedChange={handleSameAsShippingChange}
                      className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                    />
                    <label 
                      htmlFor="same-as-shipping" 
                      className="text-lg font-semibold text-gray-900 cursor-pointer"
                    >
                      Billing address same as shipping
                    </label>
                  </div>
                  
                  {!sameAsShipping && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Billing name
                        </label>
                        <Input 
                          name="name" 
                          placeholder="Enter billing name" 
                          value={billingAddress.name} 
                          onChange={handleBillingAddressChange}
                          onFocus={() => trackFieldInteraction('billing_name')}
                          className="w-full"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Billing address
                        </label>
                        <Input 
                          name="street" 
                          placeholder="Billing street address" 
                          value={billingAddress.street} 
                          onChange={handleBillingAddressChange}
                          onFocus={() => trackFieldInteraction('billing_street')}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City
                        </label>
                        <Input 
                          name="city" 
                          placeholder="City" 
                          value={billingAddress.city} 
                          onChange={handleBillingAddressChange}
                          onFocus={() => trackFieldInteraction('billing_city')}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State/Province
                        </label>
                        <Input 
                          name="state" 
                          placeholder="State" 
                          value={billingAddress.state} 
                          onChange={handleBillingAddressChange}
                          onFocus={() => trackFieldInteraction('billing_state')}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Postal code
                        </label>
                        <Input 
                          name="postal" 
                          placeholder="Postal code" 
                          value={billingAddress.postal} 
                          onChange={handleBillingAddressChange}
                          onFocus={() => trackFieldInteraction('billing_postal')}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country
                        </label>
                        <Select onValueChange={(value) => {
                          setBillingAddress(prev => ({ ...prev, country: value }));
                          trackFieldInteraction('billing_country');
                        }} defaultValue={billingAddress.country}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a country" />
                          </SelectTrigger>
                          <SelectContent>
                            {SUPPORTED_COUNTRIES.map((country: Country) => (
                              <SelectItem key={country.code} value={country.code}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Security Verification - Invisible reCAPTCHA v3 */}
              <div className="hidden">
                <ReCaptcha
                  action="checkout"
                  onVerify={handleRecaptchaSuccess}
                  onError={handleRecaptchaError}
                  trigger={shouldTriggerRecaptcha}
                />
              </div>

              {/* Order Instructions Section */}
              <div className="p-6 border-b border-gray-200">
                <Label htmlFor="checkout-order-instructions" className="text-lg font-semibold text-gray-900 mb-2 block">
                  Order Instructions / Personalization (Optional)
                </Label>
                <Textarea
                  id="checkout-order-instructions"
                  placeholder="Add any special instructions or personalization requests for the seller..."
                  value={orderInstructions}
                  onChange={(e) => setOrderInstructions(e.target.value)}
                  className="min-h-[100px] resize-none"
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {orderInstructions.length}/1000 characters
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  These instructions will be visible to the seller when processing your order.
                </p>
              </div>

              {/* Payment Section */}
              {!showPaymentForm ? (
                <div className="p-6">
                  <Button 
                    onClick={handleContinue} 
                    disabled={loading || shouldTriggerRecaptcha} 
                    className="w-full h-12 text-lg font-semibold bg-purple-600 hover:bg-purple-700"
                  >
                    {loading || shouldTriggerRecaptcha ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        {shouldTriggerRecaptcha ? "Verifying security..." : "Processing..."}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <CreditCard className="h-5 w-5 mr-2" />
                        Continue to payment
                      </div>
                    )}
                  </Button>
                  
                  {/* Trust Indicators */}
                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500">
                      Secure payment processing powered by Stripe
                    </p>
                    <div className="flex items-center justify-center mt-2 space-x-4">
                      <div className="flex items-center text-xs text-gray-500">
                        <Shield className="h-3 w-3 mr-1" />
                        <span>SSL secured</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Lock className="h-3 w-3 mr-1" />
                        <span>256-bit encryption</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div id="payment-form" className="p-6">
                  <EmbeddedPaymentForm
                    clientSecret={clientSecret!}
                    customerId={customerId || undefined}
                    amount={paymentAmount}
                    currency={paymentCurrency}
                    shippingAddress={!product.isDigital ? shippingAddress : undefined}
                    billingAddress={!product.isDigital ? (sameAsShipping ? shippingAddress : billingAddress) : undefined}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    onPaymentAttempt={handlePaymentAttempt}
                    onPaymentProcessing={handlePaymentProcessing}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-8">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order summary</h2>
                
                {/* Product Line */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">Qty {quantity}</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    ${(subtotal / 100).toFixed(2)}
                  </p>
                </div>

                {/* Sale Discount */}
                {saleDiscount > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-600">Sale discount</p>
                    <p className="text-sm text-green-600 font-medium">
                      - ${(saleDiscount / 100).toFixed(2)}
                    </p>
                  </div>
                )}

                {/* Discount Code */}
                {appliedDiscountAmount > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-600">Discount code</p>
                    <p className="text-sm text-green-600 font-medium">
                      - ${(appliedDiscountAmount / 100).toFixed(2)}
                    </p>
                  </div>
                )}

                {/* Shipping */}
                {shipping > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-600">Shipping & handling</p>
                    <p className="text-sm font-medium text-gray-900">
                      ${(shipping / 100).toFixed(2)}
                    </p>
                  </div>
                )}

                {/* Tax Estimate */}
                <div className="flex justify-between items-center mb-4 text-sm text-gray-500">
                  <span>Tax</span>
                  <span>Calculated at checkout</span>
                </div>

                {/* Total */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-semibold text-gray-900">Total</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ${(total / 100).toFixed(2)}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {product.currency} {/* • Includes applicable taxes TODO: Add back when actually handling taxes */}
                  </p>
                </div>

                {/* Additional Info */}
                <div className="mt-6 space-y-3 text-xs text-gray-500">
                  <div className="flex items-start space-x-2">
                    <Shield className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>Your payment information is secure and encrypted</span>
                  </div>
                  {product.isDigital && (
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>Instant digital delivery after payment</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 