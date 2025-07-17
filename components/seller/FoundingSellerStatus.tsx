"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Crown, Star, Gift, Users, Zap } from "lucide-react";
import { getCurrentUserFoundingSellerStatus, checkCurrentUserFoundingSellerEligibility } from "@/actions/productActions";

interface FoundingSellerStatus {
  isFoundingSeller: boolean;
  type: "LEGACY" | "NEW" | null;
  number: number | null;
  benefits: any;
  firstProductCreatedAt: Date | null;
}

interface FoundingSellerEligibility {
  eligible: boolean;
  reason?: string;
  currentCount: number;
}

export default function FoundingSellerStatus() {
  const [status, setStatus] = useState<FoundingSellerStatus | null>(null);
  const [eligibility, setEligibility] = useState<FoundingSellerEligibility | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const [statusResult, eligibilityResult] = await Promise.all([
          getCurrentUserFoundingSellerStatus(),
          checkCurrentUserFoundingSellerEligibility()
        ]);

        if (statusResult.success) {
          setStatus(statusResult.status);
        }

        if (eligibilityResult.success) {
          setEligibility(eligibilityResult.eligibility);
        }
      } catch (error) {
        console.error("Error fetching founding seller status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Founding Seller Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status?.isFoundingSeller) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Crown className="h-5 w-5 text-yellow-600" />
            {status.type === "LEGACY" ? "Legacy Founding Seller" : `Founding Seller #${status.number}`}
          </CardTitle>
          <CardDescription className="text-green-700">
            Congratulations! You&apos;re one of our exclusive founding sellers with special benefits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
              {status.type === "NEW" && (
                <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                  #{status.number} of 50
                </Badge>
              )}
            </div>

            {status.benefits && (
              <div className="space-y-3">
                <h4 className="font-medium text-green-800">Your Benefits:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {status.benefits.reducedPlatformFee && (
                    <div className="flex items-center gap-2 text-sm">
                      <Gift className="h-4 w-4 text-green-600" />
                      <span>{status.benefits.reducedPlatformFee}% platform fee (vs 10%)</span>
                    </div>
                  )}
                  {status.benefits.priorityPlacement && (
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="h-4 w-4 text-green-600" />
                      <span>Priority placement in search results</span>
                    </div>
                  )}
                  {status.benefits.prioritySupport && (
                    <div className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-green-600" />
                      <span>Priority customer support</span>
                    </div>
                  )}
                  {status.benefits.earlyAccessFeatures && (
                    <div className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-green-600" />
                      <span>Early access to new features</span>
                    </div>
                  )}
                  {status.benefits.featuredInMarketing && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-green-600" />
                      <span>Featured in blogs, emails, social</span>
                    </div>
                  )}
                  {status.benefits.lifetimeBenefits && (
                    <div className="flex items-center gap-2 text-sm">
                      <Crown className="h-4 w-4 text-green-600" />
                      <span>Lifetime benefits</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {status.firstProductCreatedAt && (
              <div className="text-sm text-green-700">
                <strong>First product created:</strong> {new Date(status.firstProductCreatedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (eligibility) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Crown className="h-5 w-5 text-blue-600" />
            Founding Seller Program
          </CardTitle>
          <CardDescription className="text-blue-700">
            {eligibility.eligible 
              ? `Only ${50 - eligibility.currentCount} spots remaining!` 
              : "Program is currently full"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {eligibility.eligible ? (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-blue-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Eligible
                  </Badge>
                  <span className="text-sm text-blue-700">
                    {50 - eligibility.currentCount} of 50 spots available
                  </span>
                </div>

                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-3">How to qualify:</h4>
                  <div className="space-y-2 text-sm text-blue-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Create your first product</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Be among the first 50 sellers to do so</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-blue-800">Founding Seller Benefits:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-blue-600" />
                      <span>8% platform fee (vs 10%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-blue-600" />
                      <span>Priority placement in search results</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-600" />
                      <span>Priority customer support</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-600" />
                      <span>Early access to new features</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span>Featured in blogs, emails, social</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Badge variant="outline" className="border-gray-400 text-gray-600">
                    Program Full
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  The founding seller program is currently full. All 50 spots have been claimed.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
} 