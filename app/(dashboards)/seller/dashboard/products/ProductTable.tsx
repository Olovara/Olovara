"use client";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Ellipsis, Trash2, Copy, Pencil, ImageIcon, AlertCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { formatPriceInCurrency } from "@/lib/utils";
import { deleteProduct, deleteProductsBulk } from "@/actions/product";
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface Product {
  id: string;
  name: string;
  description: string | { html: string; text: string } | null;
  price: number;
  currency?: string;
  isDigital: boolean;
  status: string;
  images: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
  numberSold: number;
  userId: string;
  needsInventoryReview?: boolean;
}

interface ProductTableProps {
  products: Product[];
}

export function ProductTable({ products }: ProductTableProps) {
  const router = useRouter();
  const [duplicatingProductId, setDuplicatingProductId] = useState<
    string | null
  >(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(
    null
  );
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  // Track which product images have failed to load
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  // Track selected products for bulk deletion
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set()
  );
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Clean up stale selections when products list changes
  // Remove selections for products that no longer exist or have sales
  useMemo(() => {
    if (selectedProducts.size > 0) {
      const validProductIds = new Set(
        products
          .filter((p) => p.numberSold === 0)
          .map((p) => p.id)
      );
      
      const staleSelections = Array.from(selectedProducts).filter(
        (id) => !validProductIds.has(id)
      );
      
      if (staleSelections.length > 0) {
        const cleaned = new Set(selectedProducts);
        staleSelections.forEach((id) => cleaned.delete(id));
        setSelectedProducts(cleaned);
      }
    }
  }, [products, selectedProducts]);

  // Handler function to duplicate a product
  const handleDuplicate = async (productId: string) => {
    // Prevent duplicate requests
    if (duplicatingProductId === productId) return;

    setDuplicatingProductId(productId);

    try {
      const response = await fetch(`/api/products/${productId}/duplicate`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to duplicate product");
      }

      toast.success("Product duplicated successfully!");

      // Redirect to the edit page of the new product
      router.push(`/seller/dashboard/products/edit/${data.productId}`);
      router.refresh(); // Refresh to show the new product in the list
    } catch (error) {
      console.error("Error duplicating product:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to duplicate product. Please try again."
      );
    } finally {
      setDuplicatingProductId(null);
    }
  };

  // Handler function to open delete confirmation modal
  const handleDeleteClick = (productId: string, productName: string) => {
    setProductToDelete({ id: productId, name: productName });
    setDeleteModalOpen(true);
  };

  // Handler function to confirm and delete a product
  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    const productId = productToDelete.id;

    // Prevent duplicate requests
    if (deletingProductId === productId) return;

    setDeletingProductId(productId);
    setDeleteModalOpen(false);

    try {
      const result = await deleteProduct(productId);

      if (result.success) {
        toast.success("Product deleted successfully!");
        router.refresh(); // Refresh to remove the deleted product from the list
      } else {
        // Show error toast with the specific error message
        toast.error(result.error || "Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while deleting the product"
      );
    } finally {
      setDeletingProductId(null);
      setProductToDelete(null);
    }
  };

  // Handler for bulk delete confirmation
  const handleBulkDeleteConfirm = async () => {
    if (selectedProducts.size === 0) return;

    setIsBulkDeleting(true);
    setDeleteModalOpen(false);

    try {
      // Validate selected products still exist and are deletable before attempting deletion
      // This prevents errors from stale selections (e.g., products deleted elsewhere, got sales, etc.)
      const productIds = Array.from(selectedProducts);
      const validProductIds = productIds.filter((id) => {
        const product = products.find((p) => p.id === id);
        // Only include products that exist in current list and have no sales
        return product && product.numberSold === 0;
      });

      // Remove invalid selections (products not in current list or have sales)
      const invalidIds = productIds.filter((id) => !validProductIds.includes(id));
      if (invalidIds.length > 0) {
        const remaining = new Set(selectedProducts);
        invalidIds.forEach((id) => remaining.delete(id));
        setSelectedProducts(remaining);
        
        if (validProductIds.length === 0) {
          toast.error(
            "Selected products are no longer available for deletion. They may have been deleted, have sales, or are not on this page."
          );
          setIsBulkDeleting(false);
          return;
        } else {
          toast.warning(
            `${invalidIds.length} product(s) were removed from selection as they are no longer deletable.`
          );
        }
      }

      if (validProductIds.length === 0) {
        setIsBulkDeleting(false);
        return;
      }

      const result = await deleteProductsBulk(validProductIds);

      if (result.success && result.deleted) {
        toast.success(
          result.message || `Successfully deleted ${result.deleted.length} product(s).`
        );
        // Clear selection after successful deletion
        setSelectedProducts(new Set());
        router.refresh(); // Refresh to remove deleted products from the list
      } else {
        // Show detailed error message (truncate if too long)
        if (result.failed && result.failed.length > 0) {
          const errorMessages = result.failed
            .map((f) => `Product ${f.productId}: ${f.error}`)
            .join(", ");
          
          // Truncate very long error messages
          const displayMessage = errorMessages.length > 200
            ? `${errorMessages.substring(0, 200)}... (${result.failed.length} failed)`
            : errorMessages;
          
          toast.error(
            result.message || `Some deletions failed: ${displayMessage}`
          );
        } else {
          toast.error(result.message || result.error || "Failed to delete products");
        }
        // Remove successfully deleted products from selection
        if (result.deleted && result.deleted.length > 0) {
          const remaining = new Set(selectedProducts);
          result.deleted.forEach((id) => remaining.delete(id));
          setSelectedProducts(remaining);
        }
      }
    } catch (error) {
      console.error("Error deleting products:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while deleting products"
      );
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Handler to toggle product selection
  const toggleProductSelection = (productId: string) => {
    // Prevent selection changes during bulk delete operation
    if (isBulkDeleting) return;
    
    // Verify product exists and is deletable before allowing selection
    const product = products.find((p) => p.id === productId);
    if (!product) {
      toast.error("Product not found. Please refresh the page.");
      return;
    }
    
    if (product.numberSold > 0) {
      toast.error("Products with sales cannot be deleted.");
      return;
    }

    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  // Handler to toggle select all
  const toggleSelectAll = () => {
    // Prevent selection changes during bulk delete operation
    if (isBulkDeleting) return;
    
    // Only select products that can be deleted (numberSold === 0)
    const deletableProducts = products.filter((p) => p.numberSold === 0);
    const deletableIds = new Set(deletableProducts.map((p) => p.id));
    
    if (selectedProducts.size === deletableIds.size && 
        Array.from(selectedProducts).every(id => deletableIds.has(id))) {
      // All are selected, deselect all
      setSelectedProducts(new Set());
    } else {
      // Select all deletable products
      setSelectedProducts(new Set(deletableIds));
    }
  };

  // Get deletable products count (products with no sales)
  const deletableProducts = useMemo(() => {
    return products.filter((p) => p.numberSold === 0);
  }, [products]);

  // Check if all deletable products are selected
  const allDeletableSelected = useMemo(() => {
    if (deletableProducts.length === 0) return false;
    const deletableIds = new Set(deletableProducts.map((p) => p.id));
    return (
      selectedProducts.size === deletableIds.size &&
      Array.from(selectedProducts).every((id) => deletableIds.has(id))
    );
  }, [selectedProducts, deletableProducts]);

  // Handler to open bulk delete modal
  const handleBulkDeleteClick = () => {
    if (selectedProducts.size === 0) {
      toast.error("Please select at least one product to delete");
      return;
    }
    setDeleteModalOpen(true);
  };

  // Helper function to format date
  const formatDate = (date: Date | string) => {
    try {
      if (typeof date === "string") {
        return new Date(date).toLocaleDateString();
      }
      return date.toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", date);
      return "Invalid date";
    }
  };

  // Helper function to extract text from description (returns full text)
  const getDescriptionText = (
    description: string | { html: string; text: string } | null
  ) => {
    if (!description) return "No description";

    if (typeof description === "string") {
      try {
        const parsed = JSON.parse(description);
        if (parsed && typeof parsed === "object") {
          return (
            parsed.text ||
            parsed.html?.replace(/<[^>]*>?/gm, "") ||
            "No description"
          );
        }
        return description;
      } catch {
        // If it's not JSON, try to strip HTML tags
        return description.replace(/<[^>]*>?/gm, "");
      }
    }

    // Handle description object
    if (description && typeof description === "object") {
      return (
        description.text ||
        description.html?.replace(/<[^>]*>?/gm, "") ||
        "No description"
      );
    }

    return "No description";
  };

  // Helper function to truncate text to 20 characters
  const truncateText = (text: string) => {
    return text.length > 20 ? text.substring(0, 20) + "..." : text;
  };

  // Helper function to check if product has a valid image
  const hasValidImage = (product: Product) => {
    return (
      product.images &&
      product.images.length > 0 &&
      product.images[0] &&
      !failedImages.has(product.id)
    );
  };

  // Handler for image load errors
  const handleImageError = (productId: string) => {
    setFailedImages((prev) => new Set(prev).add(productId));
  };

  return (
    <>
      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden md:block w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={allDeletableSelected}
                  onCheckedChange={toggleSelectAll}
                  disabled={deletableProducts.length === 0}
                />
              </TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Sold</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[100px] text-center">
                <div className="flex items-center justify-center gap-2">
                  <span>Actions</span>
                  {selectedProducts.size > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="h-8 w-8 p-0 relative disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted rounded-md transition-colors"
                          disabled={isBulkDeleting}
                        >
                          <span className="sr-only">Bulk actions</span>
                          <Ellipsis className="h-4 w-4" />
                          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium border-2 border-background">
                            {selectedProducts.size}
                          </span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={handleBulkDeleteClick}
                          disabled={isBulkDeleting}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete {selectedProducts.size} product{selectedProducts.size !== 1 ? "s" : ""}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <button
                      className="h-8 w-8 p-0 relative opacity-50 cursor-not-allowed"
                      disabled
                      aria-label="Bulk actions (disabled - no products selected)"
                    >
                      <span className="sr-only">Bulk actions</span>
                      <Ellipsis className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const isSelected = selectedProducts.has(product.id);
              const canDelete = product.numberSold === 0;
              return (
                <TableRow key={product.id}>
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleProductSelection(product.id)}
                      disabled={!canDelete || isBulkDeleting}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-md bg-muted flex items-center justify-center">
                        {hasValidImage(product) ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover"
                            onError={() => handleImageError(product.id)}
                            unoptimized={product.images[0]?.includes('.ufs.sh')} // Unoptimized for UploadThing UFS URLs
                          />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/seller/dashboard/products/edit/${product.id}`}
                            className="font-medium hover:underline"
                            title={product.name}
                          >
                            {truncateText(product.name)}
                          </Link>
                          {product.needsInventoryReview && (
                            <Badge
                              variant="outline"
                              className="border-amber-300 text-amber-700 bg-amber-50 text-xs flex items-center gap-1"
                              title="This product requires inventory review"
                            >
                              <AlertCircle className="h-3 w-3" />
                              Review
                            </Badge>
                          )}
                        </div>
                        <p
                          className="text-sm text-muted-foreground line-clamp-1"
                          title={getDescriptionText(product.description)}
                        >
                          {truncateText(
                            getDescriptionText(product.description)
                          )}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        product.isDigital === false
                          ? "default"
                          : product.isDigital === true
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {product.isDigital === true
                        ? "Digital"
                        : product.isDigital === false
                          ? "Physical"
                          : "Unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        product.status === "ACTIVE"
                          ? "default"
                          : product.status === "HIDDEN"
                            ? "secondary"
                            : product.status === "DRAFT"
                              ? "outline"
                              : "destructive"
                      }
                      className={
                        product.status === "DRAFT"
                          ? "border-orange-300 text-orange-700 bg-orange-50"
                          : ""
                      }
                    >
                      {product.status === "DRAFT"
                        ? "Draft"
                        : product.status || "UNKNOWN"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatPriceInCurrency(
                      product.price,
                      product.currency || "USD",
                      true
                    )}
                  </TableCell>
                  <TableCell>{product.numberSold || 0}</TableCell>
                  <TableCell>{formatDate(product.createdAt)}</TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-8 w-8 p-0 mx-auto">
                          <span className="sr-only">Open menu</span>
                          <Ellipsis className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/seller/dashboard/products/edit/${product.id}`}
                          >
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDuplicate(product.id)}
                          disabled={duplicatingProductId === product.id}
                        >
                          {duplicatingProductId === product.id
                            ? "Duplicating..."
                            : "Duplicate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleDeleteClick(product.id, product.name)
                          }
                          disabled={
                            deletingProductId === product.id ||
                            product.numberSold > 0
                          }
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                        {/*TODO readd when analytics are added<DropdownMenuItem asChild>
                          <Link href={`/seller/dashboard/products/${product.id}/analytics`}>
                            Analytics
                          </Link>
                        </DropdownMenuItem> */}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View - Hidden on desktop */}
      <div className="md:hidden space-y-4 w-full max-w-full">
        {/* Mobile Bulk Actions Button */}
        <div className="sticky top-0 z-10 bg-background pb-2">
          {selectedProducts.size > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full relative"
                  disabled={isBulkDeleting}
                >
                  <Ellipsis className="h-4 w-4 mr-2" />
                  Bulk Actions
                  <span className="ml-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                    {selectedProducts.size}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={handleBulkDeleteClick}
                  disabled={isBulkDeleting}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete {selectedProducts.size} product{selectedProducts.size !== 1 ? "s" : ""}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full opacity-50 cursor-not-allowed"
              disabled
            >
              <Ellipsis className="h-4 w-4 mr-2" />
              Bulk Actions
            </Button>
          )}
        </div>
        {products.map((product) => {
          const isSelected = selectedProducts.has(product.id);
          const canDelete = product.numberSold === 0;
          return (
            <Card key={product.id} className="w-full max-w-full">
              <CardContent className="p-4 w-full max-w-full">
                <div className="flex gap-4 w-full">
                  {/* Checkbox */}
                  <div className="flex items-start pt-1">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleProductSelection(product.id)}
                      disabled={!canDelete || isBulkDeleting}
                    />
                  </div>
                {/* Product Image */}
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted flex items-center justify-center">
                  {hasValidImage(product) ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                      onError={() => handleImageError(product.id)}
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/seller/dashboard/products/edit/${product.id}`}
                      className="font-medium hover:underline"
                    >
                      {product.name}
                    </Link>
                    {product.needsInventoryReview && (
                      <Badge
                        variant="outline"
                        className="border-amber-300 text-amber-700 bg-amber-50 text-xs flex items-center gap-1"
                        title="This product requires inventory review"
                      >
                        <AlertCircle className="h-3 w-3" />
                        Review
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {getDescriptionText(product.description)}
                  </p>

                  {/* Badges Row */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge
                      variant={
                        product.isDigital === false
                          ? "default"
                          : product.isDigital === true
                            ? "secondary"
                            : "destructive"
                      }
                      className="text-xs"
                    >
                      {product.isDigital === true ? "Digital" : "Physical"}
                    </Badge>
                    <Badge
                      variant={
                        product.status === "ACTIVE"
                          ? "default"
                          : product.status === "HIDDEN"
                            ? "secondary"
                            : product.status === "DRAFT"
                              ? "outline"
                              : "destructive"
                      }
                      className={
                        product.status === "DRAFT"
                          ? "border-orange-300 text-orange-700 bg-orange-50 text-xs"
                          : "text-xs"
                      }
                    >
                      {product.status === "DRAFT"
                        ? "Draft"
                        : product.status || "UNKNOWN"}
                    </Badge>
                  </div>

                  {/* Price and Stats */}
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm mb-3">
                    <div className="whitespace-nowrap">
                      <span className="text-muted-foreground">Price: </span>
                      <span className="font-semibold">
                        {formatPriceInCurrency(
                          product.price,
                          product.currency || "USD",
                          true
                        )}
                      </span>
                    </div>
                    <div className="whitespace-nowrap">
                      <span className="text-muted-foreground">Sold: </span>
                      <span className="font-semibold">
                        {product.numberSold || 0}
                      </span>
                    </div>
                    <div className="whitespace-nowrap">
                      <span className="text-muted-foreground">Created: </span>
                      <span>{formatDate(product.createdAt)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="flex-1 min-w-[100px]"
                    >
                      <Link
                        href={`/seller/dashboard/products/edit/${product.id}`}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(product.id)}
                      disabled={duplicatingProductId === product.id}
                      className="flex-1 min-w-[100px]"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {duplicatingProductId === product.id
                        ? "Duplicating..."
                        : "Duplicate"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleDeleteClick(product.id, product.name)
                      }
                      disabled={
                        deletingProductId === product.id ||
                        product.numberSold > 0
                      }
                      className="text-destructive hover:text-destructive min-w-[44px]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
        })}
      </div>

      <DeleteConfirmationModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={
          selectedProducts.size > 0 ? handleBulkDeleteConfirm : handleDeleteConfirm
        }
        title={
          selectedProducts.size > 0
            ? `Delete ${selectedProducts.size} Product${selectedProducts.size !== 1 ? "s" : ""}`
            : "Delete Product"
        }
        description={
          selectedProducts.size > 0
            ? `This action cannot be undone and will delete ${selectedProducts.size} product${selectedProducts.size !== 1 ? "s" : ""} and all associated images and files.`
            : "This action cannot be undone and will delete all associated images and files."
        }
        itemName={
          productToDelete
            ? `"${productToDelete.name}"`
            : selectedProducts.size > 0
              ? `${selectedProducts.size} product${selectedProducts.size !== 1 ? "s" : ""}`
              : undefined
        }
        isLoading={deletingProductId !== null || isBulkDeleting}
      />
    </>
  );
}
