"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CalendarIcon,
  Edit,
  Eye,
  TrendingUp,
  Clock,
  DollarSign,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  onSale: boolean;
  discount?: number;
  saleStartDate?: Date;
  saleEndDate?: Date;
  saleStartTime?: string;
  saleEndTime?: string;
  status: string;
  images: string[];
  stock: number;
  numberSold: number;
}

interface ProductSalesManagerProps {
  sellerId: string;
}

export default function ProductSalesManager({
  sellerId,
}: ProductSalesManagerProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filter, setFilter] = useState("all"); // all, onSale, scheduled, expired

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch(`/api/seller/products?sellerId=${sellerId}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSaleToggle = async (productId: string, onSale: boolean) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onSale }),
      });

      if (response.ok) {
        toast.success(onSale ? "Sale activated!" : "Sale deactivated!");
        fetchProducts();
      } else {
        toast.error("Failed to update sale status");
      }
    } catch (error) {
      console.error("Error updating sale status:", error);
      toast.error("Failed to update sale status");
    }
  };

  const updateProductSale = async (productId: string, saleData: any) => {
    try {
      // Ensure all sale-related fields are included and properly formatted
      const updatePayload = {
        onSale: saleData.onSale,
        discount: saleData.onSale ? saleData.discount : null,
        saleStartDate:
          saleData.onSale && saleData.saleStartDate
            ? saleData.saleStartDate.toISOString()
            : null,
        saleEndDate:
          saleData.onSale && saleData.saleEndDate
            ? saleData.saleEndDate.toISOString()
            : null,
        saleStartTime:
          saleData.onSale && saleData.saleStartTime
            ? saleData.saleStartTime
            : null,
        saleEndTime:
          saleData.onSale && saleData.saleEndTime ? saleData.saleEndTime : null,
      };

      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      if (response.ok) {
        toast.success("Sale updated successfully!");
        fetchProducts();
        setEditingProduct(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to update sale");
      }
    } catch (error) {
      console.error("Error updating sale:", error);
      toast.error("Failed to update sale");
    }
  };

  const getSaleStatus = (product: Product) => {
    if (!product.onSale) return "NOT_ON_SALE";

    const now = new Date();

    // Check sale start date/time
    if (product.saleStartDate) {
      const saleStart = new Date(product.saleStartDate);
      if (product.saleStartTime) {
        const [hours, minutes] = product.saleStartTime.split(":").map(Number);
        saleStart.setHours(hours, minutes, 0, 0);
      }
      if (now < saleStart) return "SCHEDULED";
    }

    // Check sale end date/time
    if (product.saleEndDate) {
      const saleEnd = new Date(product.saleEndDate);
      if (product.saleEndTime) {
        const [hours, minutes] = product.saleEndTime.split(":").map(Number);
        saleEnd.setHours(hours, minutes, 0, 0);
      }
      if (now > saleEnd) return "EXPIRED";
    }

    return "ACTIVE";
  };

  const getSaleStatusBadge = (product: Product) => {
    const status = getSaleStatus(product);

    switch (status) {
      case "ACTIVE":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Active
          </Badge>
        );
      case "SCHEDULED":
        return <Badge variant="secondary">Scheduled</Badge>;
      case "EXPIRED":
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">No Sale</Badge>;
    }
  };

  const filteredProducts = products.filter((product) => {
    const status = getSaleStatus(product);
    switch (filter) {
      case "onSale":
        return status === "ACTIVE";
      case "scheduled":
        return status === "SCHEDULED";
      case "expired":
        return status === "EXPIRED";
      default:
        return true;
    }
  });

  // Calculate real statistics
  const calculateStats = () => {
    const activeSales = products.filter(
      (p) => getSaleStatus(p) === "ACTIVE"
    ).length;
    const scheduledSales = products.filter(
      (p) => getSaleStatus(p) === "SCHEDULED"
    ).length;
    const productsOnSale = products.filter((p) => p.onSale).length;

    const totalDiscount = products.reduce((sum, p) => {
      if (p.onSale && p.discount && getSaleStatus(p) === "ACTIVE") {
        const discountAmount = (p.price * p.discount) / 100;
        return sum + discountAmount;
      }
      return sum;
    }, 0);

    return {
      activeSales,
      scheduledSales,
      productsOnSale,
      totalDiscount: totalDiscount / 100, // Convert from cents to dollars
    };
  };

  const stats = calculateStats();

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Product Sales</h2>
          <p className="text-muted-foreground">
            Manage sales and discounts for your products
          </p>
        </div>

        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            <SelectItem value="onSale">Active Sales</SelectItem>
            <SelectItem value="scheduled">Scheduled Sales</SelectItem>
            <SelectItem value="expired">Expired Sales</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active Sales</p>
                <p className="text-xl font-bold">{stats.activeSales}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-xl font-bold">{stats.scheduledSales}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Discount</p>
                <p className="text-xl font-bold">
                  ${stats.totalDiscount.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Products on Sale
                </p>
                <p className="text-xl font-bold">{stats.productsOnSale}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>
            Manage sales for your products. Click edit to modify sale settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Sale Status</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Sale Period</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {product.images[0] && (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="object-cover rounded"
                        />
                      )}
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Stock: {product.stock} | Sold: {product.numberSold}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div>
                      <p className="font-medium">
                        ${(product.price / 100).toFixed(2)}
                      </p>
                      {product.originalPrice && (
                        <p className="text-sm text-muted-foreground line-through">
                          ${(product.originalPrice / 100).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>{getSaleStatusBadge(product)}</TableCell>

                  <TableCell>
                    {product.discount ? (
                      <Badge variant="secondary">{product.discount}% off</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  <TableCell>
                    {product.saleStartDate && product.saleEndDate ? (
                      <div className="text-sm">
                        <p>
                          {format(new Date(product.saleStartDate), "MMM d")}
                        </p>
                        <p className="text-muted-foreground">to</p>
                        <p>
                          {format(new Date(product.saleEndDate), "MMM d, yyyy")}
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">
                        No dates set
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={product.onSale}
                        onCheckedChange={(checked) =>
                          handleSaleToggle(product.id, checked)
                        }
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingProduct(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredProducts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No products found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Sale Modal */}
      {editingProduct && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Sale: {editingProduct.name}</CardTitle>
            <CardDescription>
              Configure sale settings for this product
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SaleEditForm
              product={editingProduct}
              onSave={(data) => updateProductSale(editingProduct.id, data)}
              onCancel={() => setEditingProduct(null)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Sale Edit Form Component
interface SaleEditFormProps {
  product: Product;
  onSave: (data: any) => void;
  onCancel: () => void;
}

function SaleEditForm({ product, onSave, onCancel }: SaleEditFormProps) {
  const [formData, setFormData] = useState({
    onSale: product.onSale,
    discount: product.discount || 0,
    saleStartDate: product.saleStartDate
      ? new Date(product.saleStartDate)
      : undefined,
    saleEndDate: product.saleEndDate
      ? new Date(product.saleEndDate)
      : undefined,
    saleStartTime: product.saleStartTime || "",
    saleEndTime: product.saleEndTime || "",
  });

  // Validate that end date/time is after start date/time
  const validateDates = () => {
    if (!formData.onSale) return true;

    if (formData.saleStartDate && formData.saleEndDate) {
      const start = new Date(formData.saleStartDate);
      const end = new Date(formData.saleEndDate);

      if (formData.saleStartTime) {
        const [hours, minutes] = formData.saleStartTime.split(":").map(Number);
        start.setHours(hours, minutes, 0, 0);
      }

      if (formData.saleEndTime) {
        const [hours, minutes] = formData.saleEndTime.split(":").map(Number);
        end.setHours(hours, minutes, 0, 0);
      }

      if (end <= start) {
        toast.error("Sale end date/time must be after start date/time");
        return false;
      }
    }

    if (formData.discount < 0 || formData.discount > 100) {
      toast.error("Discount must be between 0 and 100");
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateDates()) {
      return;
    }

    onSave(formData);
  };

  const calculateSalePrice = () => {
    if (!formData.onSale || !formData.discount) return product.price;
    const discountAmount = (product.price * formData.discount) / 100;
    return Math.max(0, product.price - discountAmount);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sale Toggle */}
        <div className="space-y-2">
          <Label>Enable Sale</Label>
          <Switch
            checked={formData.onSale}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, onSale: checked }))
            }
          />
        </div>

        {/* Discount Percentage */}
        <div className="space-y-2">
          <Label htmlFor="discount">Discount Percentage (0-100)</Label>
          <Input
            id="discount"
            type="number"
            min="0"
            max="100"
            value={formData.discount}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 0;
              const clampedValue = Math.max(0, Math.min(100, value));
              setFormData((prev) => ({ ...prev, discount: clampedValue }));
            }}
            disabled={!formData.onSale}
          />
        </div>

        {/* Sale Start Date */}
        <div className="space-y-2">
          <Label>Sale Start Date (Optional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.saleStartDate && "text-muted-foreground"
                )}
                disabled={!formData.onSale}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.saleStartDate
                  ? format(formData.saleStartDate, "PPP")
                  : "Select start date (optional)"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.saleStartDate}
                onSelect={(date) =>
                  setFormData((prev) => ({ ...prev, saleStartDate: date }))
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Sale Start Time */}
        <div className="space-y-2">
          <Label>Sale Start Time (Optional)</Label>
          <Input
            type="time"
            value={formData.saleStartTime}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                saleStartTime: e.target.value,
              }))
            }
            disabled={!formData.onSale}
          />
        </div>

        {/* Sale End Date */}
        <div className="space-y-2">
          <Label>Sale End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.saleEndDate && "text-muted-foreground"
                )}
                disabled={!formData.onSale}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.saleEndDate
                  ? format(formData.saleEndDate, "PPP")
                  : "Select end date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.saleEndDate}
                onSelect={(date) =>
                  setFormData((prev) => ({ ...prev, saleEndDate: date }))
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Price Preview */}
      {formData.onSale && formData.discount > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Price Preview</h4>
            <div className="flex items-center space-x-4">
              <div>
                <p className="text-sm text-muted-foreground">Original Price</p>
                <p className="text-lg font-medium">
                  ${(product.price / 100).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sale Price</p>
                <p className="text-lg font-medium text-green-600">
                  ${(calculateSalePrice() / 100).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">You Save</p>
                <p className="text-lg font-medium text-red-600">
                  ${((product.price - calculateSalePrice()) / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Actions */}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  );
}
