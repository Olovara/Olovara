import { db } from "@/lib/db";
import { getAuthUserId } from "./authActions";

export async function getUserInfoForNav() {
  try {
    const userId = await getAuthUserId();
    return db.user.findUnique({
      where: { id: userId },
      select: { username: true, image: true, email: true, role: true, id: true },
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
}
