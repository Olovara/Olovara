"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, RefreshCw, AlertTriangle, XCircle, DollarSign, Heart, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface ShopPoliciesProps {
  processingTime?: string | null;
  returnsPolicy?: string | null;
  exchangesPolicy?: string | null;
  damagesPolicy?: string | null;
  nonReturnableItems?: string | null;
  refundPolicy?: string | null;
  careInstructions?: string | null;
}

const ShopPolicies = ({
  processingTime,
  returnsPolicy,
  exchangesPolicy,
  damagesPolicy,
  nonReturnableItems,
  refundPolicy,
  careInstructions,
}: ShopPoliciesProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't render if no policies are set
  if (!processingTime && !returnsPolicy && !exchangesPolicy && !damagesPolicy && !nonReturnableItems && !refundPolicy && !careInstructions) {
    return null;
  }

  const hasMultiplePolicies = [
    processingTime, returnsPolicy, exchangesPolicy, damagesPolicy, 
    nonReturnableItems, refundPolicy, careInstructions
  ].filter(Boolean).length > 1;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Shop Policies</CardTitle>
          {hasMultiplePolicies && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="lg:hidden p-1 hover:bg-gray-100 rounded"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className={`space-y-4 ${hasMultiplePolicies && !isExpanded ? 'lg:block hidden' : 'block'}`}>
        
        {/* Processing Time - Always visible */}
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

        {/* Care Instructions */}
        {careInstructions && (
          <div className="flex items-start gap-3">
            <Heart className="h-5 w-5 text-pink-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-sm mb-1">Care Instructions</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {careInstructions}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ShopPolicies; 