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

interface CountryRate {
  countryCode: string;
  price: number;
  currency: string;
}

interface ShippingRate {
  id: string;
  zone: string;
  isInternational: boolean;
  price: number;
  currency: string;
  estimatedDays: number;
  additionalItem: number | null;
  isFreeShipping: boolean;
  countryRates: CountryRate[];
}

interface ShippingOption {
  id: string;
  name: string;
  isDefault: boolean;
  countryOfOrigin: string;
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
                    {option.rates.length === 0 ? (
                      <span className="text-muted-foreground">No rates</span>
                    ) : (
                      <ul className="space-y-1">
                        {option.rates.map((rate) => (
                          <li
                            key={rate.id}
                            className="border-b last:border-b-0 pb-1 last:pb-0"
                          >
                            <span className="font-medium">
                              {rate.zone}
                              {rate.isInternational && (
                                <span className="ml-1 text-xs text-muted-foreground">
                                  (International)
                                </span>
                              )}
                            </span>
                            :{" "}
                            {rate.isFreeShipping ? (
                              <span className="text-green-600 font-semibold">
                                Free Shipping
                              </span>
                            ) : (
                              <>
                                ${(rate.price / 100).toFixed(2)} {rate.currency}
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
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({rate.estimatedDays} days)
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </TableCell>
                  <TableCell>{option.isDefault ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2">
                      <Link href={`/seller/dashboard/shipping/${option.id}/edit`}>
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
