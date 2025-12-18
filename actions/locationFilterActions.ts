"use server";

import { getUserLocationPreferences } from "@/lib/ipinfo";
import { headers } from "next/headers";

/**
 * Get user's country code from IP address for server-side filtering
 * @param ip - Optional IP address (if not provided, will be detected from headers)
 * @returns User's country code or null if detection fails
 */
export async function getUserCountryCode(ip?: string): Promise<string | null> {
  try {
    // If no IP provided, get it from headers
    if (!ip) {
      const headersList = await headers();
      const forwarded = headersList.get('x-forwarded-for');
      const realIP = headersList.get('x-real-ip');
      ip = forwarded?.split(',')[0] || realIP || '';
    }

    if (!ip) {
      return null;
    }

    const locationPreferences = await getUserLocationPreferences(ip);
    return locationPreferences.countryCode;
  } catch (error) {
    // Don't log circuit breaker errors - they're expected when IPinfo is down
    // getUserLocationPreferences already returns default (US) on failure
    if (error instanceof Error && !error.message.includes("circuit breaker")) {
      console.error('Error getting user country code:', error);
    }
    // Return null to use default filtering behavior
    return null;
  }
}

/**
 * Get user's location preferences for client-side use
 * @returns User's location preferences
 */
export async function getUserLocationForFiltering() {
  try {
    const headersList = await headers();
    const forwarded = headersList.get('x-forwarded-for');
    const realIP = headersList.get('x-real-ip');
    const clientIP = forwarded?.split(',')[0] || realIP || '';

    const locationPreferences = await getUserLocationPreferences(clientIP);
    
    return {
      success: true,
      data: locationPreferences
    };
  } catch (error) {
    // Don't log circuit breaker errors - they're expected when IPinfo is down
    if (error instanceof Error && !error.message.includes("circuit breaker")) {
      console.error('Error getting user location for filtering:', error);
    }
    // Return default location preferences on failure
    return {
      success: false,
      error: 'Failed to get location'
    };
  }
} 