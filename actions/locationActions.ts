'use server';

import { db } from '@/lib/db';
import { getUserLocationPreferences, getUserAnalytics } from '@/lib/ipinfo';
import { currentUser } from '@/lib/auth';

/**
 * Save user location preferences to database
 */
export async function saveUserLocationPreferences(ip?: string) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get location preferences from IPinfo
    const locationPreferences = await getUserLocationPreferences(ip);
    const analytics = await getUserAnalytics(ip || '');

    // Save to user profile (only currency for now)
    await db.user.update({
      where: { id: user.id },
      data: {
        preferredCurrency: locationPreferences.currency,
        updatedAt: new Date(),
      },
    });

    // Save analytics data (you might want to store this in a separate table)
    console.log('User analytics saved:', analytics);

    return {
      success: true,
      data: locationPreferences,
    };
  } catch (error) {
    console.error('Error saving location preferences:', error);
    return {
      success: false,
      error: 'Failed to save location preferences',
    };
  }
}

/**
 * Get user's saved location preferences
 */
export async function getUserSavedLocationPreferences() {
  try {
    const user = await currentUser();
    if (!user) {
      return null;
    }

    const userData = await db.user.findUnique({
      where: { id: user.id },
      select: {
        preferredCurrency: true,
        updatedAt: true,
      },
    });

    return userData;
  } catch (error) {
    console.error('Error getting user location preferences:', error);
    return null;
  }
}

/**
 * Update user's manual location preferences
 */
export async function updateUserLocationPreferences(currency: string) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        preferredCurrency: currency,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Location preferences updated successfully',
    };
  } catch (error) {
    console.error('Error updating location preferences:', error);
    return {
      success: false,
      error: 'Failed to update location preferences',
    };
  }
}

/**
 * Get location-based product filtering preferences
 */
export async function getLocationBasedPreferences() {
  try {
    const user = await currentUser();
    const userPrefs = await getUserSavedLocationPreferences();
    
    if (!userPrefs) {
      // Return default preferences if no user data
      return {
        currency: 'USD',
        showLocalProducts: true,
        showInternationalProducts: true,
      };
    }

    return {
      currency: userPrefs.preferredCurrency || 'USD',
      showLocalProducts: true,
      showInternationalProducts: true,
    };
  } catch (error) {
    console.error('Error getting location-based preferences:', error);
    return {
      currency: 'USD',
      showLocalProducts: true,
      showInternationalProducts: true,
    };
  }
} 