"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

interface ShippingRate {
  id: string;
  service: string;
  carrier: string;
  amount: number;
  currency: string;
  deliveryDays: number;
  deliveryDate: string;
}

interface ShippingCalculatorProps {
  productId: string;
  onShippingRateCalculated: (rate: number) => void;
}

export const ShippingCalculator = ({ productId, onShippingRateCalculated }: ShippingCalculatorProps) => {
  const [loading, setLoading] = useState(false);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<string>("");
  const [destinationAddress, setDestinationAddress] = useState({
    name: "",
    street1: "",
    street2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    phone: "",
    email: "",
  });

  const calculateShipping = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          destinationAddress,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setShippingRates(data.rates);
        if (data.rates.length > 0) {
          setSelectedRate(data.rates[0].id);
          onShippingRateCalculated(data.rates[0].amount);
        }
      }
    } catch (error) {
      console.error("Error calculating shipping:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Shipping Calculator</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={destinationAddress.name}
                onChange={(e) => 
                  setDestinationAddress(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={destinationAddress.email}
                onChange={(e) => 
                  setDestinationAddress(prev => ({ ...prev, email: e.target.value }))
                }
                placeholder="Enter your email"
              />
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                type="tel"
                value={destinationAddress.phone}
                onChange={(e) => 
                  setDestinationAddress(prev => ({ ...prev, phone: e.target.value }))
                }
                placeholder="Enter your phone number"
              />
            </div>

            <div className="space-y-2">
              <Label>Country</Label>
              <Select
                value={destinationAddress.country}
                onValueChange={(value) => 
                  setDestinationAddress(prev => ({ ...prev, country: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                  <SelectItem value="DE">Germany</SelectItem>
                  <SelectItem value="FR">France</SelectItem>
                  <SelectItem value="IT">Italy</SelectItem>
                  <SelectItem value="ES">Spain</SelectItem>
                  <SelectItem value="JP">Japan</SelectItem>
                  <SelectItem value="CN">China</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Street Address</Label>
              <Input
                value={destinationAddress.street1}
                onChange={(e) => 
                  setDestinationAddress(prev => ({ ...prev, street1: e.target.value }))
                }
                placeholder="Enter street address"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Apartment, suite, etc. (optional)</Label>
              <Input
                value={destinationAddress.street2}
                onChange={(e) => 
                  setDestinationAddress(prev => ({ ...prev, street2: e.target.value }))
                }
                placeholder="Enter apartment, suite, etc."
              />
            </div>

            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={destinationAddress.city}
                onChange={(e) => 
                  setDestinationAddress(prev => ({ ...prev, city: e.target.value }))
                }
                placeholder="Enter city"
              />
            </div>

            <div className="space-y-2">
              <Label>State/Province</Label>
              <Input
                value={destinationAddress.state}
                onChange={(e) => 
                  setDestinationAddress(prev => ({ ...prev, state: e.target.value }))
                }
                placeholder="Enter state/province"
              />
            </div>

            <div className="space-y-2">
              <Label>Postal Code</Label>
              <Input
                value={destinationAddress.postalCode}
                onChange={(e) => 
                  setDestinationAddress(prev => ({ ...prev, postalCode: e.target.value }))
                }
                placeholder="Enter postal code"
              />
            </div>
          </div>

          <button
            onClick={calculateShipping}
            disabled={loading || !destinationAddress.country || !destinationAddress.postalCode || !destinationAddress.street1}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md"
          >
            {loading ? "Calculating..." : "Calculate Shipping"}
          </button>

          {shippingRates.length > 0 && (
            <div className="space-y-2">
              <Label>Available Shipping Options</Label>
              <Select
                value={selectedRate}
                onValueChange={(value) => {
                  setSelectedRate(value);
                  const rate = shippingRates.find(r => r.id === value);
                  if (rate) {
                    onShippingRateCalculated(rate.amount);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select shipping option" />
                </SelectTrigger>
                <SelectContent>
                  {shippingRates.map((rate) => (
                    <SelectItem key={rate.id} value={rate.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {rate.carrier} {rate.service}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ${(rate.amount / 100).toFixed(2)} • 
                          {rate.deliveryDays ? ` ${rate.deliveryDays} days` : ""}
                          {rate.deliveryDate ? ` (Est. delivery: ${format(new Date(rate.deliveryDate), 'MMM d, yyyy')})` : ""}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 