/**
 * Search Analytics Utilities
 * Helper functions for tracking search queries and normalizing data
 */

/**
 * Truncate IP address to /24 subnet for privacy
 * Example: 192.168.1.123 -> 192.168.1.0
 * @param ip - IP address to truncate
 * @returns Truncated IP address or original if invalid
 */
export function truncateIPToSubnet(ip: string | null | undefined): string | null {
  if (!ip || ip === 'unknown') return null;
  
  // Handle IPv4 addresses
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      // Truncate to /24 (first 3 octets)
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
  }
  
  // Handle IPv6 addresses (truncate to /64)
  if (ip.includes(':')) {
    const parts = ip.split(':');
    if (parts.length >= 4) {
      // Keep first 4 groups, zero out the rest
      return `${parts.slice(0, 4).join(':')}::`;
    }
  }
  
  // Return original if we can't parse it
  return ip;
}

/**
 * Normalize search query: lowercase, trimmed, punctuation removed
 * This helps group similar searches like "beanie", "Beanie ", "beanies"
 * @param query - Raw search query
 * @returns Normalized query string
 */
export function normalizeSearchQuery(query: string): string {
  if (!query) return '';
  
  return query
    .toLowerCase()
    .trim()
    // Remove common punctuation but keep spaces
    .replace(/[.,!?;:'"()\[\]{}]/g, '')
    // Normalize whitespace (multiple spaces to single space)
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Determine device type from user agent string
 * @param userAgent - User agent string
 * @returns "desktop", "mobile", or "tablet"
 */
export function getDeviceType(userAgent: string | null | undefined): string | null {
  if (!userAgent) return null;
  
  const ua = userAgent.toLowerCase();
  
  // Check for mobile devices
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    // Check if it's a tablet
    if (ua.includes('ipad') || ua.includes('tablet') || (ua.includes('android') && !ua.includes('mobile'))) {
      return 'tablet';
    }
    return 'mobile';
  }
  
  // Default to desktop
  return 'desktop';
}

/**
 * Extract location data (country and region/state only)
 * @param locationData - Full location data object
 * @returns Simplified location object with only country and region
 */
export function extractLocationData(locationData: any): { country?: string; region?: string } | null {
  if (!locationData) return null;
  
  return {
    country: locationData.country || locationData.countryCode || null,
    region: locationData.region || locationData.state || null,
  };
}

