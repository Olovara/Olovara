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
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { SHIPPING_ZONES } from "@/data/shipping";
import { getCountryByCode } from "@/data/countries";
import { SUPPORTED_CURRENCIES } from "@/data/units";

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

  const handleDelete = async (id: string) => {
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
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Modal removed - shipping options are now created on a dedicated page */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Rates</TableHead>
                <TableHead>Default</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                            <span className="font-medium">Default (Worldwide)</span>
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
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2">
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
                        onClick={() => handleDelete(option.id)}
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
      </div>
    </>
  );
}
