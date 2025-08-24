"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Follow a seller
 * @param sellerId - The ID of the seller to follow
 * @returns Success status and updated follower count
 */
export async function followSeller(sellerId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to follow sellers",
      };
    }

    const userId = session.user.id;

    // Check if seller exists
    const seller = await db.seller.findUnique({
      where: { id: sellerId },
      select: { id: true, shopName: true, followerCount: true },
    });

    if (!seller) {
      return { success: false, error: "Seller not found" };
    }

    // Check if already following
    const existingFollow = await db.follow.findUnique({
      where: {
        followerId_sellerId: {
          followerId: userId,
          sellerId: sellerId,
        },
      },
    });

    if (existingFollow) {
      return { success: false, error: "You are already following this seller" };
    }

    // Create follow relationship and update follower count in a transaction
    await db.$transaction([
      db.follow.create({
        data: {
          followerId: userId,
          sellerId: sellerId,
        },
      }),
      db.seller.update({
        where: { id: sellerId },
        data: { followerCount: { increment: 1 } },
      }),
    ]);

    // Revalidate relevant pages
    revalidatePath(`/seller/${seller.shopName}`);
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `You are now following ${seller.shopName}`,
      followerCount: seller.followerCount + 1,
    };
  } catch (error) {
    console.error("Error following seller:", error);
    return { success: false, error: "Failed to follow seller" };
  }
}

/**
 * Unfollow a seller
 * @param sellerId - The ID of the seller to unfollow
 * @returns Success status and updated follower count
 */
export async function unfollowSeller(sellerId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to unfollow sellers",
      };
    }

    const userId = session.user.id;

    // Check if seller exists
    const seller = await db.seller.findUnique({
      where: { id: sellerId },
      select: { id: true, shopName: true, followerCount: true },
    });

    if (!seller) {
      return { success: false, error: "Seller not found" };
    }

    // Check if following
    const existingFollow = await db.follow.findUnique({
      where: {
        followerId_sellerId: {
          followerId: userId,
          sellerId: sellerId,
        },
      },
    });

    if (!existingFollow) {
      return { success: false, error: "You are not following this seller" };
    }

    // Remove follow relationship and update follower count in a transaction
    await db.$transaction([
      db.follow.delete({
        where: {
          followerId_sellerId: {
            followerId: userId,
            sellerId: sellerId,
          },
        },
      }),
      db.seller.update({
        where: { id: sellerId },
        data: { followerCount: { decrement: 1 } },
      }),
    ]);

    // Revalidate relevant pages
    revalidatePath(`/seller/${seller.shopName}`);
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `You have unfollowed ${seller.shopName}`,
      followerCount: Math.max(0, seller.followerCount - 1), // Ensure count doesn't go negative
    };
  } catch (error) {
    console.error("Error unfollowing seller:", error);
    return { success: false, error: "Failed to unfollow seller" };
  }
}

/**
 * Check if user is following a seller
 * @param sellerId - The ID of the seller to check
 * @returns Whether the user is following the seller
 */
export async function isFollowingSeller(sellerId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return false;
    }

    const userId = session.user.id;

    const follow = await db.follow.findUnique({
      where: {
        followerId_sellerId: {
          followerId: userId,
          sellerId: sellerId,
        },
      },
    });

    return !!follow;
  } catch (error) {
    console.error("Error checking follow status:", error);
    return false;
  }
}

/**
 * Get all sellers that a user is following
 * @param userId - The ID of the user (optional, defaults to current user)
 * @returns Array of followed sellers with basic info
 */
export async function getFollowedSellers(userId?: string) {
  try {
    const session = await auth();
    const currentUserId = userId || session?.user?.id;

    if (!currentUserId) {
      return [];
    }

    const follows = await db.follow.findMany({
      where: { followerId: currentUserId },
      include: {
        seller: {
          select: {
            id: true,
            shopName: true,
            shopNameSlug: true,
            shopTagLine: true,
            sellerImage: true,
            followerCount: true,
            totalProducts: true,
            products: {
              where: { status: "ACTIVE" },
              select: { id: true, name: true, images: true, price: true },
              take: 3,
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return follows.map((follow) => follow.seller);
  } catch (error) {
    console.error("Error getting followed sellers:", error);
    return [];
  }
}

/**
 * Get recent products from followed sellers for feed
 * @param limit - Maximum number of products to return
 * @returns Array of recent products from followed sellers
 */
export async function getFollowedSellersFeed(limit: number = 20) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.log("No session found in getFollowedSellersFeed");
      return [];
    }

    const userId = session.user.id;
    console.log("Getting followed sellers feed for user:", userId);

    // Get all sellers the user is following
    const followedSellers = await db.follow.findMany({
      where: { followerId: userId },
      select: { sellerId: true },
    });

    if (followedSellers.length === 0) {
      console.log("No followed sellers found for user:", userId);
      return [];
    }

    const sellerIds = followedSellers.map((f) => f.sellerId);
    console.log("Found followed seller IDs:", sellerIds);

    // Get the userIds of the followed sellers
    const followedSellerUsers = await db.seller.findMany({
      where: { id: { in: sellerIds } },
      select: { userId: true },
    });

    if (followedSellerUsers.length === 0) {
      console.log("No seller users found for seller IDs:", sellerIds);
      return [];
    }

    const sellerUserIds = followedSellerUsers.map((s) => s.userId);
    console.log("Found seller user IDs:", sellerUserIds);

    // Get recent products from followed sellers
    const products = await db.product.findMany({
      where: {
        userId: { in: sellerUserIds },
        status: "ACTIVE",
      },
      include: {
        seller: {
          select: {
            id: true,
            shopName: true,
            shopNameSlug: true,
            sellerImage: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    console.log("Found products from followed sellers:", products.length);
    return products;
  } catch (error) {
    console.error("Error getting followed sellers feed:", error);
    return [];
  }
}

/**
 * Get followers of a seller (for seller dashboard)
 * @param sellerId - The ID of the seller
 * @param limit - Maximum number of followers to return
 * @returns Array of followers with basic user info
 */
export async function getSellerFollowers(sellerId: string, limit: number = 50) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return [];
    }

    // Verify the current user is the seller or has permission
    const seller = await db.seller.findUnique({
      where: { id: sellerId },
      select: { userId: true },
    });

    if (!seller || seller.userId !== session.user.id) {
      return [];
    }

    const followers = await db.follow.findMany({
      where: { sellerId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            image: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return followers.map((follow) => follow.follower);
  } catch (error) {
    console.error("Error getting seller followers:", error);
    return [];
  }
}

/**
 * Get follower count for a seller
 * @param sellerId - The ID of the seller
 * @returns Follower count
 */
export async function getSellerFollowerCount(sellerId: string) {
  try {
    const seller = await db.seller.findUnique({
      where: { id: sellerId },
      select: { followerCount: true },
    });

    return seller?.followerCount || 0;
  } catch (error) {
    console.error("Error getting seller follower count:", error);
    return 0;
  }
}
