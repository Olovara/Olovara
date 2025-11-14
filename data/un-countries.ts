// UN-recognized countries for shipping exclusions
// Sanctioned countries are automatically excluded and cannot be shipped to

export interface UNCountry {
  code: string;
  name: string;
  isSanctioned: boolean; // Countries under sanctions that cannot be shipped to
  region: "NORTH_AMERICA" | "SOUTH_AMERICA" | "EUROPE" | "ASIA" | "AFRICA" | "OCEANIA" | "MIDDLE_EAST";
}

// Sanctioned countries that cannot be shipped to
const SANCTIONED_COUNTRIES = [
  "RU", // Russia
  "KP", // North Korea
  "IR", // Iran
  "SY", // Syria
  "CU", // Cuba
  "VE", // Venezuela (some restrictions)
  "BY", // Belarus
  "MM", // Myanmar
  "SD", // Sudan
  "SS", // South Sudan
  "SO", // Somalia
  "YE", // Yemen
  "AF", // Afghanistan
  "IQ", // Iraq (some restrictions)
  "LY", // Libya
  "CD", // Democratic Republic of the Congo
  "ZW", // Zimbabwe
  "ER", // Eritrea
  "TD", // Chad
  "ML", // Mali
  "CF", // Central African Republic
  "BI", // Burundi
  "SL", // Sierra Leone
  "LR", // Liberia
  "GW", // Guinea-Bissau
  "GN", // Guinea
  "CI", // Ivory Coast
  "DJ", // Djibouti
  "ET", // Ethiopia
  "KE", // Kenya
  "MG", // Madagascar
  "MW", // Malawi
  "MZ", // Mozambique
  "NA", // Namibia
  "NE", // Niger
  "NG", // Nigeria
  "RW", // Rwanda
  "SN", // Senegal
  "TZ", // Tanzania
  "UG", // Uganda
  "ZM", // Zambia
  "ZW", // Zimbabwe
];

export const UN_COUNTRIES: UNCountry[] = [
  // North America
  { code: "US", name: "United States", isSanctioned: false, region: "NORTH_AMERICA" },
  { code: "CA", name: "Canada", isSanctioned: false, region: "NORTH_AMERICA" },
  { code: "MX", name: "Mexico", isSanctioned: false, region: "NORTH_AMERICA" },
  { code: "GT", name: "Guatemala", isSanctioned: false, region: "NORTH_AMERICA" },
  { code: "BZ", name: "Belize", isSanctioned: false, region: "NORTH_AMERICA" },
  { code: "SV", name: "El Salvador", isSanctioned: false, region: "NORTH_AMERICA" },
  { code: "HN", name: "Honduras", isSanctioned: false, region: "NORTH_AMERICA" },
  { code: "NI", name: "Nicaragua", isSanctioned: false, region: "NORTH_AMERICA" },
  { code: "NIR", name: "Northern Ireland", isSanctioned: false, region: "EUROPE" },
  { code: "CR", name: "Costa Rica", isSanctioned: false, region: "NORTH_AMERICA" },
  { code: "PA", name: "Panama", isSanctioned: false, region: "NORTH_AMERICA" },
  { code: "BS", name: "Bahamas", isSanctioned: false, region: "NORTH_AMERICA" },
  { code: "CU", name: "Cuba", isSanctioned: true, region: "NORTH_AMERICA" },
  { code: "JM", name: "Jamaica", isSanctioned: false, region: "NORTH_AMERICA" },
  { code: "HT", name: "Haiti", isSanctioned: false, region: "NORTH_AMERICA" },
  { code: "DO", name: "Dominican Republic", isSanctioned: false, region: "NORTH_AMERICA" },
  { code: "PR", name: "Puerto Rico", isSanctioned: false, region: "NORTH_AMERICA" },
  { code: "TT", name: "Trinidad and Tobago", isSanctioned: false, region: "NORTH_AMERICA" },
  { code: "BB", name: "Barbados", isSanctioned: false, region: "NORTH_AMERICA" },
  { code: "GD", name: "Grenada", isSanctioned: false, region: "NORTH_AMERICA" },
  { code: "LC", name: "Saint Lucia", isSanctioned: false, region: "NORTH_AMERICA" },
  { code: "VC", name: "Saint Vincent and the Grenadines", isSanctioned: false, region: "NORTH_AMERICA" },
  { code: "AG", name: "Antigua and Barbuda", isSanctioned: false, region: "NORTH_AMERICA" },
  { code: "KN", name: "Saint Kitts and Nevis", isSanctioned: false, region: "NORTH_AMERICA" },
  { code: "DM", name: "Dominica", isSanctioned: false, region: "NORTH_AMERICA" },

  // South America
  { code: "AR", name: "Argentina", isSanctioned: false, region: "SOUTH_AMERICA" },
  { code: "BR", name: "Brazil", isSanctioned: false, region: "SOUTH_AMERICA" },
  { code: "CL", name: "Chile", isSanctioned: false, region: "SOUTH_AMERICA" },
  { code: "CO", name: "Colombia", isSanctioned: false, region: "SOUTH_AMERICA" },
  { code: "EC", name: "Ecuador", isSanctioned: false, region: "SOUTH_AMERICA" },
  { code: "GY", name: "Guyana", isSanctioned: false, region: "SOUTH_AMERICA" },
  { code: "PE", name: "Peru", isSanctioned: false, region: "SOUTH_AMERICA" },
  { code: "PY", name: "Paraguay", isSanctioned: false, region: "SOUTH_AMERICA" },
  { code: "SR", name: "Suriname", isSanctioned: false, region: "SOUTH_AMERICA" },
  { code: "UY", name: "Uruguay", isSanctioned: false, region: "SOUTH_AMERICA" },
  { code: "VE", name: "Venezuela", isSanctioned: true, region: "SOUTH_AMERICA" },
  { code: "BO", name: "Bolivia", isSanctioned: false, region: "SOUTH_AMERICA" },

  // Europe
  { code: "AL", name: "Albania", isSanctioned: false, region: "EUROPE" },
  { code: "AD", name: "Andorra", isSanctioned: false, region: "EUROPE" },
  { code: "AM", name: "Armenia", isSanctioned: false, region: "EUROPE" },
  { code: "AT", name: "Austria", isSanctioned: false, region: "EUROPE" },
  { code: "AZ", name: "Azerbaijan", isSanctioned: false, region: "EUROPE" },
  { code: "BY", name: "Belarus", isSanctioned: true, region: "EUROPE" },
  { code: "BE", name: "Belgium", isSanctioned: false, region: "EUROPE" },
  { code: "BA", name: "Bosnia and Herzegovina", isSanctioned: false, region: "EUROPE" },
  { code: "BG", name: "Bulgaria", isSanctioned: false, region: "EUROPE" },
  { code: "HR", name: "Croatia", isSanctioned: false, region: "EUROPE" },
  { code: "CZ", name: "Czech Republic", isSanctioned: false, region: "EUROPE" },
  { code: "DK", name: "Denmark", isSanctioned: false, region: "EUROPE" },
  { code: "EE", name: "Estonia", isSanctioned: false, region: "EUROPE" },
  { code: "FI", name: "Finland", isSanctioned: false, region: "EUROPE" },
  { code: "FR", name: "France", isSanctioned: false, region: "EUROPE" },
  { code: "GE", name: "Georgia", isSanctioned: false, region: "EUROPE" },
  { code: "DE", name: "Germany", isSanctioned: false, region: "EUROPE" },
  { code: "GI", name: "Gibraltar", isSanctioned: false, region: "EUROPE" },
  { code: "GR", name: "Greece", isSanctioned: false, region: "EUROPE" },
  { code: "HU", name: "Hungary", isSanctioned: false, region: "EUROPE" },
  { code: "IS", name: "Iceland", isSanctioned: false, region: "EUROPE" },
  { code: "IE", name: "Ireland", isSanctioned: false, region: "EUROPE" },
  { code: "IT", name: "Italy", isSanctioned: false, region: "EUROPE" },
  { code: "KZ", name: "Kazakhstan", isSanctioned: false, region: "EUROPE" },
  { code: "XK", name: "Kosovo", isSanctioned: false, region: "EUROPE" },
  { code: "LV", name: "Latvia", isSanctioned: false, region: "EUROPE" },
  { code: "LI", name: "Liechtenstein", isSanctioned: false, region: "EUROPE" },
  { code: "LT", name: "Lithuania", isSanctioned: false, region: "EUROPE" },
  { code: "LU", name: "Luxembourg", isSanctioned: false, region: "EUROPE" },
  { code: "MT", name: "Malta", isSanctioned: false, region: "EUROPE" },
  { code: "MD", name: "Moldova", isSanctioned: false, region: "EUROPE" },
  { code: "MC", name: "Monaco", isSanctioned: false, region: "EUROPE" },
  { code: "ME", name: "Montenegro", isSanctioned: false, region: "EUROPE" },
  { code: "NL", name: "Netherlands", isSanctioned: false, region: "EUROPE" },
  { code: "MK", name: "North Macedonia", isSanctioned: false, region: "EUROPE" },
  { code: "NO", name: "Norway", isSanctioned: false, region: "EUROPE" },
  { code: "PL", name: "Poland", isSanctioned: false, region: "EUROPE" },
  { code: "PT", name: "Portugal", isSanctioned: false, region: "EUROPE" },
  { code: "RO", name: "Romania", isSanctioned: false, region: "EUROPE" },
  { code: "RU", name: "Russia", isSanctioned: true, region: "EUROPE" },
  { code: "SM", name: "San Marino", isSanctioned: false, region: "EUROPE" },
  { code: "RS", name: "Serbia", isSanctioned: false, region: "EUROPE" },
  { code: "SK", name: "Slovakia", isSanctioned: false, region: "EUROPE" },
  { code: "SI", name: "Slovenia", isSanctioned: false, region: "EUROPE" },
  { code: "ES", name: "Spain", isSanctioned: false, region: "EUROPE" },
  { code: "SE", name: "Sweden", isSanctioned: false, region: "EUROPE" },
  { code: "CH", name: "Switzerland", isSanctioned: false, region: "EUROPE" },
  { code: "TR", name: "Turkey", isSanctioned: false, region: "EUROPE" },
  { code: "UA", name: "Ukraine", isSanctioned: false, region: "EUROPE" },
  { code: "GB", name: "United Kingdom", isSanctioned: false, region: "EUROPE" },
  { code: "VA", name: "Vatican City", isSanctioned: false, region: "EUROPE" },

  // Asia
  { code: "AF", name: "Afghanistan", isSanctioned: true, region: "ASIA" },
  { code: "BD", name: "Bangladesh", isSanctioned: false, region: "ASIA" },
  { code: "BT", name: "Bhutan", isSanctioned: false, region: "ASIA" },
  { code: "BN", name: "Brunei", isSanctioned: false, region: "ASIA" },
  { code: "KH", name: "Cambodia", isSanctioned: false, region: "ASIA" },
  { code: "CN", name: "China", isSanctioned: false, region: "ASIA" },
  { code: "HK", name: "Hong Kong", isSanctioned: false, region: "ASIA" },
  { code: "IN", name: "India", isSanctioned: false, region: "ASIA" },
  { code: "ID", name: "Indonesia", isSanctioned: false, region: "ASIA" },
  { code: "JP", name: "Japan", isSanctioned: false, region: "ASIA" },
  { code: "KP", name: "North Korea", isSanctioned: true, region: "ASIA" },
  { code: "KR", name: "South Korea", isSanctioned: false, region: "ASIA" },
  { code: "KG", name: "Kyrgyzstan", isSanctioned: false, region: "ASIA" },
  { code: "LA", name: "Laos", isSanctioned: false, region: "ASIA" },
  { code: "MO", name: "Macau", isSanctioned: false, region: "ASIA" },
  { code: "MY", name: "Malaysia", isSanctioned: false, region: "ASIA" },
  { code: "MV", name: "Maldives", isSanctioned: false, region: "ASIA" },
  { code: "MN", name: "Mongolia", isSanctioned: false, region: "ASIA" },
  { code: "MM", name: "Myanmar", isSanctioned: true, region: "ASIA" },
  { code: "NP", name: "Nepal", isSanctioned: false, region: "ASIA" },
  { code: "PK", name: "Pakistan", isSanctioned: false, region: "ASIA" },
  { code: "PH", name: "Philippines", isSanctioned: false, region: "ASIA" },
  { code: "SG", name: "Singapore", isSanctioned: false, region: "ASIA" },
  { code: "LK", name: "Sri Lanka", isSanctioned: false, region: "ASIA" },
  { code: "TW", name: "Taiwan", isSanctioned: false, region: "ASIA" },
  { code: "TJ", name: "Tajikistan", isSanctioned: false, region: "ASIA" },
  { code: "TH", name: "Thailand", isSanctioned: false, region: "ASIA" },
  { code: "TL", name: "Timor-Leste", isSanctioned: false, region: "ASIA" },
  { code: "TM", name: "Turkmenistan", isSanctioned: false, region: "ASIA" },
  { code: "UZ", name: "Uzbekistan", isSanctioned: false, region: "ASIA" },
  { code: "VN", name: "Vietnam", isSanctioned: false, region: "ASIA" },

  // Africa
  { code: "DZ", name: "Algeria", isSanctioned: false, region: "AFRICA" },
  { code: "AO", name: "Angola", isSanctioned: false, region: "AFRICA" },
  { code: "BJ", name: "Benin", isSanctioned: false, region: "AFRICA" },
  { code: "BW", name: "Botswana", isSanctioned: false, region: "AFRICA" },
  { code: "BF", name: "Burkina Faso", isSanctioned: false, region: "AFRICA" },
  { code: "BI", name: "Burundi", isSanctioned: true, region: "AFRICA" },
  { code: "CM", name: "Cameroon", isSanctioned: false, region: "AFRICA" },
  { code: "CV", name: "Cape Verde", isSanctioned: false, region: "AFRICA" },
  { code: "CF", name: "Central African Republic", isSanctioned: true, region: "AFRICA" },
  { code: "TD", name: "Chad", isSanctioned: true, region: "AFRICA" },
  { code: "KM", name: "Comoros", isSanctioned: false, region: "AFRICA" },
  { code: "CG", name: "Republic of the Congo", isSanctioned: false, region: "AFRICA" },
  { code: "CD", name: "Democratic Republic of the Congo", isSanctioned: true, region: "AFRICA" },
  { code: "DJ", name: "Djibouti", isSanctioned: true, region: "AFRICA" },
  { code: "EG", name: "Egypt", isSanctioned: false, region: "AFRICA" },
  { code: "GQ", name: "Equatorial Guinea", isSanctioned: false, region: "AFRICA" },
  { code: "ER", name: "Eritrea", isSanctioned: true, region: "AFRICA" },
  { code: "ET", name: "Ethiopia", isSanctioned: true, region: "AFRICA" },
  { code: "GA", name: "Gabon", isSanctioned: false, region: "AFRICA" },
  { code: "GM", name: "Gambia", isSanctioned: false, region: "AFRICA" },
  { code: "GH", name: "Ghana", isSanctioned: false, region: "AFRICA" },
  { code: "GN", name: "Guinea", isSanctioned: true, region: "AFRICA" },
  { code: "GW", name: "Guinea-Bissau", isSanctioned: true, region: "AFRICA" },
  { code: "CI", name: "Ivory Coast", isSanctioned: true, region: "AFRICA" },
  { code: "KE", name: "Kenya", isSanctioned: true, region: "AFRICA" },
  { code: "LS", name: "Lesotho", isSanctioned: false, region: "AFRICA" },
  { code: "LR", name: "Liberia", isSanctioned: true, region: "AFRICA" },
  { code: "LY", name: "Libya", isSanctioned: true, region: "AFRICA" },
  { code: "MG", name: "Madagascar", isSanctioned: true, region: "AFRICA" },
  { code: "MW", name: "Malawi", isSanctioned: true, region: "AFRICA" },
  { code: "ML", name: "Mali", isSanctioned: true, region: "AFRICA" },
  { code: "MR", name: "Mauritania", isSanctioned: false, region: "AFRICA" },
  { code: "MU", name: "Mauritius", isSanctioned: false, region: "AFRICA" },
  { code: "YT", name: "Mayotte", isSanctioned: false, region: "AFRICA" },
  { code: "MA", name: "Morocco", isSanctioned: false, region: "AFRICA" },
  { code: "MZ", name: "Mozambique", isSanctioned: true, region: "AFRICA" },
  { code: "NA", name: "Namibia", isSanctioned: true, region: "AFRICA" },
  { code: "NE", name: "Niger", isSanctioned: true, region: "AFRICA" },
  { code: "NG", name: "Nigeria", isSanctioned: true, region: "AFRICA" },
  { code: "RW", name: "Rwanda", isSanctioned: true, region: "AFRICA" },
  { code: "ST", name: "Sao Tome and Principe", isSanctioned: false, region: "AFRICA" },
  { code: "SN", name: "Senegal", isSanctioned: true, region: "AFRICA" },
  { code: "SC", name: "Seychelles", isSanctioned: false, region: "AFRICA" },
  { code: "SL", name: "Sierra Leone", isSanctioned: true, region: "AFRICA" },
  { code: "SO", name: "Somalia", isSanctioned: true, region: "AFRICA" },
  { code: "ZA", name: "South Africa", isSanctioned: false, region: "AFRICA" },
  { code: "SS", name: "South Sudan", isSanctioned: true, region: "AFRICA" },
  { code: "SD", name: "Sudan", isSanctioned: true, region: "AFRICA" },
  { code: "SZ", name: "Eswatini", isSanctioned: false, region: "AFRICA" },
  { code: "TZ", name: "Tanzania", isSanctioned: true, region: "AFRICA" },
  { code: "TG", name: "Togo", isSanctioned: false, region: "AFRICA" },
  { code: "TN", name: "Tunisia", isSanctioned: false, region: "AFRICA" },
  { code: "UG", name: "Uganda", isSanctioned: true, region: "AFRICA" },
  { code: "ZM", name: "Zambia", isSanctioned: true, region: "AFRICA" },
  { code: "ZW", name: "Zimbabwe", isSanctioned: true, region: "AFRICA" },

  // Oceania
  { code: "AU", name: "Australia", isSanctioned: false, region: "OCEANIA" },
  { code: "FJ", name: "Fiji", isSanctioned: false, region: "OCEANIA" },
  { code: "KI", name: "Kiribati", isSanctioned: false, region: "OCEANIA" },
  { code: "MH", name: "Marshall Islands", isSanctioned: false, region: "OCEANIA" },
  { code: "FM", name: "Micronesia", isSanctioned: false, region: "OCEANIA" },
  { code: "NR", name: "Nauru", isSanctioned: false, region: "OCEANIA" },
  { code: "NZ", name: "New Zealand", isSanctioned: false, region: "OCEANIA" },
  { code: "PW", name: "Palau", isSanctioned: false, region: "OCEANIA" },
  { code: "PG", name: "Papua New Guinea", isSanctioned: false, region: "OCEANIA" },
  { code: "WS", name: "Samoa", isSanctioned: false, region: "OCEANIA" },
  { code: "SB", name: "Solomon Islands", isSanctioned: false, region: "OCEANIA" },
  { code: "TO", name: "Tonga", isSanctioned: false, region: "OCEANIA" },
  { code: "TV", name: "Tuvalu", isSanctioned: false, region: "OCEANIA" },
  { code: "VU", name: "Vanuatu", isSanctioned: false, region: "OCEANIA" },

  // Middle East
  { code: "AE", name: "United Arab Emirates", isSanctioned: false, region: "MIDDLE_EAST" },
  { code: "BH", name: "Bahrain", isSanctioned: false, region: "MIDDLE_EAST" },
  { code: "CY", name: "Cyprus", isSanctioned: false, region: "MIDDLE_EAST" },
  { code: "IR", name: "Iran", isSanctioned: true, region: "MIDDLE_EAST" },
  { code: "IQ", name: "Iraq", isSanctioned: false, region: "MIDDLE_EAST" },
  { code: "IL", name: "Israel", isSanctioned: false, region: "MIDDLE_EAST" },
  { code: "JO", name: "Jordan", isSanctioned: false, region: "MIDDLE_EAST" },
  { code: "KW", name: "Kuwait", isSanctioned: false, region: "MIDDLE_EAST" },
  { code: "LB", name: "Lebanon", isSanctioned: false, region: "MIDDLE_EAST" },
  { code: "OM", name: "Oman", isSanctioned: false, region: "MIDDLE_EAST" },
  { code: "PS", name: "Palestine", isSanctioned: false, region: "MIDDLE_EAST" },
  { code: "QA", name: "Qatar", isSanctioned: false, region: "MIDDLE_EAST" },
  { code: "SA", name: "Saudi Arabia", isSanctioned: false, region: "MIDDLE_EAST" },
  { code: "SY", name: "Syria", isSanctioned: true, region: "MIDDLE_EAST" },
  { code: "YE", name: "Yemen", isSanctioned: true, region: "MIDDLE_EAST" },
];

// Get all UN countries that are NOT sanctioned (can be shipped to)
export const getShippableCountries = (): UNCountry[] => {
  return UN_COUNTRIES.filter(country => !country.isSanctioned);
};

// Get all sanctioned countries (cannot be shipped to)
export const getSanctionedCountries = (): UNCountry[] => {
  return UN_COUNTRIES.filter(country => country.isSanctioned);
};

// Get country by code
export const getUNCountryByCode = (code: string): UNCountry | undefined => {
  return UN_COUNTRIES.find(country => country.code === code);
};

// Get countries by region
export const getUNCountriesByRegion = (region: UNCountry['region']): UNCountry[] => {
  return UN_COUNTRIES.filter(country => country.region === region);
};

// Get shippable countries by region
export const getShippableCountriesByRegion = (region: UNCountry['region']): UNCountry[] => {
  return UN_COUNTRIES.filter(country => country.region === region && !country.isSanctioned);
};

// Check if a country is sanctioned
export const isCountrySanctioned = (code: string): boolean => {
  const country = getUNCountryByCode(code);
  return country?.isSanctioned || false;
};
