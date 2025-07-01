const ipinfo = require('ipinfo');
import { SUPPORTED_COUNTRIES } from '@/data/countries';
import { SUPPORTED_CURRENCIES, CurrencyCode } from '@/data/units';

// Type for IPinfo response (actual API structure)
export interface IPinfoResponse {
  ip: string;
  hostname?: string;
  city?: string;
  region?: string;
  country?: string;
  loc?: string;
  org?: string;
  postal?: string;
  timezone?: string;
  readme?: string;
  anycast?: boolean;
  // Legacy field names for compatibility
  asn?: string;
  as_name?: string;
  as_domain?: string;
  country_code?: string;
  continent_code?: string;
  continent?: string;
}

// Type for user location preferences
export interface UserLocationPreferences {
  countryCode: string;
  countryName: string;
  currency: CurrencyCode;
  continent: string;
  isSupported: boolean;
  canOnboardSellers: boolean;
}

/**
 * Get IP information from IPinfo API
 * @param ip - IP address to lookup (optional, defaults to client IP)
 * @returns Promise<IPinfoResponse>
 */
export async function getIPInfo(ip?: string): Promise<IPinfoResponse> {
  try {
    // IPinfo exports a function that takes a callback
    return new Promise((resolve, reject) => {
      ipinfo(ip || '', (err: any, response: IPinfoResponse) => {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      }, process.env.IPINFO_TOKEN);
    });
  } catch (error) {
    console.error('Error fetching IP info:', error);
    throw new Error('Failed to fetch IP information');
  }
}

/**
 * Get user location preferences based on IP geolocation
 * @param ip - IP address to lookup (optional)
 * @returns Promise<UserLocationPreferences>
 */
export async function getUserLocationPreferences(ip?: string): Promise<UserLocationPreferences> {
  try {
    const ipInfo = await getIPInfo(ip);
    
    // Use the actual country field from the API response
    const countryCode = ipInfo.country;
    
    if (!countryCode) {
      // Default to US if no country code found
      return getDefaultLocationPreferences();
    }

    // Find country in our supported countries list
    const country = SUPPORTED_COUNTRIES.find(
      c => c.code === countryCode
    );

    if (!country) {
      // If country not supported, return default preferences
      return getDefaultLocationPreferences();
    }

    // Check if the country's currency is supported in our system
    const isCurrencySupported = SUPPORTED_CURRENCIES.some(
      c => c.code === country.currency
    );

    // Determine continent based on country code
    const continent = getContinentFromCountry(countryCode);

    return {
      countryCode: country.code,
      countryName: country.name,
      currency: isCurrencySupported ? (country.currency as CurrencyCode) : 'USD',
      continent: continent,
      isSupported: country.status === 'supported',
      canOnboardSellers: country.canOnboardSellers,
    };
  } catch (error) {
    console.error('Error getting user location preferences:', error);
    return getDefaultLocationPreferences();
  }
}

/**
 * Get continent from country code
 * @param countryCode - Two letter country code
 * @returns string - Continent name
 */
function getContinentFromCountry(countryCode: string): string {
  const continentMap: Record<string, string> = {
    // North America
    'US': 'North America', 'CA': 'North America', 'MX': 'North America',
    // Europe
    'GB': 'Europe', 'DE': 'Europe', 'FR': 'Europe', 'IT': 'Europe', 'ES': 'Europe',
    'NL': 'Europe', 'BE': 'Europe', 'AT': 'Europe', 'CH': 'Europe', 'SE': 'Europe',
    'NO': 'Europe', 'DK': 'Europe', 'FI': 'Europe', 'PL': 'Europe', 'CZ': 'Europe',
    'HU': 'Europe', 'RO': 'Europe', 'BG': 'Europe', 'HR': 'Europe', 'SI': 'Europe',
    'SK': 'Europe', 'LT': 'Europe', 'LV': 'Europe', 'EE': 'Europe', 'IE': 'Europe',
    'PT': 'Europe', 'GR': 'Europe', 'CY': 'Europe', 'MT': 'Europe', 'LU': 'Europe',
    // Asia
    'JP': 'Asia', 'CN': 'Asia', 'IN': 'Asia', 'SG': 'Asia', 'HK': 'Asia',
    'TH': 'Asia', 'MY': 'Asia', 'ID': 'Asia',
    // Oceania
    'AU': 'Oceania', 'NZ': 'Oceania',
    // South America
    'BR': 'South America', 'AR': 'South America', 'CL': 'South America',
    // Africa
    'ZA': 'Africa', 'NG': 'Africa', 'KE': 'Africa', 'GH': 'Africa', 'CI': 'Africa',
    // Middle East
    'AE': 'Middle East', 'SA': 'Middle East', 'IL': 'Middle East',
  };
  
  return continentMap[countryCode] || 'Unknown';
}

/**
 * Get default location preferences (fallback)
 * @returns UserLocationPreferences
 */
function getDefaultLocationPreferences(): UserLocationPreferences {
  return {
    countryCode: 'US',
    countryName: 'United States',
    currency: 'USD',
    continent: 'North America',
    isSupported: true,
    canOnboardSellers: true,
  };
}

/**
 * Check if an IP address is suspicious for fraud detection
 * @param ip - IP address to check
 * @returns Promise<{isSuspicious: boolean, reasons: string[]}>
 */
export async function checkIPSuspicious(ip: string): Promise<{isSuspicious: boolean, reasons: string[]}> {
  try {
    const ipInfo = await getIPInfo(ip);
    const reasons: string[] = [];

    // Check for VPN/Proxy indicators in org field
    const org = ipInfo.org?.toLowerCase() || '';
    if (org.includes('vpn') || org.includes('proxy') || org.includes('tor')) {
      reasons.push('VPN/Proxy detected');
    }

    // Check for data center IPs (common org names)
    const dataCenterKeywords = ['amazon', 'google', 'microsoft', 'digitalocean', 'linode', 'vultr', 'ovh'];
    if (dataCenterKeywords.some(keyword => org.includes(keyword))) {
      reasons.push('Data center IP detected');
    }

    // Check for anycast IPs (often used by CDNs)
    if (ipInfo.anycast) {
      reasons.push('Anycast IP detected');
    }

    return {
      isSuspicious: reasons.length > 0,
      reasons
    };
  } catch (error) {
    console.error('Error checking IP suspicious activity:', error);
    return {
      isSuspicious: false,
      reasons: ['Error checking IP']
    };
  }
}

/**
 * Get analytics data for a user session
 * @param ip - IP address
 * @returns Promise<object>
 */
export async function getUserAnalytics(ip: string): Promise<object> {
  try {
    const ipInfo = await getIPInfo(ip);
    const locationPrefs = await getUserLocationPreferences(ip);
    const suspiciousCheck = await checkIPSuspicious(ip);

    return {
      ip: ipInfo.ip,
      country: ipInfo.country,
      city: ipInfo.city,
      region: ipInfo.region,
      timezone: ipInfo.timezone,
      org: ipInfo.org,
      hostname: ipInfo.hostname,
      locationPreferences: locationPrefs,
      fraudCheck: suspiciousCheck,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting user analytics:', error);
    return {
      ip,
      error: 'Failed to get analytics data',
      timestamp: new Date().toISOString(),
    };
  }
} 