"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useState } from "react";
import { SHIPPING_ZONES } from "@/data/shipping";
import { getCountryByCode } from "@/data/countries";
import { SUPPORTED_CURRENCIES } from "@/data/units";
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ShippingRate {
  id: string;
  type: "zone" | "country";
  zone?: string;
  countryCode?: string;
  price: number;
  additionalItem: number | null;
  isFreeShipping: boolean;
}

interface ShippingOption {
  id: string;
  name: string;
  isDefault: boolean;
  countryOfOrigin: string;
  defaultShipping?: number | null;
  defaultShippingCurrency?: string;
  sellerId: string;
  rates: ShippingRate[];
  createdAt: Date;
  updatedAt: Date;
}

interface ShippingOptionsTableProps {
  options: ShippingOption[];
}

export default function ShippingOptionsTable({
  options,
}: ShippingOptionsTableProps) {
  const router = useRouter();
  const [duplicatingOptionId, setDuplicatingOptionId] = useState<string | null>(
    null
  );
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [optionToDelete, setOptionToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deletingOptionId, setDeletingOptionId] = useState<string | null>(null);

  // Handler function to open delete confirmation modal
  const handleDeleteClick = (id: string, name: string) => {
    setOptionToDelete({ id, name });
    setDeleteModalOpen(true);
  };

  // Handler function to confirm and delete a shipping option
  const handleDeleteConfirm = async () => {
    if (!optionToDelete) return;

    const id = optionToDelete.id;

    // Prevent duplicate requests
    if (deletingOptionId === id) return;

    setDeletingOptionId(id);
    setDeleteModalOpen(false);

    try {
      const response = await fetch(`/api/shipping-options/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete shipping option");
      }

      toast.success("Shipping option deleted successfully");
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setDeletingOptionId(null);
      setOptionToDelete(null);
    }
  };

  // Handler function to duplicate a shipping option
  const handleDuplicate = async (optionId: string) => {
    // Prevent duplicate requests
    if (duplicatingOptionId === optionId) return;

    setDuplicatingOptionId(optionId);

    try {
      const response = await fetch(
        `/api/shipping-options/${optionId}/duplicate`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to duplicate shipping option");
      }

      toast.success("Shipping option duplicated successfully!");

      // Refresh to show the new shipping option in the list
      router.refresh();
    } catch (error) {
      console.error("Error duplicating shipping option:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to duplicate shipping option. Please try again."
      );
    } finally {
      setDuplicatingOptionId(null);
    }
  };

  // Helper function to get display name for a rate
  const getRateDisplayName = (rate: ShippingRate) => {
    if (rate.type === "zone" && rate.zone) {
      const zone = SHIPPING_ZONES.find((z) => z.id === rate.zone);
      return zone?.name || rate.zone;
    } else if (rate.type === "country" && rate.countryCode) {
      const country = getCountryByCode(rate.countryCode);
      return country?.name || rate.countryCode;
    }
    return "Unknown";
  };

  // Helper function to format shipping price
  const formatShippingPrice = (
    price: number,
    currency: string = "USD",
    isFreeShipping: boolean = false
  ) => {
    if (isFreeShipping) {
      return (
        <span className="text-green-600 font-semibold">Free Shipping</span>
      );
    }
    const currencyInfo =
      SUPPORTED_CURRENCIES.find((c) => c.code === currency) ||
      SUPPORTED_CURRENCIES[0];
    const decimals = currencyInfo.decimals;
    const divisor = Math.pow(10, decimals);
    const displayValue = price / divisor;
    return (
      <>
        {currencyInfo.symbol}
        {displayValue.toFixed(decimals)} {currency}
      </>
    );
  };

  return (
    <>
      <div className="space-y-4">
        {/* Desktop Table View - Hidden on mobile */}
        <div className="hidden md:block rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Rates</TableHead>
                <TableHead>Default</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {options.map((option) => (
                <TableRow key={option.id}>
                  <TableCell>{option.name}</TableCell>
                  <TableCell>
                    <ul className="space-y-1">
                      {/* Display default shipping cost */}
                      {option.defaultShipping !== null &&
                        option.defaultShipping !== undefined && (
                          <li className="border-b pb-1">
                            <span className="font-medium">
                              Default (Worldwide)
                            </span>
                            :{" "}
                            {(() => {
                              const currency =
                                option.defaultShippingCurrency || "USD";
                              const currencyInfo =
                                SUPPORTED_CURRENCIES.find(
                                  (c) => c.code === currency
                                ) || SUPPORTED_CURRENCIES[0];
                              const decimals = currencyInfo.decimals;
                              const divisor = Math.pow(10, decimals);
                              const displayValue =
                                option.defaultShipping / divisor;
                              return (
                                <>
                                  {currencyInfo.symbol}
                                  {displayValue.toFixed(decimals)} {currency}
                                </>
                              );
                            })()}
                          </li>
                        )}
                      {/* Display exception rates */}
                      {option.rates.length === 0 ? (
                        option.defaultShipping === null ||
                        option.defaultShipping === undefined ? (
                          <li>
                            <span className="text-muted-foreground">
                              No rates
                            </span>
                          </li>
                        ) : null
                      ) : (
                        option.rates.map((rate) => {
                          // Get display name based on type
                          let displayName = "";
                          if (rate.type === "zone" && rate.zone) {
                            const zone = SHIPPING_ZONES.find(
                              (z) => z.id === rate.zone
                            );
                            displayName = zone?.name || rate.zone;
                          } else if (
                            rate.type === "country" &&
                            rate.countryCode
                          ) {
                            const country = getCountryByCode(rate.countryCode);
                            displayName = country?.name || rate.countryCode;
                          } else {
                            displayName = "Unknown";
                          }

                          return (
                            <li
                              key={rate.id}
                              className="border-b last:border-b-0 pb-1 last:pb-0"
                            >
                              <span className="font-medium">{displayName}</span>
                              :{" "}
                              {rate.isFreeShipping ? (
                                <span className="text-green-600 font-semibold">
                                  Free Shipping
                                </span>
                              ) : (
                                <>
                                  ${(rate.price / 100).toFixed(2)}
                                  {rate.additionalItem !== null &&
                                    rate.additionalItem > 0 && (
                                      <span className="ml-2 text-xs text-muted-foreground">
                                        (+$
                                        {(rate.additionalItem / 100).toFixed(
                                          2
                                        )}{" "}
                                        per extra item)
                                      </span>
                                    )}
                                </>
                              )}
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </TableCell>
                  <TableCell>{option.isDefault ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/seller/dashboard/shipping/${option.id}/edit`}
                      >
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicate(option.id)}
                        disabled={duplicatingOptionId === option.id}
                        title="Duplicate shipping option"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDeleteClick(option.id, option.name)
                        }
                        disabled={deletingOptionId === option.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View - Hidden on desktop */}
        <div className="md:hidden space-y-4">
          {options.map((option) => (
            <Card key={option.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">
                      {option.name}
                    </h3>
                    {option.isDefault && (
                      <Badge variant="default" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Shipping Rates */}
                <div className="space-y-2 mb-4">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Shipping Rates:
                  </div>

                  {/* Default shipping cost */}
                  {option.defaultShipping !== null &&
                    option.defaultShipping !== undefined && (
                      <div className="border-b pb-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            Default (Worldwide)
                          </span>
                          <span className="text-sm">
                            {formatShippingPrice(
                              option.defaultShipping,
                              option.defaultShippingCurrency || "USD",
                              false
                            )}
                          </span>
                        </div>
                      </div>
                    )}

                  {/* Exception rates */}
                  {option.rates.length === 0 ? (
                    option.defaultShipping === null ||
                    option.defaultShipping === undefined ? (
                      <div className="text-sm text-muted-foreground">
                        No rates configured
                      </div>
                    ) : null
                  ) : (
                    <div className="space-y-2">
                      {option.rates.map((rate) => (
                        <div
                          key={rate.id}
                          className="flex justify-between items-center text-sm border-b last:border-b-0 pb-2 last:pb-0"
                        >
                          <span className="font-medium">
                            {getRateDisplayName(rate)}
                          </span>
                          <span>
                            {rate.isFreeShipping ? (
                              <span className="text-green-600 font-semibold">
                                Free
                              </span>
                            ) : (
                              <>
                                ${(rate.price / 100).toFixed(2)}
                                {rate.additionalItem !== null &&
                                  rate.additionalItem > 0 && (
                                    <span className="ml-1 text-xs text-muted-foreground">
                                      (+$
                                      {(rate.additionalItem / 100).toFixed(2)})
                                    </span>
                                  )}
                              </>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="flex-1"
                  >
                    <Link href={`/seller/dashboard/shipping/${option.id}/edit`}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(option.id)}
                    disabled={duplicatingOptionId === option.id}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {duplicatingOptionId === option.id
                      ? "Duplicating..."
                      : "Duplicate"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(option.id, option.name)}
                    disabled={deletingOptionId === option.id}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Shipping Option"
        description="This action cannot be undone. All shipping rates associated with this option will also be deleted."
        itemName={optionToDelete ? `"${optionToDelete.name}"` : undefined}
        isLoading={deletingOptionId !== null}
      />
    </>
  );
}
