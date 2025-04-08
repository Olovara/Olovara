import { db } from "@/lib/db";

export async function getSellerProducts(
  userId: string,
  status?: string,
  search?: string,
  pageSize: number = 10,
  pageNumber: number = 1
) {
  try {
    // Build the where clause
    const where: any = {
      userId: userId,
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
