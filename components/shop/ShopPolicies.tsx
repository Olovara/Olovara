"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, RefreshCw, AlertTriangle, XCircle, DollarSign } from "lucide-react";

interface ShopPoliciesProps {
  processingTime?: string | null;
  returnsPolicy?: string | null;
  exchangesPolicy?: string | null;
  damagesPolicy?: string | null;
  nonReturnableItems?: string | null;
  refundPolicy?: string | null;
}

const ShopPolicies = ({
  processingTime,
  returnsPolicy,
  exchangesPolicy,
  damagesPolicy,
  nonReturnableItems,
  refundPolicy,
}: ShopPoliciesProps) => {
  // Don't render if no policies are set
  if (!processingTime && !returnsPolicy && !exchangesPolicy && !damagesPolicy && !nonReturnableItems && !refundPolicy) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Shop Policies</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Processing Time */}
        {processingTime && (
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm">Processing Time</h4>
                <Badge variant="secondary" className="text-xs">
                  {processingTime}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Returns Policy */}
        {returnsPolicy && (
          <div className="flex items-start gap-3">
            <RefreshCw className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-sm mb-1">Returns Policy</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {returnsPolicy}
              </p>
            </div>
          </div>
        )}

        {/* Exchanges Policy */}
        {exchangesPolicy && (
          <div className="flex items-start gap-3">
            <RefreshCw className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-sm mb-1">Exchanges Policy</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {exchangesPolicy}
              </p>
            </div>
          </div>
        )}

        {/* Damages Policy */}
        {damagesPolicy && (
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-sm mb-1">Damages & Issues</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {damagesPolicy}
              </p>
            </div>
          </div>
        )}

        {/* Non-Returnable Items */}
        {nonReturnableItems && (
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-sm mb-1">Non-Returnable Items</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {nonReturnableItems}
              </p>
            </div>
          </div>
        )}

        {/* Refund Policy */}
        {refundPolicy && (
          <div className="flex items-start gap-3">
            <DollarSign className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-sm mb-1">Refund Policy</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {refundPolicy}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ShopPolicies; 