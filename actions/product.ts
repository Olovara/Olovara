"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { Permission } from "@/data/roles-and-permissions";

export async function getSellerProducts(
  status?: string,
  search?: string,
  pageSize: number = 10,
  pageNumber: number = 1
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("User is not authenticated.");
  }

  const canManageProducts = await hasPermission(session.user.id, "MANAGE_PRODUCTS" as Permission);
  if (!canManageProducts) {
    throw new Error("You don't have permission to perform this action.");
  }
  
  try {
    // Build the where clause
    const where: any = {
      userId: session.user.id,
    };

    // Add status filter if provided and not "all"
    if (status && status !== "all") {
      where.status = status.toUpperCase();
    }

    // Add search filter if provided
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive' as const,
      };
    }

    // Calculate skip for pagination
    const skip = (pageNumber - 1) * pageSize;

    // Get total count for pagination
    const totalItems = await db.product.count({ where });

    // Get paginated products
    const products = await db.product.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: pageSize,
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      products,
      totalItems,
      pageSize,
      pageNumber,
      totalPages,
    };
  } catch (error) {
    console.error('Error fetching seller products:', error);
    throw error;
  }
}
