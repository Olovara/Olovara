import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logError } from "@/lib/error-logger";

// Force dynamic rendering - this route uses auth() which is dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Declare variables outside try block so they're accessible in catch
  let session: any = null;
  let userId: string | null = null;

  try {
    session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    userId = searchParams.get("userId");

    // Validate parameters
    if (!userId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Ensure user can only access their own data
    if (session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's referral code and seller status
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        referralCode: true,
        referralCount: true,
        referredBy: true,
        seller: {
          select: {
            isFoundingSeller: true,
            foundingSellerType: true,
            hasCommissionDiscount: true,
            commissionDiscountExpiresAt: true,
            commissionDiscountMonths: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get approved seller applications from users this seller referred
    const referredSellers = await db.user.findMany({
      where: {
        referredBy: user.referralCode,
        sellerApplication: {
          applicationApproved: true,
        },
      },
      select: {
        id: true,
        username: true,
        createdAt: true,
        sellerApplication: {
          select: {
            id: true,
            applicationApproved: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10, // Limit to recent referrals
    });

    // Process recent referrals
    const recentReferrals = referredSellers.map((referredUser) => {
      return {
        id: referredUser.id,
        username: referredUser.username || "Anonymous",
        joinedAt: referredUser.createdAt,
        status: "ACTIVE" as const, // All are approved sellers
      };
    });

    // Calculate commission discount rewards based on actual discount status
    const approvedSellerReferrals = referredSellers.length;
    const commissionRewards = generateCommissionRewards(
      approvedSellerReferrals,
      user.seller?.isFoundingSeller || false,
      user.seller?.hasCommissionDiscount || false,
      user.seller?.commissionDiscountExpiresAt || null,
      user.seller?.commissionDiscountMonths || 0
    );

    const stats = {
      referralCode: user.referralCode || "No code assigned",
      referralCount: approvedSellerReferrals,
      totalReferrals: approvedSellerReferrals,
      activeRewards: commissionRewards,
      recentReferrals,
      sellerType: user.seller?.isFoundingSeller
        ? "Founding Seller"
        : "Regular Seller",
      baseCommission: user.seller?.isFoundingSeller ? "8%" : "10%",
      // Add applicant discount info if they used a referral code
      applicantDiscount: user.referredBy
        ? {
            hasDiscount: user.seller?.hasCommissionDiscount || false,
            expiresAt: user.seller?.commissionDiscountExpiresAt || null,
            monthsEarned: user.seller?.commissionDiscountMonths || 0,
          }
        : null,
    };

    return NextResponse.json(stats);
  } catch (error) {
    // Log to console (always happens)
    console.error("Error fetching referral stats:", error);

    // Don't log validation errors - they're expected client-side issues

    // Log to database - user could email about "can't load referral stats"
    const userMessage = logError({
      code: "REFERRAL_STATS_FETCH_FAILED",
      userId: session?.user?.id,
      route: "/api/referrals/stats",
      method: "GET",
      error,
      metadata: {
        requestedUserId: userId,
        note: "Failed to fetch referral stats",
      },
    });

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

// Generate commission discount rewards based on actual discount status
function generateCommissionRewards(
  approvedSellerReferrals: number,
  isFoundingSeller: boolean,
  hasActiveDiscount: boolean,
  discountExpiresAt: Date | null,
  totalDiscountMonths: number
) {
  const rewards = [];
  const baseCommission = isFoundingSeller ? 8 : 10;

  // Check if there's an active discount
  if (hasActiveDiscount && discountExpiresAt) {
    const now = new Date();
    const isExpired = discountExpiresAt < now;

    if (!isExpired) {
      // Active discount
      const discountPercentage = 2;
      const newCommission = Math.max(baseCommission - discountPercentage, 0);
      const timeRemaining = discountExpiresAt.getTime() - now.getTime();
      const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));

      rewards.push({
        id: "commission-discount",
        type: "DISCOUNT" as const,
        title: "Commission Fee Discount",
        description: `Active discount earned from referring ${totalDiscountMonths} approved sellers`,
        value: `${discountPercentage}% off commission (${newCommission}% instead of ${baseCommission}%)`,
        isActive: true,
        expiresAt: discountExpiresAt,
        details: {
          baseCommission: `${baseCommission}%`,
          newCommission: `${newCommission}%`,
          discountPercentage: `${discountPercentage}%`,
          approvedReferrals: totalDiscountMonths,
          daysRemaining: daysRemaining,
          totalMonthsEarned: totalDiscountMonths,
        },
      });
    }
  }

  // Calculate next milestone
  const nextMilestone = Math.ceil(approvedSellerReferrals / 3) * 3;
  const referralsNeeded = nextMilestone - approvedSellerReferrals;

  if (referralsNeeded > 0 && referralsNeeded <= 3) {
    rewards.push({
      id: "upcoming-milestone",
      type: "BADGE" as const,
      title: "Upcoming Milestone",
      description: `Refer ${referralsNeeded} more approved seller${referralsNeeded > 1 ? "s" : ""} to earn your next commission discount`,
      value: `${referralsNeeded} more referral${referralsNeeded > 1 ? "s" : ""} needed`,
      isActive: false,
      details: {
        currentReferrals: approvedSellerReferrals,
        nextMilestone: nextMilestone,
        referralsNeeded: referralsNeeded,
      },
    });
  }

  return rewards;
}
