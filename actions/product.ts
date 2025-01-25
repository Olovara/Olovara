import { db } from "@/lib/db";


export async function getSellerProducts(userId: string) {
  if (!userId) {
    throw new Error("Seller ID is required");
  }

  return await db.product.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }, // Optional: Sort by created date
  });
}
