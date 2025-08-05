"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Info } from "lucide-react";
import { useState } from "react";
import { ProductSchema } from "@/schemas/ProductSchema";

interface ProductDraftStatusProps {
  product: any; // Product data from database
  onActivate?: () => void;
  isActivating?: boolean;
}

export function ProductDraftStatus({ product, onActivate, isActivating }: ProductDraftStatusProps) {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateProduct = () => {
    try {
      // Convert product data to form format for validation
      const productData = {
        ...product,
        price: product.price / 100, // Convert from cents
        shippingCost: product.shippingCost ? product.shippingCost / 100 : 0,
        handlingFee: product.handlingFee ? product.handlingFee / 100 : 0,
      };

      const result = ProductSchema.safeParse(productData);
      
      if (!result.success) {
        const errors = result.error.errors.map(err => {
          const field = err.path.join('.');
          return `${field}: ${err.message}`;
        });
        setValidationErrors(errors);
        return false;
      }
      
      setValidationErrors([]);
      return true;
    } catch (error) {
      console.error('Validation error:', error);
      return false;
    }
  };

  const handleActivate = () => {
    if (validateProduct()) {
      onActivate?.();
    }
  };

  if (product.status !== "DRAFT") {
    return null;
  }

  return (
    <Card className="mb-6 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          Product Draft
        </CardTitle>
        <CardDescription className="text-orange-700">
          This product is saved as a draft. Complete all required fields to make it active and visible to customers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-300">
            Draft Status
          </Badge>
          <span className="text-sm text-orange-700">
            Not visible to customers
          </span>
        </div>

        {validationErrors.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Missing Required Fields</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 space-y-1">
                {validationErrors.slice(0, 5).map((error, index) => (
                  <li key={index} className="text-sm text-red-600">
                    • {error}
                  </li>
                ))}
                {validationErrors.length > 5 && (
                  <li className="text-sm text-red-600">
                    • And {validationErrors.length - 5} more fields...
                  </li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleActivate}
            disabled={isActivating || validationErrors.length > 0}
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {isActivating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Activating...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Activate Product
              </>
            )}
          </Button>
          
          {validationErrors.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-orange-700">
              <Info className="h-4 w-4" />
              Complete all required fields to activate
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 