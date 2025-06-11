import { SHIPPING_ZONES } from "@/data/shipping";

export type CountryStatus = 'supported' | 'extended_network' | 'preview';

export interface Country {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  phoneCode: string;
  isEU: boolean;
  status: CountryStatus;
  canOnboardSellers: boolean; // Whether this country can create Express accounts for sellers
  zone: "NORTH_AMERICA" | "EUROPE" | "ASIA" | "OCEANIA" | "SOUTH_AMERICA" | "AFRICA" | "MIDDLE_EAST" | "REST_OF_WORLD";
}

export const SUPPORTED_COUNTRIES: Country[] = [
  {
    code: "AE",
    name: "United Arab Emirates",
    currency: "AED",
    currencySymbol: "د.إ",
    phoneCode: "+971",
    isEU: false,
    status: "supported",
    canOnboardSellers: false,
    zone: "MIDDLE_EAST"
  },
  {
    code: "AT",
    name: "Austria",
    currency: "EUR",
    currencySymbol: "€",
    phoneCode: "+43",
    isEU: true,
    status: "supported",
    canOnboardSellers: true,
    zone: "EUROPE"
  },
  {
    code: "AU",
    name: "Australia",
    currency: "AUD",
    currencySymbol: "A$",
    phoneCode: "+61",
    isEU: false,
    status: "supported",
    canOnboardSellers: true,
    zone: "OCEANIA"
  },
  {
    code: "BE",
    name: "Belgium",
    currency: "EUR",
    currencySymbol: "€",
    phoneCode: "+32",
    isEU: true,
    status: "supported",
    canOnboardSellers: true,
    zone: "EUROPE"
  },
  {
    code: "BG",
    name: "Bulgaria",
    currency: "BGN",
    currencySymbol: "лв",
    phoneCode: "+359",
    isEU: true,
    status: "supported",
    canOnboardSellers: true,
    zone: "EUROPE"
  },
  {
    code: "BR",
    name: "Brazil",
    currency: "BRL",
    currencySymbol: "R$",
    phoneCode: "+55",
    isEU: false,
    status: "supported",
    canOnboardSellers: true,
    zone: "SOUTH_AMERICA"
  },
  {
    code: "CA",
    name: "Canada",
    currency: "CAD",
    currencySymbol: "C$",
    phoneCode: "+1",
    isEU: false,
    status: "supported",
    canOnboardSellers: true,
    zone: "NORTH_AMERICA"
  },
  {
    code: "CH",
    name: "Switzerland",
    currency: "CHF",
    currencySymbol: "Fr",
    phoneCode: "+41",
    isEU: false,
    status: "supported",
    canOnboardSellers: true,
    zone: "EUROPE"
  },
  {
    code: "CI",
    name: "Côte d'Ivoire",
    currency: "XOF",
    currencySymbol: "CFA",
    phoneCode: "+225",
    isEU: false,
    status: "extended_network",
    canOnboardSellers: false,
    zone: "AFRICA"
  },
  {
    code: "CY",
    name: "Cyprus",
    currency: "EUR",
    currencySymbol: "€",
    phoneCode: "+357",
    isEU: true,
    status: "supported",
    canOnboardSellers: true,
    zone: "EUROPE"
  },
  {
    code: "CZ",
    name: "Czech Republic",
    currency: "CZK",
    currencySymbol: "Kč",
    phoneCode: "+420",
    isEU: true,
    status: "supported",
    canOnboardSellers: true,
    zone: "EUROPE"
  },
  {
    code: "DE",
    name: "Germany",
    currency: "EUR",
    currencySymbol: "€",
    phoneCode: "+49",
    isEU: true,
    status: "supported",
    canOnboardSellers: true,
    zone: "EUROPE"
  },
  {
    code: "DK",
    name: "Denmark",
    currency: "DKK",
    currencySymbol: "kr",
    phoneCode: "+45",
    isEU: true,
    status: "supported",
    canOnboardSellers: true,
    zone: "EUROPE"
  },
  {
    code: "EE",
    name: "Estonia",
    currency: "EUR",
    currencySymbol: "€",
    phoneCode: "+372",
    isEU: true,
    status: "supported",
    canOnboardSellers: true,
    zone: "EUROPE"
  },
  {
    code: "ES",
    name: "Spain",
    currency: "EUR",
    currencySymbol: "€",
    phoneCode: "+34",
    isEU: true,
    status: "supported",
    canOnboardSellers: true,
    zone: "EUROPE"
  },
  {
    code: "FI",
    name: "Finland",
    currency: "EUR",
    currencySymbol: "€",
    phoneCode: "+358",
    isEU: true,
    status: "supported",
    canOnboardSellers: true,
    zone: "EUROPE"
  },
  {
    code: "FR",
    name: "France",
    currency: "EUR",
    currencySymbol: "€",
    phoneCode: "+33",
    isEU: true,
    status: "supported",
    canOnboardSellers: true,
    zone: "EUROPE"
  },
  {
    code: "GB",
    name: "United Kingdom",
    currency: "GBP",
    currencySymbol: "£",
    phoneCode: "+44",
    isEU: false,
    status: "supported",
    canOnboardSellers: true,
    zone: "EUROPE"
  },
  {
    code: "GH",
    name: "Ghana",
    currency: "GHS",
    currencySymbol: "GH₵",
    phoneCode: "+233",
    isEU: false,
    status: "extended_network",
    canOnboardSellers: false,
    zone: "AFRICA"
  },
  {
    code: "GI",
    name: "Gibraltar",
    currency: "GIP",
    currencySymbol: "£",
    phoneCode: "+350",
    isEU: false,
    status: "supported",
    canOnboardSellers: false,
    zone: "EUROPE"
  },
  {
    code: "GR",
    name: "Greece",
    currency: "EUR",
    currencySymbol: "€",
    phoneCode: "+30",
    isEU: true,
    status: "supported",
    canOnboardSellers: true,
    zone: "EUROPE"
  },
  {
    code: "HK",
    name: "Hong Kong",
    currency: "HKD",
    currencySymbol: "HK$",
    phoneCode: "+852",
    isEU: false,
    status: "supported",
    canOnboardSellers: true,
    zone: "ASIA"
  },
  {
    code: "HR",
    name: "Croatia",
    currency: "EUR",
    currencySymbol: "€",
    phoneCode: "+385",
    isEU: true,
    status: "supported",
    canOnboardSellers: true,
    zone: "EUROPE"
  },
  {
    code: "HU",
    name: "Hungary",
    currency: "HUF",
    currencySymbol: "Ft",
    phoneCode: "+36",
    isEU: true,
    status: "supported",
    canOnboardSellers: true,
    zone: "EUROPE"
  },
  {
    code: "ID",
    name: "Indonesia",
    currency: "IDR",
    currencySymbol: "Rp",
    phoneCode: "+62",
    isEU: false,
    status: "preview",
    canOnboardSellers: false,
    zone: "ASIA"
  },
  {
    code: "IE",
    name: "Ireland",
    currency: "EUR",
    currencySymbol: "€",
    phoneCode: "+353",
    isEU: true,
    status: "supported",
    canOnboardSellers: true,
    zone: "EUROPE"
  },
  {
    code: "IN",
    name: "India",
    currency: "INR",
    currencySymbol: "₹",
    phoneCode: "+91",
    isEU: false,
    status: "preview",
    canOnboardSellers: false,
    zone: "ASIA"
  },
  {
    code: "IT",
    name: "Italy",
    currency: "EUR",
    currencySymbol: "€",
    phoneCode: "+39",
    isEU: true,
    status: "supported",
    canOnboardSellers: true,
    zone: "EUROPE"
  },
  {
    code: "JP",
    name: "Japan",
    currency: "JPY",
    currencySymbol: "¥",
    phoneCode: "+81",
    isEU: false,
    status: "supported",
    canOnboardSellers: true,
    zone: "ASIA"
  },
  {
    code: "KE",
    name: "Kenya",
    currency: "KES",
    currencySymbol: "KSh",
    phoneCode: "+254",
    isEU: false,
    status: "extended_network",
    canOnboardSellers: false,
    zone: "AFRICA"
  },
  {
    code: "LI",
    name: "Liechtenstein",
    currency: "CHF",
    currencySymbol: "Fr",
    phoneCode: "+423",
    isEU: false,
    status: "supported",
    canOnboardSellers: false,
    zone: "EUROPE"
  },
  {
    code: "LT",
    name: "Lithuania",
    currency: "EUR",
    currencySymbol: "€",
    phoneCode: "+370",
    isEU: true,
    status: "supported",
    canOnboardSellers: true,
    zone: "EUROPE"
  },
  {
    code: "LU",
    name: "Luxembourg",
    currency: "EUR",
    currencySymbol: "€",
    phoneCode: "+352",
    isEU: true,
    status: "supported",
    canOnboardSellers: true,
    zone: "EUROPE"
  },
  {
    code: "LV",
    name: "Latvia",
    currency: "EUR",
    currencySymbol: "€",
    phoneCode: "+371",
    isEU: true,
    status: "supported",
    canOnboardSellers: true,
    zone: "EUROPE"
  },
  {
    code: "MT",
    name: "Malta",
    currency: "EUR",
    currencySymbol: "€",
    phoneCode: "+356",
    isEU: true,
    status: "supported",
    canOnboardSellers: true,
    zone: "EUROPE"
  },
  {
    code: "MX",
    name: "Mexico",
    currency: "MXN",
    currencySymbol: "Mex$",
    phoneCode: "+52",
    isEU: false,
    status: "supported",
    canOnboardSellers: true,
    zone: "NORTH_AMERICA"
  },
  {
    code: "MY",
    name: "Malaysia",
    currency: "MYR",
    currencySymbol: "RM",
    phoneCode: "+60",
    isEU: false,
    status: "supported",
    canOnboardSellers: false,
    zone: "ASIA"
  },
  {
    code: "NG",
    name: "Nigeria",
    currency: "NGN",
    currencySymbol: "₦",
    phoneCode: "+234",
    isEU: false,
    status: "extended_network",
    canOnboardSellers: false,
    zone: "AFRICA"
  },
  {
    code: "NL",
    name: "Netherlands",
    currency: "EUR",
    currencySymbol: "€",
    phoneCode: "+31",
    isEU: true,
    status: "supported",
    canOnboardSellers: true,
    zone: "EUROPE"
  },
  {
    code: "NO",
    name: "Norway",
    currency: "NOK",
    currencySymbol: "kr",
    phoneCode: "+47",
    isEU: false,
    status: "supported",
    canOnboardSellers: true,
    zone: "EUROPE"
  },
  {
    code: "NZ",
    name: "New Zealand",
    currency: "NZD",
    currencySymbol: "NZ$",
    phoneCode: "+64",
    isEU: false,
    status: "supported",
    canOnboardSellers: true,
    zone: "OCEANIA"
  },
  {
    code: "PL",
    name: "Poland",
    currency: "PLN",
    currencySymbol: "zł",
    phoneCode: "+48",
    isEU: true,
    status: "supported",
    canOnboardSellers: true,
    zone: "EUROPE"
  },
  {
    code: "PT",
    name: "Portugal",
    currency: "EUR",
    currencySymbol: "€",
    phoneCode: "+351",
    isEU: true,
    status: "supported",
    canOnboardSellers: true,
    zone: "EUROPE"
  },
  {
    code: "RO",
    name: "Romania",
    currency: "RON",
    currencySymbol: "lei",
    phoneCode: "+40",
    isEU: true,
    status: "supported",
    canOnboardSellers: true,
    zone: "EUROPE"
  },
  {
    code: "SE",
    name: "Sweden",
    currency: "SEK",
    currencySymbol: "kr",
    phoneCode: "+46",
    isEU: true,
    status: "supported",
    canOnboardSellers: true,
    zone: "EUROPE"
  },
  {
    code: "SG",
    name: "Singapore",
    currency: "SGD",
    currencySymbol: "S$",
    phoneCode: "+65",
    isEU: false,
    status: "supported",
    canOnboardSellers: true,
    zone: "ASIA"
  },
  {
    code: "SI",
    name: "Slovenia",
    currency: "EUR",
    currencySymbol: "€",
    phoneCode: "+386",
    isEU: true,
    status: "supported",
    canOnboardSellers: true,
    zone: "EUROPE"
  },
  {
    code: "SK",
    name: "Slovakia",
    currency: "EUR",
    currencySymbol: "€",
    phoneCode: "+421",
    isEU: true,
    status: "supported",
    canOnboardSellers: true,
    zone: "EUROPE"
  },
  {
    code: "TH",
    name: "Thailand",
    currency: "THB",
    currencySymbol: "฿",
    phoneCode: "+66",
    isEU: false,
    status: "supported",
    canOnboardSellers: true,
    zone: "ASIA"
  },
  {
    code: "US",
    name: "United States",
    currency: "USD",
    currencySymbol: "$",
    phoneCode: "+1",
    isEU: false,
    status: "supported",
    canOnboardSellers: true,
    zone: "NORTH_AMERICA"
  },
  {
    code: "ZA",
    name: "South Africa",
    currency: "ZAR",
    currencySymbol: "R",
    phoneCode: "+27",
    isEU: false,
    status: "extended_network",
    canOnboardSellers: false,
    zone: "AFRICA"
  },
];

// Helper function to get country by code
export const getCountryByCode = (code: string): Country | undefined => {
  return SUPPORTED_COUNTRIES.find(country => country.code === code);
};

// Helper function to get country by name
export const getCountryByName = (name: string): Country | undefined => {
  return SUPPORTED_COUNTRIES.find(country => country.name === name);
};

// Helper function to get EU countries
export const getEUCountries = (): Country[] => {
  return SUPPORTED_COUNTRIES.filter(country => country.isEU);
};

// Helper function to get non-EU countries
export const getNonEUCountries = (): Country[] => {
  return SUPPORTED_COUNTRIES.filter(country => !country.isEU);
};

// Helper function to get countries by status
export const getCountriesByStatus = (status: CountryStatus): Country[] => {
  return SUPPORTED_COUNTRIES.filter(country => country.status === status);
};

// Helper function to get fully supported countries (excluding extended network and preview)
export const getFullySupportedCountries = (): Country[] => {
  return SUPPORTED_COUNTRIES.filter(country => country.status === "supported");
};

// Helper function to get countries that can onboard sellers
export const getOnboardingCountries = (): Country[] => {
  return SUPPORTED_COUNTRIES.filter(country => country.canOnboardSellers);
};

// Helper function to get countries grouped by zone
export const getCountriesByZone = () => {
  const groupedCountries = SUPPORTED_COUNTRIES.reduce((acc, country) => {
    if (!acc[country.zone]) {
      acc[country.zone] = [];
    }
    acc[country.zone].push(country);
    return acc;
  }, {} as Record<string, Country[]>);

  return Object.entries(groupedCountries).map(([zone, countries]) => ({
    zone,
    name: SHIPPING_ZONES.find((z: { id: string; name: string }) => z.id === zone)?.name || zone,
    countries: countries.sort((a, b) => a.name.localeCompare(b.name))
  }));
};

// Helper function to get countries grouped by zone for onboarding
export const getOnboardingCountriesByZone = () => {
  const groupedCountries = SUPPORTED_COUNTRIES.filter(country => country.canOnboardSellers)
    .reduce((acc, country) => {
      if (!acc[country.zone]) {
        acc[country.zone] = [];
      }
      acc[country.zone].push(country);
      return acc;
    }, {} as Record<string, Country[]>);

  return Object.entries(groupedCountries).map(([zone, countries]) => ({
    zone,
    name: SHIPPING_ZONES.find((z: { id: string; name: string }) => z.id === zone)?.name || zone,
    countries: countries.sort((a, b) => a.name.localeCompare(b.name))
  }));
}; 