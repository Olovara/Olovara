"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Edit, Trash2, Copy, Eye, Tag, Users, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SUPPORTED_CURRENCIES, getCurrencyDecimals } from "@/data/units";
import { DatePicker } from "@/components/ui/date-picker";

interface DiscountCode {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  maxUses?: number;
  maxUsesPerCustomer?: number;
  currentUses: number;
  expiresAt?: Date;
  isActive: boolean;
  appliesToAllProducts: boolean;
  applicableProductIds: string[];
  applicableCategories: string[];
  stackableWithProductSales: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface DiscountCodeManagerProps {
  sellerId: string;
}

export default function DiscountCodeManager({ sellerId }: DiscountCodeManagerProps) {
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sellerCurrency, setSellerCurrency] = useState("USD");

  // Form state - now using currency amounts instead of cents
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    discountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED_AMOUNT",
    discountValue: 0, // Now in currency units (e.g., dollars, euros)
    minimumOrderAmount: 0, // Now in currency units
    maximumDiscountAmount: 0, // Now in currency units
    maxUses: 0,
    maxUsesPerCustomer: 0,
    expiresAt: undefined as Date | undefined,
    isActive: true,
    appliesToAllProducts: true,
    applicableProductIds: [] as string[],
    applicableCategories: [] as string[],
    stackableWithProductSales: true,
  });

  // Get currency info for display
  const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === sellerCurrency) || SUPPORTED_CURRENCIES[0];

  const fetchDiscountCodes = useCallback(async () => {
    try {
      const response = await fetch(`/api/seller/discount-codes?sellerId=${sellerId}`);
      if (response.ok) {
        const data = await response.json();
        setDiscountCodes(data);
      }
    } catch (error) {
      console.error("Error fetching discount codes:", error);
      toast.error("Failed to load discount codes");
    } finally {
      setIsLoading(false);
    }
  }, [sellerId]);

  // Fetch seller's preferred currency
  const fetchSellerCurrency = useCallback(async () => {
    try {
      const response = await fetch(`/api/seller/dashboard?sellerId=${sellerId}`);
      if (response.ok) {
        const data = await response.json();
        setSellerCurrency(data.preferredCurrency || "USD");
      }
    } catch (error) {
      console.error("Error fetching seller currency:", error);
    }
  }, [sellerId]);

  useEffect(() => {
    fetchDiscountCodes();
    fetchSellerCurrency();
  }, [fetchDiscountCodes, fetchSellerCurrency]);

  // Calculate stats
  const stats = {
    activeCodes: discountCodes.filter(code => code.isActive).length,
    expiredCodes: discountCodes.filter(code => code.expiresAt && new Date(code.expiresAt) < new Date()).length,
    totalUses: discountCodes.reduce((sum, code) => sum + code.currentUses, 0),
    averageUses: discountCodes.length > 0 ? Math.round(discountCodes.reduce((sum, code) => sum + code.currentUses, 0) / discountCodes.length) : 0,
  };

  const generateCode = () => {
    // Generate a random 8-character code
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code: result }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingCode 
        ? `/api/seller/discount-codes/${editingCode.id}`
        : "/api/seller/discount-codes";
      
      const method = editingCode ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, sellerId }),
      });

      if (response.ok) {
        toast.success(editingCode ? "Discount code updated!" : "Discount code created!");
        resetForm();
        fetchDiscountCodes();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to save discount code");
      }
    } catch (error) {
      console.error("Error saving discount code:", error);
      toast.error("Failed to save discount code");
    }
  };

  const handleDelete = async (codeId: string) => {
    if (!confirm("Are you sure you want to delete this discount code?")) return;
    
    try {
      const response = await fetch(`/api/seller/discount-codes/${codeId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Discount code deleted!");
        fetchDiscountCodes();
      } else {
        toast.error("Failed to delete discount code");
      }
    } catch (error) {
      console.error("Error deleting discount code:", error);
      toast.error("Failed to delete discount code");
    }
  };

  const toggleActive = async (codeId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/seller/discount-codes/${codeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        toast.success(isActive ? "Discount code activated!" : "Discount code deactivated!");
        fetchDiscountCodes();
      } else {
        toast.error("Failed to update discount code");
      }
    } catch (error) {
      console.error("Error updating discount code:", error);
      toast.error("Failed to update discount code");
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      description: "",
      discountType: "PERCENTAGE",
      discountValue: 0,
      minimumOrderAmount: 0,
      maximumDiscountAmount: 0,
      maxUses: 0,
      maxUsesPerCustomer: 0,
      expiresAt: undefined,
      isActive: true,
      appliesToAllProducts: true,
      applicableProductIds: [],
      applicableCategories: [],
      stackableWithProductSales: true,
    });
    setIsCreating(false);
    setEditingCode(null);
  };

  const startEditing = (code: DiscountCode) => {
    setEditingCode(code);
    // Convert from cents to currency units for editing
    const decimals = getCurrencyDecimals(sellerCurrency);
    const multiplier = Math.pow(10, decimals);
    
    setFormData({
      code: code.code,
      name: code.name,
      description: code.description || "",
      discountType: code.discountType,
      discountValue: code.discountType === "PERCENTAGE" ? code.discountValue : code.discountValue / multiplier,
      minimumOrderAmount: code.minimumOrderAmount ? code.minimumOrderAmount / multiplier : 0,
      maximumDiscountAmount: code.maximumDiscountAmount ? code.maximumDiscountAmount / multiplier : 0,
      maxUses: code.maxUses || 0,
      maxUsesPerCustomer: code.maxUsesPerCustomer || 0,
      expiresAt: code.expiresAt,
      isActive: code.isActive,
      appliesToAllProducts: code.appliesToAllProducts,
      applicableProductIds: code.applicableProductIds,
      applicableCategories: code.applicableCategories,
      stackableWithProductSales: code.stackableWithProductSales,
    });
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard!");
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading discount codes...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Discount Codes</h2>
          <p className="text-muted-foreground">
            Create and manage discount codes for your customers
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Code
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active Codes</p>
                <p className="text-xl font-bold">{stats.activeCodes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Expired Codes</p>
                <p className="text-xl font-bold">{stats.expiredCodes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Uses</p>
                <p className="text-xl font-bold">{stats.totalUses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Uses/Code</p>
                <p className="text-xl font-bold">{stats.averageUses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingCode) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingCode ? "Edit Discount Code" : "Create New Discount Code"}
            </CardTitle>
            <CardDescription>
              {editingCode 
                ? "Update your discount code settings" 
                : "Create a new discount code for your customers"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Discount Code *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      placeholder="SUMMER20"
                      required
                    />
                    <Button type="button" variant="outline" onClick={generateCode}>
                      Generate
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Summer Sale 20% Off"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description for this discount code"
                />
              </div>

              {/* Discount Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discountType">Discount Type *</Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(value: "PERCENTAGE" | "FIXED_AMOUNT") => 
                      setFormData(prev => ({ ...prev, discountType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage Off</SelectItem>
                      <SelectItem value="FIXED_AMOUNT">Fixed Amount Off</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountValue">
                    {formData.discountType === "PERCENTAGE" ? "Percentage (%)" : `Amount (${currencyInfo.symbol})`} *
                  </Label>
                  <div className="relative">
                    {formData.discountType === "FIXED_AMOUNT" && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        {currencyInfo.symbol}
                      </span>
                    )}
                    <Input
                      id="discountValue"
                      type="number"
                      value={formData.discountValue}
                      onChange={(e) => setFormData(prev => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      max={formData.discountType === "PERCENTAGE" ? "100" : undefined}
                      step={formData.discountType === "PERCENTAGE" ? "1" : `0.${"0".repeat(currencyInfo.decimals - 1)}1`}
                      className={formData.discountType === "FIXED_AMOUNT" ? "pl-8" : ""}
                      required
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formData.discountType === "PERCENTAGE" 
                      ? "Enter percentage (1-100)"
                      : `Enter amount in ${currencyInfo.code} with up to ${currencyInfo.decimals} decimal places`
                    }
                  </p>
                </div>

                {formData.discountType === "PERCENTAGE" && (
                  <div className="space-y-2">
                    <Label htmlFor="maximumDiscountAmount">Max Discount ({currencyInfo.symbol})</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        {currencyInfo.symbol}
                      </span>
                      <Input
                        id="maximumDiscountAmount"
                        type="number"
                        value={formData.maximumDiscountAmount}
                        onChange={(e) => setFormData(prev => ({ ...prev, maximumDiscountAmount: parseFloat(e.target.value) || 0 }))}
                        min="0"
                        step={`0.${"0".repeat(currencyInfo.decimals - 1)}1`}
                        placeholder="No limit"
                        className="pl-8"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Maximum discount amount for percentage-based codes
                    </p>
                  </div>
                )}
              </div>

              {/* Usage Limits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minimumOrderAmount">Minimum Order ({currencyInfo.symbol})</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {currencyInfo.symbol}
                    </span>
                    <Input
                      id="minimumOrderAmount"
                      type="number"
                      value={formData.minimumOrderAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, minimumOrderAmount: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step={`0.${"0".repeat(currencyInfo.decimals - 1)}1`}
                      placeholder="No minimum"
                      className="pl-8"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Minimum order amount required to use this code
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxUses">Max Uses</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    value={formData.maxUses}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxUses: parseInt(e.target.value) || 0 }))}
                    min="0"
                    placeholder="Unlimited"
                  />
                  <p className="text-sm text-muted-foreground">
                    Maximum times this code can be used
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxUsesPerCustomer">Max Uses Per Customer</Label>
                  <Input
                    id="maxUsesPerCustomer"
                    type="number"
                    value={formData.maxUsesPerCustomer}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxUsesPerCustomer: parseInt(e.target.value) || 0 }))}
                    min="0"
                    placeholder="Unlimited"
                  />
                  <p className="text-sm text-muted-foreground">
                    Maximum times per customer
                  </p>
                </div>
              </div>

              {/* Expiration */}
              <div className="space-y-2">
                <Label>Expiration Date</Label>
                <DatePicker
                  date={formData.expiresAt}
                  onDateChange={(date) => setFormData(prev => ({ ...prev, expiresAt: date }))}
                  placeholder="No expiration"
                  className="w-full"
                  disablePastDates={true} // Prevent selecting past dates for expiration
                />
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Active</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable or disable this discount code
                    </p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Stackable with Product Sales</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow this code to be used with products already on sale
                    </p>
                  </div>
                  <Switch
                    checked={formData.stackableWithProductSales}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, stackableWithProductSales: checked }))}
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCode ? "Update Code" : "Create Code"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Discount Codes List */}
      <div className="space-y-4">
        {discountCodes.map((code) => (
          <Card key={code.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Tag className="h-5 w-5 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">{code.name}</h3>
                      <p className="text-sm text-muted-foreground">{code.description}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={code.isActive ? "default" : "secondary"}>
                    {code.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(code.code)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditing(code)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(code.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Code</p>
                  <p className="font-mono font-semibold">{code.code}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Discount</p>
                  <p className="font-semibold">
                    {code.discountType === "PERCENTAGE" 
                      ? `${code.discountValue}%`
                      : `${currencyInfo.symbol}${(code.discountValue / Math.pow(10, currencyInfo.decimals)).toFixed(currencyInfo.decimals)}`
                    }
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Uses</p>
                  <p className="font-semibold">{code.currentUses}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-semibold">
                    {code.expiresAt && new Date(code.expiresAt) < new Date() 
                      ? "Expired" 
                      : code.isActive 
                        ? "Active" 
                        : "Inactive"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {discountCodes.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No discount codes yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first discount code to start offering deals to your customers
              </p>
              <Button onClick={() => setIsCreating(true)}>
                Create Your First Code
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 