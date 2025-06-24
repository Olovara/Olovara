import { db } from "@/lib/db";
import { getAuthUserId } from "./authActions";
import { Role } from "@/data/roles-and-permissions";

export async function getUserInfoForNav() {
  try {
    const userId = await getAuthUserId();
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { username: true, image: true, email: true, role: true, id: true },
    });
    
    if (!user) {
      return null;
    }
    
    // Cast the role to the correct type
    return {
      ...user,
      role: user.role as Role,
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
}
