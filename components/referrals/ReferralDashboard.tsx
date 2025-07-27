"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Copy, Users, Gift, TrendingUp, Share2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ReferralStats {
  referralCode: string;
  referralCount: number;
  totalReferrals: number;
  activeRewards: ReferralReward[];
  recentReferrals: RecentReferral[];
  sellerType: string;
  baseCommission: string;
  applicantDiscount?: {
    hasDiscount: boolean;
    expiresAt: Date | null;
    monthsEarned: number;
  } | null;
}

interface ReferralReward {
  id: string;
  type: "DISCOUNT" | "CREDIT" | "FEATURE" | "BADGE";
  title: string;
  description: string;
  value: string;
  isActive: boolean;
  expiresAt?: Date;
}

interface RecentReferral {
  id: string;
  username: string;
  joinedAt: Date;
  status: "PENDING" | "ACTIVE" | "INACTIVE";
}

interface ReferralDashboardProps {
  userId: string;
}

export default function ReferralDashboard({ userId }: ReferralDashboardProps) {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

    const fetchReferralStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/referrals/stats?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch referral stats');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching referral stats:', error);
      toast.error('Failed to load referral information');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchReferralStats();
  }, [fetchReferralStats]);

  const copyReferralCode = async () => {
    if (!stats?.referralCode) return;
    
    try {
      await navigator.clipboard.writeText(stats.referralCode);
      setCopied(true);
      toast.success('Referral code copied to clipboard!');
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy referral code');
    }
  };

  const shareReferralCode = async () => {
    if (!stats?.referralCode) return;
    
    const shareText = `Join me on Yarnnu! Use my referral code: ${stats.referralCode}`;
    const shareUrl = `${window.location.origin}?ref=${stats.referralCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Yarnnu',
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to copying to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        toast.success('Referral link copied to clipboard!');
      } catch (error) {
        toast.error('Failed to copy referral link');
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Referral Data</CardTitle>
          <CardDescription>
            Unable to load your referral information. Please try again later.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-purple-800">
              Seller Referral Program
            </CardTitle>
            <CardDescription className="text-lg">
              Refer other sellers and earn commission discounts on your sales
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Referral Code Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-purple-600" />
              Your Referral Code
            </CardTitle>
            <CardDescription>
              Share this code with other sellers to earn commission discounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3">
              <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-purple-300">
                <code className="text-xl font-mono font-bold text-purple-700">
                  {stats.referralCode}
                </code>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={copyReferralCode}
                  variant={copied ? "default" : "outline"}
                  className="flex-1 sm:min-w-[100px]"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button onClick={shareReferralCode} variant="outline" className="flex-1 sm:flex-none">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Total Referrals */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalReferrals}</p>
              </div>
              <Users className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        {/* Approved Seller Referrals */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved Sellers</p>
                <p className="text-3xl font-bold text-green-600">{stats.referralCount}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        {/* Commission Discount */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Commission Discount</p>
                <p className="text-3xl font-bold text-orange-600">
                  {stats.activeRewards.filter(r => r.isActive && r.type === "DISCOUNT").length > 0 ? "Active" : "None"}
                </p>
              </div>
              <Gift className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Active Rewards Section */}
      {stats.activeRewards.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-orange-600" />
                Commission Discounts
              </CardTitle>
              <CardDescription>
                Discounts earned from referring approved sellers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.activeRewards.map((reward) => (
                  <div
                    key={reward.id}
                    className={`p-4 rounded-lg border ${
                      reward.isActive 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{reward.title}</h4>
                          <Badge variant={reward.isActive ? "default" : "secondary"}>
                            {reward.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{reward.description}</p>
                        <p className="text-lg font-bold text-purple-600">{reward.value}</p>
                        {reward.expiresAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            Expires: {new Date(reward.expiresAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent Referrals Section */}
      {stats.recentReferrals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Recent Seller Referrals
              </CardTitle>
              <CardDescription>
                Approved sellers you&apos;ve recently referred to Yarnnu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentReferrals.map((referral) => (
                  <div key={referral.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-purple-600">
                          {referral.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{referral.username}</p>
                        <p className="text-sm text-gray-500">
                          Joined {new Date(referral.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={
                        referral.status === "ACTIVE" ? "default" :
                        referral.status === "PENDING" ? "secondary" : "destructive"
                      }
                    >
                      {referral.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Applicant Discount Section - Only show if they used a referral code */}
      {stats.applicantDiscount && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Gift className="h-5 w-5" />
                Your Referral Bonus
              </CardTitle>
              <CardDescription className="text-blue-700">
                You earned a commission discount for using a referral code when you applied!
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.applicantDiscount.hasDiscount && stats.applicantDiscount.expiresAt ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                    <div>
                      <h4 className="font-semibold text-blue-900">Commission Discount Active</h4>
                      <p className="text-sm text-blue-700">
                        You&apos;re currently paying {stats.sellerType === "Founding Seller" ? "6%" : "8%"} commission instead of {stats.baseCommission}
                      </p>
                    </div>
                    <Badge variant="default" className="bg-blue-600">
                      Active
                    </Badge>
                  </div>
                  <div className="text-sm text-blue-600">
                    <p>Expires: {new Date(stats.applicantDiscount.expiresAt).toLocaleDateString()}</p>
                    <p>Duration: {stats.applicantDiscount.monthsEarned} month{stats.applicantDiscount.monthsEarned > 1 ? 's' : ''}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-blue-700">Your referral bonus has expired</p>
                  <p className="text-sm text-blue-600 mt-1">
                    You earned {stats.applicantDiscount.monthsEarned} month{stats.applicantDiscount.monthsEarned > 1 ? 's' : ''} of commission discount
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* How It Works Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>How Seller Referrals Work</CardTitle>
            <CardDescription>
              Learn how to earn commission discounts by referring other sellers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Seller Info */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-2">Your Seller Status</h4>
                <p className="text-sm text-purple-700">
                  <strong>{stats.sellerType}</strong> - Base Commission: <strong>{stats.baseCommission}</strong>
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-purple-600">1</span>
                  </div>
                  <h4 className="font-semibold mb-2">Share Your Code</h4>
                  <p className="text-sm text-gray-600">
                    Share your referral code with other sellers
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-purple-600">2</span>
                  </div>
                  <h4 className="font-semibold mb-2">They Apply</h4>
                  <p className="text-sm text-gray-600">
                    They use your code when applying as sellers
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-purple-600">3</span>
                  </div>
                  <h4 className="font-semibold mb-2">They Get Approved</h4>
                  <p className="text-sm text-gray-600">
                    When they get approved as sellers
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-purple-600">4</span>
                  </div>
                  <h4 className="font-semibold mb-2">Earn Discount</h4>
                  <p className="text-sm text-gray-600">
                    Get 2% commission discount for 1 month per 3 approved sellers
                  </p>
                </div>
              </div>
              
              {/* Commission Structure */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">How Referral Rewards Work</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-green-600">3 Referrals</div>
                    <div className="text-gray-600">Earn 1 month</div>
                    <div className="text-xs text-gray-500">of 2% discount</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-green-600">6 Referrals</div>
                    <div className="text-gray-600">Earn 2 months</div>
                    <div className="text-xs text-gray-500">of 2% discount</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-green-600">9 Referrals</div>
                    <div className="text-gray-600">Earn 3 months</div>
                    <div className="text-xs text-gray-500">of 2% discount</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-green-600">12+ Referrals</div>
                    <div className="text-gray-600">Earn 4+ months</div>
                    <div className="text-xs text-gray-500">of 2% discount</div>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                  <h5 className="font-semibold text-blue-800 mb-1">🎁 Applicant Bonus</h5>
                  <p className="text-xs text-blue-700">
                    When you use a referral code during your seller application, you automatically get 1 month of 2% commission discount!
                  </p>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  * You always get 2% off your commission. More referrals = longer discount period
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
} 