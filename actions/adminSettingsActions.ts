"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { AdminSettingsSchema, AdminSettingsFormData, defaultAdminSettings } from "@/schemas/AdminSettingsSchema";
import { revalidatePath } from "next/cache";

export async function getAdminSettings() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    // Query admin directly instead of using relationship
    const admin = await db.admin.findUnique({
      where: { userId: session.user.id },
    });

    if (!admin) {
      throw new Error("Admin profile not found");
    }

    // Return admin settings or default settings if none exist
    const settings = admin.notificationPreferences as AdminSettingsFormData | null;
    return settings || defaultAdminSettings;
  } catch (error) {
    console.error("Error fetching admin settings:", error);
    throw error;
  }
}

export async function updateAdminSettings(data: AdminSettingsFormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    // Validate the data
    const validatedData = AdminSettingsSchema.parse(data);

    // Check if admin exists
    const admin = await db.admin.findUnique({
      where: { userId: session.user.id },
    });

    if (!admin) {
      throw new Error("Admin profile not found");
    }

    // Update admin settings
    await db.admin.update({
      where: { userId: session.user.id },
      data: {
        notificationPreferences: validatedData,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/admin/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("Error updating admin settings:", error);
    throw error;
  }
}

export async function resetAdminSettings() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    // Check if admin exists
    const admin = await db.admin.findUnique({
      where: { userId: session.user.id },
    });

    if (!admin) {
      throw new Error("Admin profile not found");
    }

    // Reset to default settings
    await db.admin.update({
      where: { userId: session.user.id },
      data: {
        notificationPreferences: defaultAdminSettings,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/admin/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("Error resetting admin settings:", error);
    throw error;
  }
}

export async function getAdminProfile() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Not authenticated");
    }

    const admin = await db.admin.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            username: true,
            email: true,
            image: true,
            role: true,
          },
        },
      },
    });

    if (!admin) {
      throw new Error("Admin profile not found");
    }

    return admin;
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    throw error;
  }
} 