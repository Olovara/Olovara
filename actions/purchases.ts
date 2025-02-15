import { db } from "@/lib/db";


export async function getPurchases(userId: string) {
  if (!userId) {
    throw new Error("You must be logged in!");
  }

  return await db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }, // Optional: Sort by created date
  });
}
