"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";

// Create a new wishlist
export async function createWishlist(data: {
  name: string;
  description?: string;
  privacy?: "PRIVATE" | "PUBLIC" | "SHAREABLE";
  allowPurchases?: boolean;
  hideOnPurchase?: boolean;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Generate a unique slug
    const slug = `${data.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${nanoid(6)}`;

    const wishlist = await db.wishlist.create({
      data: {
        userId: session.user.id,
        name: data.name,
        description: data.description,
        slug,
        privacy: data.privacy || "PRIVATE",
        allowPurchases: data.allowPurchases || false,
        hideOnPurchase: data.hideOnPurchase || false,
        isDefault: false, // Will be set to true if this is the first wishlist
      },
    });

    // If this is the user's first wishlist, make it default
    const wishlistCount = await db.wishlist.count({
      where: { userId: session.user.id },
    });

    if (wishlistCount === 1) {
      await db.wishlist.update({
        where: { id: wishlist.id },
        data: { isDefault: true },
      });
    }

    // Create analytics record
    await db.wishlistAnalytics.create({
      data: {
        wishlistId: wishlist.id,
      },
    });

    revalidatePath("/dashboard");
    return { success: true, wishlist };
  } catch (error) {
    console.error("Error creating wishlist:", error);
    return { success: false, error: "Failed to create wishlist" };
  }
}

// Add product to wishlist
export async function addToWishlist(data: {
  productId: string;
  wishlistId?: string; // If not provided, use default wishlist
  notes?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    let wishlistId = data.wishlistId;

    // If no wishlist specified, use default wishlist
    if (!wishlistId) {
      const defaultWishlist = await db.wishlist.findFirst({
        where: {
          userId: session.user.id,
          isDefault: true,
        },
      });

             if (!defaultWishlist) {
         // Create default wishlist if none exists
         const newWishlist = await db.wishlist.create({
           data: {
             userId: session.user.id,
             name: "Default",
             slug: `default-${nanoid(6)}`,
             isDefault: true,
           },
         });
        wishlistId = newWishlist.id;

        // Create analytics record
        await db.wishlistAnalytics.create({
          data: {
            wishlistId: newWishlist.id,
          },
        });
      } else {
        wishlistId = defaultWishlist.id;
      }
    }

    // Check if product is already in wishlist
    const existingItem = await db.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId,
          productId: data.productId,
        },
      },
    });

    if (existingItem) {
      return { success: false, error: "Product already in wishlist" };
    }

    // Add product to wishlist
    const wishlistItem = await db.wishlistItem.create({
      data: {
        wishlistId,
        productId: data.productId,
        userId: session.user.id,
        notes: data.notes,
      },
      include: {
        product: {
          include: {
            seller: true,
          },
        },
      },
    });

    // Update product analytics (increment wishlist count)
    await updateProductWishlistCount(data.productId);

    revalidatePath("/dashboard");
    revalidatePath(`/product/${data.productId}`);
    return { success: true, wishlistItem };
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return { success: false, error: "Failed to add to wishlist" };
  }
}

// Remove product from wishlist
export async function removeFromWishlist(data: {
  productId: string;
  wishlistId: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Verify user owns the wishlist
    const wishlist = await db.wishlist.findFirst({
      where: {
        id: data.wishlistId,
        userId: session.user.id,
      },
    });

    if (!wishlist) {
      throw new Error("Wishlist not found or unauthorized");
    }

    await db.wishlistItem.delete({
      where: {
        wishlistId_productId: {
          wishlistId: data.wishlistId,
          productId: data.productId,
        },
      },
    });

    // Update product analytics (decrement wishlist count)
    await updateProductWishlistCount(data.productId, -1);

    revalidatePath("/dashboard");
    revalidatePath(`/product/${data.productId}`);
    return { success: true };
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return { success: false, error: "Failed to remove from wishlist" };
  }
}

// Get user's wishlists
export async function getUserWishlists() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const wishlists = await db.wishlist.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                seller: true,
              },
            },
          },
        },
        analytics: true,
      },
      orderBy: {
        isDefault: "desc",
      },
    });

    return { success: true, wishlists };
  } catch (error) {
    console.error("Error getting wishlists:", error);
    return { success: false, error: "Failed to get wishlists" };
  }
}

// Get wishlist by slug (for sharing)
export async function getWishlistBySlug(slug: string) {
  try {
    const wishlist = await db.wishlist.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            username: true,
            image: true,
          },
        },
        items: {
          where: {
            // Hide purchased items if hideOnPurchase is true
            OR: [{ purchased: false }, { wishlist: { hideOnPurchase: false } }],
          },
          include: {
            product: {
              include: {
                seller: true,
              },
            },
          },
        },
        analytics: true,
      },
    });

    if (!wishlist) {
      return { success: false, error: "Wishlist not found" };
    }

    // Update analytics
    await updateWishlistAnalytics(wishlist.id, "view");

    return { success: true, wishlist };
  } catch (error) {
    console.error("Error getting wishlist:", error);
    return { success: false, error: "Failed to get wishlist" };
  }
}

// Update wishlist settings
export async function updateWishlist(data: {
  wishlistId: string;
  name?: string;
  description?: string;
  privacy?: "PRIVATE" | "PUBLIC" | "SHAREABLE";
  allowPurchases?: boolean;
  hideOnPurchase?: boolean;
  isDefault?: boolean;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Verify user owns the wishlist
    const wishlist = await db.wishlist.findFirst({
      where: {
        id: data.wishlistId,
        userId: session.user.id,
      },
    });

    if (!wishlist) {
      throw new Error("Wishlist not found or unauthorized");
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await db.wishlist.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const updatedWishlist = await db.wishlist.update({
      where: { id: data.wishlistId },
      data: {
        name: data.name,
        description: data.description,
        privacy: data.privacy,
        allowPurchases: data.allowPurchases,
        hideOnPurchase: data.hideOnPurchase,
        isDefault: data.isDefault,
      },
    });

    revalidatePath("/dashboard");
    return { success: true, wishlist: updatedWishlist };
  } catch (error) {
    console.error("Error updating wishlist:", error);
    return { success: false, error: "Failed to update wishlist" };
  }
}

// Delete wishlist
export async function deleteWishlist(wishlistId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Verify user owns the wishlist
    const wishlist = await db.wishlist.findFirst({
      where: {
        id: wishlistId,
        userId: session.user.id,
      },
    });

    if (!wishlist) {
      throw new Error("Wishlist not found or unauthorized");
    }

    await db.wishlist.delete({
      where: { id: wishlistId },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error deleting wishlist:", error);
    return { success: false, error: "Failed to delete wishlist" };
  }
}

// Mark item as purchased (for registry-style wishlists)
export async function markItemAsPurchased(data: {
  wishlistItemId: string;
  purchasedBy?: string; // User ID of purchaser
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const wishlistItem = await db.wishlistItem.findUnique({
      where: { id: data.wishlistItemId },
      include: {
        wishlist: true,
      },
    });

    if (!wishlistItem) {
      throw new Error("Wishlist item not found");
    }

    // Check if wishlist allows purchases
    if (!wishlistItem.wishlist.allowPurchases) {
      throw new Error("This wishlist doesn't allow direct purchases");
    }

    const updatedItem = await db.wishlistItem.update({
      where: { id: data.wishlistItemId },
      data: {
        purchased: true,
        purchasedBy: data.purchasedBy || session.user.id,
        purchasedAt: new Date(),
      },
    });

    revalidatePath("/dashboard");
    return { success: true, wishlistItem: updatedItem };
  } catch (error) {
    console.error("Error marking item as purchased:", error);
    return { success: false, error: "Failed to mark item as purchased" };
  }
}

// Update wishlist analytics
async function updateWishlistAnalytics(
  wishlistId: string,
  action: "view" | "share" | "social_share"
) {
  try {
    const analytics = await db.wishlistAnalytics.findUnique({
      where: { wishlistId },
    });

    if (!analytics) {
      await db.wishlistAnalytics.create({
        data: {
          wishlistId,
          totalViews: action === "view" ? 1 : 0,
          sharesGenerated: action === "share" ? 1 : 0,
        },
      });
      return;
    }

    const updateData: any = {};

    if (action === "view") {
      updateData.totalViews = { increment: 1 };
      updateData.lastViewedAt = new Date();
    } else if (action === "share") {
      updateData.sharesGenerated = { increment: 1 };
    }

    await db.wishlistAnalytics.update({
      where: { wishlistId },
      data: updateData,
    });
  } catch (error) {
    console.error("Error updating wishlist analytics:", error);
  }
}

// Update product wishlist count (for seller analytics)
async function updateProductWishlistCount(
  productId: string,
  increment: number = 1
) {
  try {
    // This would update a field on the Product model
    // You might want to add a wishlistCount field to your Product model
    // For now, we'll just track it in analytics
    console.log(`Product ${productId} wishlist count updated by ${increment}`);
  } catch (error) {
    console.error("Error updating product wishlist count:", error);
  }
}

// Get wishlist analytics for sellers
export async function getWishlistAnalyticsForProduct(productId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Verify user owns the product
    const product = await db.product.findFirst({
      where: {
        id: productId,
        userId: session.user.id,
      },
    });

    if (!product) {
      throw new Error("Product not found or unauthorized");
    }

    const wishlistCount = await db.wishlistItem.count({
      where: {
        productId,
      },
    });

    return { success: true, wishlistCount };
  } catch (error) {
    console.error("Error getting wishlist analytics:", error);
    return { success: false, error: "Failed to get analytics" };
  }
}
