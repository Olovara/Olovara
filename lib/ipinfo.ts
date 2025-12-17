const ipinfo = require("ipinfo");
import { SUPPORTED_COUNTRIES } from "@/data/countries";
import { SUPPORTED_CURRENCIES, CurrencyCode } from "@/data/units";

// ============ CACHING & CIRCUIT BREAKER ============
// Server-side cache for 1 hour (clears on redeploy)
const ipCache = new Map<string, { data: IPinfoResponse; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Cookie cache duration - 7 days (browser-side, persists across deploys)
export const LOCATION_COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

// Circuit breaker - stop calling IPinfo if it's down
let circuitOpen = false;
let circuitOpenedAt = 0;
const CIRCUIT_RESET_TIME = 60 * 1000; // 1 minute before retrying

// Track if we've logged the circuit open message (avoid spam)
let circuitLoggedThisSession = false;

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
  // Lite API specific fields
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
 * Get IP information from IPinfo API (with caching and circuit breaker)
 * @param ip - IP address to lookup (optional, defaults to client IP)
 * @returns Promise<IPinfoResponse>
 */
export async function getIPInfo(ip?: string): Promise<IPinfoResponse> {
  const cacheKey = ip || "default";

  // 1. Check cache first - return cached data if valid
  const cached = ipCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // 2. Check circuit breaker - if IPinfo is down, fail fast
  if (circuitOpen) {
    if (Date.now() - circuitOpenedAt > CIRCUIT_RESET_TIME) {
      // Try again after reset time
      circuitOpen = false;
      circuitLoggedThisSession = false;
    } else {
      // Circuit is open, fail fast without calling API
      throw new Error(
        "IPinfo circuit breaker open - service temporarily unavailable"
      );
    }
  }

  try {
    // Use the IPinfo Lite API directly for better token handling
    const token = process.env.IPINFO_TOKEN;
    const targetIP = ip || "";
    const url = `https://api.ipinfo.io/lite/${targetIP}${token ? `?token=${token}` : ""}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(
        `IPinfo API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Cache successful response
    ipCache.set(cacheKey, { data, timestamp: Date.now() });

    return data;
  } catch (error) {
    // Open circuit breaker on failure (avoid hammering a down service)
    circuitOpen = true;
    circuitOpenedAt = Date.now();

    // Only log once per circuit open period to avoid log spam
    if (!circuitLoggedThisSession) {
      console.error(
        "IPinfo service unavailable, circuit breaker opened for 1 minute:",
        error
      );
      circuitLoggedThisSession = true;
    }

    throw new Error("Failed to fetch IP information");
  }
}

/**
 * Get user location preferences based on IP geolocation
 * @param ip - IP address to lookup (optional)
 * @returns Promise<UserLocationPreferences>
 */
export async function getUserLocationPreferences(
  ip?: string
): Promise<UserLocationPreferences> {
  try {
    const ipInfo = await getIPInfo(ip);

    // Use the actual country field from the API response
    const countryCode = ipInfo.country_code || ipInfo.country;

    if (!countryCode) {
      // Default to US if no country code found
      return getDefaultLocationPreferences();
    }

    // Find country in our supported countries list
    const country = SUPPORTED_COUNTRIES.find((c) => c.code === countryCode);

    // Use continent from API or determine from country code
    const continent = ipInfo.continent || getContinentFromCountry(countryCode);

    if (country) {
      // Country is in our supported list - use its currency
      // All currencies from supported countries are now in SUPPORTED_CURRENCIES
      return {
        countryCode: country.code,
        countryName: country.name,
        currency: country.currency as CurrencyCode,
        continent: continent,
        isSupported: country.status === "supported",
        canOnboardSellers: country.canOnboardSellers,
      };
    } else {
      // Country not in our supported list, but we still want to show it
      // Try to find a country with the same currency or fallback to USD
      const fallbackCountry = SUPPORTED_COUNTRIES.find(
        (c) => c.currency === "USD" && c.code === "US"
      );

      return {
        countryCode: countryCode,
        countryName: countryCode, // We don't have the name, so use the code
        currency: "USD", // Always fallback to USD for unsupported countries
        continent: continent,
        isSupported: false,
        canOnboardSellers: false,
      };
    }
  } catch (error) {
    console.error("Error getting user location preferences:", error);
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
    US: "North America",
    CA: "North America",
    MX: "North America",
    // Europe
    GB: "Europe",
    DE: "Europe",
    FR: "Europe",
    IT: "Europe",
    ES: "Europe",
    NL: "Europe",
    BE: "Europe",
    AT: "Europe",
    CH: "Europe",
    SE: "Europe",
    NO: "Europe",
    DK: "Europe",
    FI: "Europe",
    PL: "Europe",
    CZ: "Europe",
    HU: "Europe",
    RO: "Europe",
    BG: "Europe",
    HR: "Europe",
    SI: "Europe",
    SK: "Europe",
    LT: "Europe",
    LV: "Europe",
    EE: "Europe",
    IE: "Europe",
    PT: "Europe",
    GR: "Europe",
    CY: "Europe",
    MT: "Europe",
    LU: "Europe",
    // Asia
    JP: "Asia",
    CN: "Asia",
    IN: "Asia",
    SG: "Asia",
    HK: "Asia",
    TH: "Asia",
    MY: "Asia",
    ID: "Asia",
    // Oceania
    AU: "Oceania",
    NZ: "Oceania",
    // South America
    BR: "South America",
    AR: "South America",
    CL: "South America",
    // Africa
    ZA: "Africa",
    NG: "Africa",
    KE: "Africa",
    GH: "Africa",
    CI: "Africa",
    // Middle East
    AE: "Middle East",
    SA: "Middle East",
    IL: "Middle East",
  };

  return continentMap[countryCode] || "Unknown";
}

/**
 * Get default location preferences (fallback)
 * @returns UserLocationPreferences
 */
function getDefaultLocationPreferences(): UserLocationPreferences {
  return {
    countryCode: "US",
    countryName: "United States",
    currency: "USD",
    continent: "North America",
    isSupported: true,
    canOnboardSellers: true,
  };
}

/**
 * Check if an IP address is suspicious for fraud detection
 * @param ip - IP address to check
 * @returns Promise<{isSuspicious: boolean, reasons: string[]}>
 */
export async function checkIPSuspicious(
  ip: string
): Promise<{ isSuspicious: boolean; reasons: string[] }> {
  try {
    const ipInfo = await getIPInfo(ip);
    const reasons: string[] = [];

    // Check for VPN/Proxy indicators in org field
    const org = ipInfo.org?.toLowerCase() || "";
    const asName = ipInfo.as_name?.toLowerCase() || "";

    if (
      org.includes("vpn") ||
      org.includes("proxy") ||
      org.includes("tor") ||
      asName.includes("vpn") ||
      asName.includes("proxy") ||
      asName.includes("tor")
    ) {
      reasons.push("VPN/Proxy detected");
    }

    // Check for data center IPs (common org names)
    const dataCenterKeywords = [
      "amazon",
      "google",
      "microsoft",
      "digitalocean",
      "linode",
      "vultr",
      "ovh",
    ];
    if (
      dataCenterKeywords.some(
        (keyword) => org.includes(keyword) || asName.includes(keyword)
      )
    ) {
      reasons.push("Data center IP detected");
    }

    // Check for anycast IPs (often used by CDNs)
    if (ipInfo.anycast) {
      reasons.push("Anycast IP detected");
    }

    return {
      isSuspicious: reasons.length > 0,
      reasons,
    };
  } catch (error) {
    console.error("Error checking IP suspicious activity:", error);
    return {
      isSuspicious: false,
      reasons: ["Error checking IP"],
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
      countryCode: ipInfo.country_code,
      city: ipInfo.city,
      region: ipInfo.region,
      timezone: ipInfo.timezone,
      org: ipInfo.org,
      asn: ipInfo.asn,
      asName: ipInfo.as_name,
      hostname: ipInfo.hostname,
      locationPreferences: locationPrefs,
      fraudCheck: suspiciousCheck,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error getting user analytics:", error);
    return {
      ip,
      error: "Failed to get analytics data",
      timestamp: new Date().toISOString(),
    };
  }
}
