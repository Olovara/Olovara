"use client";

import { useState } from "react";
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
import ShippingProfileModal from "./ShippingProfileModal";
import EditShippingProfileModal from "./EditShippingProfileModal";

interface ShippingRate {
  id: string;
  zone: string;
  isInternational: boolean;
  price: number;
  currency: string;
  estimatedDays: number;
  additionalItem: number | null;
  serviceLevel: string | null;
  isFreeShipping: boolean;
}

interface ShippingProfile {
  id: string;
  name: string;
  isDefault: boolean;
  countryOfOrigin: string;
  sellerId: string;
  rates: ShippingRate[];
  createdAt: Date;
  updatedAt: Date;
}

interface ShippingProfilesTableProps {
  profiles: ShippingProfile[];
}

export default function ShippingProfilesTable({
  profiles,
}: ShippingProfilesTableProps) {
  const [editingProfile, setEditingProfile] = useState<ShippingProfile | null>(null);

  const handleEdit = (profile: ShippingProfile) => {
    setEditingProfile(profile);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/shipping-profiles/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete shipping profile");
      }

      toast.success("Shipping profile deleted successfully");
      window.location.reload();
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-end">
          <ShippingProfileModal />
        </div>
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
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>{profile.name}</TableCell>
                  <TableCell>
                    {profile.rates.length === 0 ? (
                      <span className="text-muted-foreground">No rates</span>
                    ) : (
                      <ul className="space-y-1">
                        {profile.rates.map((rate) => (
                          <li key={rate.id} className="border-b last:border-b-0 pb-1 last:pb-0">
                            <span className="font-medium">
                              {rate.zone}
                              {rate.isInternational && (
                                <span className="ml-1 text-xs text-muted-foreground">(International)</span>
                              )}
                            </span>: {rate.isFreeShipping ? (
                              <span className="text-green-600 font-semibold">Free Shipping</span>
                            ) : (
                              <>
                                ${ (rate.price / 100).toFixed(2) } {rate.currency}
                                {rate.additionalItem !== null && rate.additionalItem > 0 && (
                                  <span className="ml-2 text-xs text-muted-foreground">(+${(rate.additionalItem / 100).toFixed(2)} per extra item)</span>
                                )}
                              </>
                            )}
                            <span className="ml-2 text-xs text-muted-foreground">({rate.estimatedDays} days{rate.serviceLevel ? `, ${rate.serviceLevel}` : ""})</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </TableCell>
                  <TableCell>{profile.isDefault ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingProfile(profile)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(profile.id)}
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

      {editingProfile && (
        <EditShippingProfileModal
          profile={editingProfile}
          isOpen={!!editingProfile}
          onClose={() => setEditingProfile(null)}
        />
      )}
    </>
  );
} 