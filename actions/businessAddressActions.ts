"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { Permission } from "@/data/roles-and-permissions";
import { encryptAddress, decryptAddress } from "@/lib/encryption";
import { revalidatePath } from "next/cache";

// Schema for business address with GDPR compliance validation
const BusinessAddressSchema = z.object({
  street: z.string().min(1, "Street address is required").max(255, "Street address too long"),
  street2: z.string().max(255, "Street address 2 too long").optional(),
  city: z.string().min(1, "City is required").max(100, "City name too long"),
  state: z.string().max(100, "State name too long").optional(),
  country: z.string().min(2, "Country is required").max(3, "Invalid country code"),
  postalCode: z.string().min(1, "Postal code is required").max(20, "Postal code too long"),
});

// GDPR compliance: Data retention policy (7 years for business addresses)
const BUSINESS_ADDRESS_RETENTION_DAYS = 7 * 365;

// GDPR compliance: Audit log for data access
interface AuditLogEntry {
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  userId: string;
  dataType: 'BUSINESS_ADDRESS';
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

// GDPR compliance: Create audit log entry
async function createAuditLog(entry: Omit<AuditLogEntry, 'timestamp'>) {
  try {
    // In a production environment, you'd want to store this in a separate audit table
    // For now, we'll log to console and could extend to a proper audit system
    console.log('AUDIT_LOG:', {
      ...entry,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

// GDPR compliance: Check if data should be retained
function shouldRetainData(createdAt: Date): boolean {
  const retentionDate = new Date(createdAt);
  retentionDate.setDate(retentionDate.getDate() + BUSINESS_ADDRESS_RETENTION_DAYS);
  return new Date() < retentionDate;
}

// GDPR compliance: Anonymize data for right to be forgotten
function anonymizeAddressData() {
  return {
    street: '[REDACTED]',
    street2: null,
    city: '[REDACTED]',
    state: null,
    country: '[REDACTED]',
    postalCode: '[REDACTED]',
  };
}

export const createOrUpdateBusinessAddress = async (
  values: z.infer<typeof BusinessAddressSchema>,
  requestInfo?: { ipAddress?: string; userAgent?: string }
) => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  const canManageSettings = await hasPermission(session.user.id, "MANAGE_SELLER_SETTINGS" as Permission);
  if (!canManageSettings) {
    return { error: "You don't have permission to perform this action." };
  }

  const validatedFields = BusinessAddressSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields." };
  }

  const { street, street2, city, state, country, postalCode } = validatedFields.data;

  try {
    // Check if seller exists
    const seller = await db.seller.findUnique({
      where: { userId: session.user.id },
      include: {
        addresses: {
          where: { isBusinessAddress: true },
          take: 1,
        },
      },
    });

    if (!seller) {
      return { error: "Seller not found." };
    }

    // Encrypt the address data using the proper encryption utility
    const encryptedAddressData = encryptAddress({
      street: street as string,
      street2: street2 as string | undefined,
      city: city as string,
      state: state as string | undefined,
      postalCode: postalCode as string,
      country: country as string,
    });

    // Check if business address already exists
    const existingBusinessAddress = seller.addresses.find(addr => addr.isBusinessAddress);

    if (existingBusinessAddress) {
      // GDPR compliance: Check if data should still be retained
      if (!shouldRetainData(existingBusinessAddress.createdAt)) {
        // Data retention period expired, treat as new creation
        await db.address.delete({
          where: { id: existingBusinessAddress.id },
        });
        
        // Create new business address
        await db.address.create({
          data: {
            ...encryptedAddressData,
            isBusinessAddress: true,
            sellerId: session.user.id,
          },
        });

        // Audit log for data retention cleanup and recreation
        await createAuditLog({
          action: 'DELETE',
          userId: session.user.id,
          dataType: 'BUSINESS_ADDRESS',
          ipAddress: requestInfo?.ipAddress,
          userAgent: requestInfo?.userAgent,
        });

        await createAuditLog({
          action: 'CREATE',
          userId: session.user.id,
          dataType: 'BUSINESS_ADDRESS',
          ipAddress: requestInfo?.ipAddress,
          userAgent: requestInfo?.userAgent,
        });
      } else {
        // Update existing business address
        await db.address.update({
          where: { id: existingBusinessAddress.id },
          data: encryptedAddressData,
        });

        // Audit log for update
        await createAuditLog({
          action: 'UPDATE',
          userId: session.user.id,
          dataType: 'BUSINESS_ADDRESS',
          ipAddress: requestInfo?.ipAddress,
          userAgent: requestInfo?.userAgent,
        });
      }
    } else {
      // Create new business address
      await db.address.create({
        data: {
          ...encryptedAddressData,
          isBusinessAddress: true,
          sellerId: session.user.id,
        },
      });

      // Audit log for creation
      await createAuditLog({
        action: 'CREATE',
        userId: session.user.id,
        dataType: 'BUSINESS_ADDRESS',
        ipAddress: requestInfo?.ipAddress,
        userAgent: requestInfo?.userAgent,
      });
    }

    // Revalidate the settings page
    revalidatePath('/seller/dashboard/settings');

    return { success: "Business address updated successfully!" };
  } catch (error) {
    console.error("Error updating business address:", error);
    return { error: "Failed to update business address." };
  }
};

export const getBusinessAddress = async (requestInfo?: { ipAddress?: string; userAgent?: string }) => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  try {
    const businessAddress = await db.address.findFirst({
      where: {
        sellerId: session.user.id,
        isBusinessAddress: true,
      },
    });

    if (!businessAddress) {
      return { data: null };
    }

    // GDPR compliance: Check if data should still be retained
    if (!shouldRetainData(businessAddress.createdAt)) {
      // Data retention period expired, return null
      return { data: null };
    }

    // Decrypt the address data
    const decryptedAddress = decryptAddress({
      encryptedStreet: businessAddress.encryptedStreet,
      streetIV: businessAddress.streetIV,
      streetSalt: businessAddress.streetSalt,
      encryptedStreet2: businessAddress.encryptedStreet2 || undefined,
      street2IV: businessAddress.street2IV || undefined,
      street2Salt: businessAddress.street2Salt || undefined,
      encryptedCity: businessAddress.encryptedCity,
      cityIV: businessAddress.cityIV,
      citySalt: businessAddress.citySalt,
      encryptedState: businessAddress.encryptedState || undefined,
      stateIV: businessAddress.stateIV || undefined,
      stateSalt: businessAddress.stateSalt || undefined,
      encryptedPostal: businessAddress.encryptedPostal,
      postalIV: businessAddress.postalIV,
      postalSalt: businessAddress.postalSalt,
      encryptedCountry: businessAddress.encryptedCountry,
      countryIV: businessAddress.countryIV,
      countrySalt: businessAddress.countrySalt,
    });

    // Audit log for data access
    await createAuditLog({
      action: 'READ',
      userId: session.user.id,
      dataType: 'BUSINESS_ADDRESS',
      ipAddress: requestInfo?.ipAddress,
      userAgent: requestInfo?.userAgent,
    });

    return { 
      data: {
        id: businessAddress.id,
        isBusinessAddress: businessAddress.isBusinessAddress,
        hasAddress: true,
        address: decryptedAddress,
        createdAt: businessAddress.createdAt,
        updatedAt: businessAddress.updatedAt,
      }
    };
  } catch (error) {
    console.error("Error fetching business address:", error);
    return { error: "Failed to fetch business address." };
  }
};

// GDPR compliance: Right to be forgotten
export const deleteBusinessAddress = async (requestInfo?: { ipAddress?: string; userAgent?: string }) => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  const canManageSettings = await hasPermission(session.user.id, "MANAGE_SELLER_SETTINGS" as Permission);
  if (!canManageSettings) {
    return { error: "You don't have permission to perform this action." };
  }

  try {
    const businessAddress = await db.address.findFirst({
      where: {
        sellerId: session.user.id,
        isBusinessAddress: true,
      },
    });

    if (!businessAddress) {
      return { success: "No business address found to delete." };
    }

    // GDPR compliance: Anonymize the data instead of hard deletion
    const anonymizedData = anonymizeAddressData();
    const encryptedAnonymizedData = encryptAddress({
      street: anonymizedData.street,
      street2: anonymizedData.street2 || undefined,
      city: anonymizedData.city,
      state: anonymizedData.state || undefined,
      postalCode: anonymizedData.postalCode,
      country: anonymizedData.country,
    });

    // Update with anonymized data
    await db.address.update({
      where: { id: businessAddress.id },
      data: {
        ...encryptedAnonymizedData,
        // Mark as deleted for internal tracking
        isBusinessAddress: false,
      },
    });

    // Audit log for right to be forgotten
    await createAuditLog({
      action: 'DELETE',
      userId: session.user.id,
      dataType: 'BUSINESS_ADDRESS',
      ipAddress: requestInfo?.ipAddress,
      userAgent: requestInfo?.userAgent,
    });

    // Revalidate the settings page
    revalidatePath('/seller/dashboard/settings');

    return { success: "Business address deleted successfully." };
  } catch (error) {
    console.error("Error deleting business address:", error);
    return { error: "Failed to delete business address." };
  }
};

// GDPR compliance: Export personal data
export const exportBusinessAddressData = async (requestInfo?: { ipAddress?: string; userAgent?: string }) => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated." };
  }

  try {
    const businessAddress = await db.address.findFirst({
      where: {
        sellerId: session.user.id,
        isBusinessAddress: true,
      },
    });

    if (!businessAddress) {
      return { data: null };
    }

    // GDPR compliance: Check if data should still be retained
    if (!shouldRetainData(businessAddress.createdAt)) {
      return { data: null };
    }

    // Decrypt the address data
    const decryptedAddress = decryptAddress({
      encryptedStreet: businessAddress.encryptedStreet,
      streetIV: businessAddress.streetIV,
      streetSalt: businessAddress.streetSalt,
      encryptedStreet2: businessAddress.encryptedStreet2 || undefined,
      street2IV: businessAddress.street2IV || undefined,
      street2Salt: businessAddress.street2Salt || undefined,
      encryptedCity: businessAddress.encryptedCity,
      cityIV: businessAddress.cityIV,
      citySalt: businessAddress.citySalt,
      encryptedState: businessAddress.encryptedState || undefined,
      stateIV: businessAddress.stateIV || undefined,
      stateSalt: businessAddress.stateSalt || undefined,
      encryptedPostal: businessAddress.encryptedPostal,
      postalIV: businessAddress.postalIV,
      postalSalt: businessAddress.postalSalt,
      encryptedCountry: businessAddress.encryptedCountry,
      countryIV: businessAddress.countryIV,
      countrySalt: businessAddress.countrySalt,
    });

    // Audit log for data export
    await createAuditLog({
      action: 'READ',
      userId: session.user.id,
      dataType: 'BUSINESS_ADDRESS',
      ipAddress: requestInfo?.ipAddress,
      userAgent: requestInfo?.userAgent,
    });

    return {
      data: {
        businessAddress: decryptedAddress,
        metadata: {
          createdAt: businessAddress.createdAt,
          updatedAt: businessAddress.updatedAt,
          dataRetentionPolicy: `${BUSINESS_ADDRESS_RETENTION_DAYS} days`,
          exportDate: new Date().toISOString(),
        }
      }
    };
  } catch (error) {
    console.error("Error exporting business address data:", error);
    return { error: "Failed to export business address data." };
  }
};
