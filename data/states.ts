// States and provinces data for countries that can onboard sellers
// This data structure supports future search functionality by country and state

export interface StateProvince {
  code: string;
  name: string;
  type: 'state' | 'province' | 'region' | 'territory' | 'district' | 'prefecture' | 'canton' | 'land' | 'county';
}

export interface CountryStates {
  countryCode: string;
  countryName: string;
  states: StateProvince[];
}

// United States - 50 states + territories
export const US_STATES: StateProvince[] = [
  { code: 'AL', name: 'Alabama', type: 'state' },
  { code: 'AK', name: 'Alaska', type: 'state' },
  { code: 'AZ', name: 'Arizona', type: 'state' },
  { code: 'AR', name: 'Arkansas', type: 'state' },
  { code: 'CA', name: 'California', type: 'state' },
  { code: 'CO', name: 'Colorado', type: 'state' },
  { code: 'CT', name: 'Connecticut', type: 'state' },
  { code: 'DE', name: 'Delaware', type: 'state' },
  { code: 'FL', name: 'Florida', type: 'state' },
  { code: 'GA', name: 'Georgia', type: 'state' },
  { code: 'HI', name: 'Hawaii', type: 'state' },
  { code: 'ID', name: 'Idaho', type: 'state' },
  { code: 'IL', name: 'Illinois', type: 'state' },
  { code: 'IN', name: 'Indiana', type: 'state' },
  { code: 'IA', name: 'Iowa', type: 'state' },
  { code: 'KS', name: 'Kansas', type: 'state' },
  { code: 'KY', name: 'Kentucky', type: 'state' },
  { code: 'LA', name: 'Louisiana', type: 'state' },
  { code: 'ME', name: 'Maine', type: 'state' },
  { code: 'MD', name: 'Maryland', type: 'state' },
  { code: 'MA', name: 'Massachusetts', type: 'state' },
  { code: 'MI', name: 'Michigan', type: 'state' },
  { code: 'MN', name: 'Minnesota', type: 'state' },
  { code: 'MS', name: 'Mississippi', type: 'state' },
  { code: 'MO', name: 'Missouri', type: 'state' },
  { code: 'MT', name: 'Montana', type: 'state' },
  { code: 'NE', name: 'Nebraska', type: 'state' },
  { code: 'NV', name: 'Nevada', type: 'state' },
  { code: 'NH', name: 'New Hampshire', type: 'state' },
  { code: 'NJ', name: 'New Jersey', type: 'state' },
  { code: 'NM', name: 'New Mexico', type: 'state' },
  { code: 'NY', name: 'New York', type: 'state' },
  { code: 'NC', name: 'North Carolina', type: 'state' },
  { code: 'ND', name: 'North Dakota', type: 'state' },
  { code: 'OH', name: 'Ohio', type: 'state' },
  { code: 'OK', name: 'Oklahoma', type: 'state' },
  { code: 'OR', name: 'Oregon', type: 'state' },
  { code: 'PA', name: 'Pennsylvania', type: 'state' },
  { code: 'RI', name: 'Rhode Island', type: 'state' },
  { code: 'SC', name: 'South Carolina', type: 'state' },
  { code: 'SD', name: 'South Dakota', type: 'state' },
  { code: 'TN', name: 'Tennessee', type: 'state' },
  { code: 'TX', name: 'Texas', type: 'state' },
  { code: 'UT', name: 'Utah', type: 'state' },
  { code: 'VT', name: 'Vermont', type: 'state' },
  { code: 'VA', name: 'Virginia', type: 'state' },
  { code: 'WA', name: 'Washington', type: 'state' },
  { code: 'WV', name: 'West Virginia', type: 'state' },
  { code: 'WI', name: 'Wisconsin', type: 'state' },
  { code: 'WY', name: 'Wyoming', type: 'state' },
  { code: 'DC', name: 'District of Columbia', type: 'district' },
  { code: 'AS', name: 'American Samoa', type: 'territory' },
  { code: 'GU', name: 'Guam', type: 'territory' },
  { code: 'MP', name: 'Northern Mariana Islands', type: 'territory' },
  { code: 'PR', name: 'Puerto Rico', type: 'territory' },
  { code: 'VI', name: 'U.S. Virgin Islands', type: 'territory' },
];

// Canada - Provinces and territories
export const CA_PROVINCES: StateProvince[] = [
  { code: 'AB', name: 'Alberta', type: 'province' },
  { code: 'BC', name: 'British Columbia', type: 'province' },
  { code: 'MB', name: 'Manitoba', type: 'province' },
  { code: 'NB', name: 'New Brunswick', type: 'province' },
  { code: 'NL', name: 'Newfoundland and Labrador', type: 'province' },
  { code: 'NS', name: 'Nova Scotia', type: 'province' },
  { code: 'NT', name: 'Northwest Territories', type: 'territory' },
  { code: 'NU', name: 'Nunavut', type: 'territory' },
  { code: 'ON', name: 'Ontario', type: 'province' },
  { code: 'PE', name: 'Prince Edward Island', type: 'province' },
  { code: 'QC', name: 'Quebec', type: 'province' },
  { code: 'SK', name: 'Saskatchewan', type: 'province' },
  { code: 'YT', name: 'Yukon', type: 'territory' },
];

// Australia - States and territories
export const AU_STATES: StateProvince[] = [
  { code: 'ACT', name: 'Australian Capital Territory', type: 'territory' },
  { code: 'NSW', name: 'New South Wales', type: 'state' },
  { code: 'NT', name: 'Northern Territory', type: 'territory' },
  { code: 'QLD', name: 'Queensland', type: 'state' },
  { code: 'SA', name: 'South Australia', type: 'state' },
  { code: 'TAS', name: 'Tasmania', type: 'state' },
  { code: 'VIC', name: 'Victoria', type: 'state' },
  { code: 'WA', name: 'Western Australia', type: 'state' },
];

// Germany - Federal states (Länder)
export const DE_STATES: StateProvince[] = [
  { code: 'BW', name: 'Baden-Württemberg', type: 'land' },
  { code: 'BY', name: 'Bavaria', type: 'land' },
  { code: 'BE', name: 'Berlin', type: 'land' },
  { code: 'BB', name: 'Brandenburg', type: 'land' },
  { code: 'HB', name: 'Bremen', type: 'land' },
  { code: 'HH', name: 'Hamburg', type: 'land' },
  { code: 'HE', name: 'Hesse', type: 'land' },
  { code: 'MV', name: 'Mecklenburg-Vorpommern', type: 'land' },
  { code: 'NI', name: 'Lower Saxony', type: 'land' },
  { code: 'NW', name: 'North Rhine-Westphalia', type: 'land' },
  { code: 'RP', name: 'Rhineland-Palatinate', type: 'land' },
  { code: 'SL', name: 'Saarland', type: 'land' },
  { code: 'SN', name: 'Saxony', type: 'land' },
  { code: 'ST', name: 'Saxony-Anhalt', type: 'land' },
  { code: 'SH', name: 'Schleswig-Holstein', type: 'land' },
  { code: 'TH', name: 'Thuringia', type: 'land' },
];

// France - Regions (simplified, major regions)
export const FR_REGIONS: StateProvince[] = [
  { code: 'ARA', name: 'Auvergne-Rhône-Alpes', type: 'region' },
  { code: 'BFC', name: 'Bourgogne-Franche-Comté', type: 'region' },
  { code: 'BRE', name: 'Bretagne', type: 'region' },
  { code: 'CVL', name: 'Centre-Val de Loire', type: 'region' },
  { code: 'COR', name: 'Corse', type: 'region' },
  { code: 'GES', name: 'Grand Est', type: 'region' },
  { code: 'HDF', name: 'Hauts-de-France', type: 'region' },
  { code: 'IDF', name: 'Île-de-France', type: 'region' },
  { code: 'NOR', name: 'Normandie', type: 'region' },
  { code: 'NAQ', name: 'Nouvelle-Aquitaine', type: 'region' },
  { code: 'OCC', name: 'Occitanie', type: 'region' },
  { code: 'PDL', name: 'Pays de la Loire', type: 'region' },
  { code: 'PAC', name: 'Provence-Alpes-Côte d\'Azur', type: 'region' },
];

// United Kingdom - Countries and regions
export const GB_REGIONS: StateProvince[] = [
  { code: 'ENG', name: 'England', type: 'region' },
  { code: 'SCT', name: 'Scotland', type: 'region' },
  { code: 'WLS', name: 'Wales', type: 'region' },
  { code: 'NIR', name: 'Northern Ireland', type: 'region' },
];

// Italy - Regions
export const IT_REGIONS: StateProvince[] = [
  { code: 'ABR', name: 'Abruzzo', type: 'region' },
  { code: 'BAS', name: 'Basilicata', type: 'region' },
  { code: 'CAL', name: 'Calabria', type: 'region' },
  { code: 'CAM', name: 'Campania', type: 'region' },
  { code: 'EMR', name: 'Emilia-Romagna', type: 'region' },
  { code: 'FVG', name: 'Friuli Venezia Giulia', type: 'region' },
  { code: 'LAZ', name: 'Lazio', type: 'region' },
  { code: 'LIG', name: 'Liguria', type: 'region' },
  { code: 'LOM', name: 'Lombardia', type: 'region' },
  { code: 'MAR', name: 'Marche', type: 'region' },
  { code: 'MOL', name: 'Molise', type: 'region' },
  { code: 'PAB', name: 'Piemonte', type: 'region' },
  { code: 'PUG', name: 'Puglia', type: 'region' },
  { code: 'SAR', name: 'Sardegna', type: 'region' },
  { code: 'SIC', name: 'Sicilia', type: 'region' },
  { code: 'TOS', name: 'Toscana', type: 'region' },
  { code: 'TAA', name: 'Trentino-Alto Adige', type: 'region' },
  { code: 'UMB', name: 'Umbria', type: 'region' },
  { code: 'VDA', name: 'Valle d\'Aosta', type: 'region' },
  { code: 'VEN', name: 'Veneto', type: 'region' },
];

// Spain - Autonomous communities
export const ES_REGIONS: StateProvince[] = [
  { code: 'AND', name: 'Andalucía', type: 'region' },
  { code: 'ARA', name: 'Aragón', type: 'region' },
  { code: 'AST', name: 'Asturias', type: 'region' },
  { code: 'CAN', name: 'Canarias', type: 'region' },
  { code: 'CBR', name: 'Cantabria', type: 'region' },
  { code: 'CLM', name: 'Castilla-La Mancha', type: 'region' },
  { code: 'CLE', name: 'Castilla y León', type: 'region' },
  { code: 'CAT', name: 'Cataluña', type: 'region' },
  { code: 'EXT', name: 'Extremadura', type: 'region' },
  { code: 'GAL', name: 'Galicia', type: 'region' },
  { code: 'MAD', name: 'Madrid', type: 'region' },
  { code: 'MUR', name: 'Murcia', type: 'region' },
  { code: 'NAV', name: 'Navarra', type: 'region' },
  { code: 'PVA', name: 'País Vasco', type: 'region' },
  { code: 'RIO', name: 'La Rioja', type: 'region' },
  { code: 'VAL', name: 'Valencia', type: 'region' },
];

// Japan - Prefectures
export const JP_PREFECTURES: StateProvince[] = [
  { code: '01', name: 'Hokkaido', type: 'prefecture' },
  { code: '02', name: 'Aomori', type: 'prefecture' },
  { code: '03', name: 'Iwate', type: 'prefecture' },
  { code: '04', name: 'Miyagi', type: 'prefecture' },
  { code: '05', name: 'Akita', type: 'prefecture' },
  { code: '06', name: 'Yamagata', type: 'prefecture' },
  { code: '07', name: 'Fukushima', type: 'prefecture' },
  { code: '08', name: 'Ibaraki', type: 'prefecture' },
  { code: '09', name: 'Tochigi', type: 'prefecture' },
  { code: '10', name: 'Gunma', type: 'prefecture' },
  { code: '11', name: 'Saitama', type: 'prefecture' },
  { code: '12', name: 'Chiba', type: 'prefecture' },
  { code: '13', name: 'Tokyo', type: 'prefecture' },
  { code: '14', name: 'Kanagawa', type: 'prefecture' },
  { code: '15', name: 'Niigata', type: 'prefecture' },
  { code: '16', name: 'Toyama', type: 'prefecture' },
  { code: '17', name: 'Ishikawa', type: 'prefecture' },
  { code: '18', name: 'Fukui', type: 'prefecture' },
  { code: '19', name: 'Yamanashi', type: 'prefecture' },
  { code: '20', name: 'Nagano', type: 'prefecture' },
  { code: '21', name: 'Gifu', type: 'prefecture' },
  { code: '22', name: 'Shizuoka', type: 'prefecture' },
  { code: '23', name: 'Aichi', type: 'prefecture' },
  { code: '24', name: 'Mie', type: 'prefecture' },
  { code: '25', name: 'Shiga', type: 'prefecture' },
  { code: '26', name: 'Kyoto', type: 'prefecture' },
  { code: '27', name: 'Osaka', type: 'prefecture' },
  { code: '28', name: 'Hyogo', type: 'prefecture' },
  { code: '29', name: 'Nara', type: 'prefecture' },
  { code: '30', name: 'Wakayama', type: 'prefecture' },
  { code: '31', name: 'Tottori', type: 'prefecture' },
  { code: '32', name: 'Shimane', type: 'prefecture' },
  { code: '33', name: 'Okayama', type: 'prefecture' },
  { code: '34', name: 'Hiroshima', type: 'prefecture' },
  { code: '35', name: 'Yamaguchi', type: 'prefecture' },
  { code: '36', name: 'Tokushima', type: 'prefecture' },
  { code: '37', name: 'Kagawa', type: 'prefecture' },
  { code: '38', name: 'Ehime', type: 'prefecture' },
  { code: '39', name: 'Kochi', type: 'prefecture' },
  { code: '40', name: 'Fukuoka', type: 'prefecture' },
  { code: '41', name: 'Saga', type: 'prefecture' },
  { code: '42', name: 'Nagasaki', type: 'prefecture' },
  { code: '43', name: 'Kumamoto', type: 'prefecture' },
  { code: '44', name: 'Oita', type: 'prefecture' },
  { code: '45', name: 'Miyazaki', type: 'prefecture' },
  { code: '46', name: 'Kagoshima', type: 'prefecture' },
  { code: '47', name: 'Okinawa', type: 'prefecture' },
];

// Brazil - States
export const BR_STATES: StateProvince[] = [
  { code: 'AC', name: 'Acre', type: 'state' },
  { code: 'AL', name: 'Alagoas', type: 'state' },
  { code: 'AP', name: 'Amapá', type: 'state' },
  { code: 'AM', name: 'Amazonas', type: 'state' },
  { code: 'BA', name: 'Bahia', type: 'state' },
  { code: 'CE', name: 'Ceará', type: 'state' },
  { code: 'DF', name: 'Distrito Federal', type: 'district' },
  { code: 'ES', name: 'Espírito Santo', type: 'state' },
  { code: 'GO', name: 'Goiás', type: 'state' },
  { code: 'MA', name: 'Maranhão', type: 'state' },
  { code: 'MT', name: 'Mato Grosso', type: 'state' },
  { code: 'MS', name: 'Mato Grosso do Sul', type: 'state' },
  { code: 'MG', name: 'Minas Gerais', type: 'state' },
  { code: 'PA', name: 'Pará', type: 'state' },
  { code: 'PB', name: 'Paraíba', type: 'state' },
  { code: 'PR', name: 'Paraná', type: 'state' },
  { code: 'PE', name: 'Pernambuco', type: 'state' },
  { code: 'PI', name: 'Piauí', type: 'state' },
  { code: 'RJ', name: 'Rio de Janeiro', type: 'state' },
  { code: 'RN', name: 'Rio Grande do Norte', type: 'state' },
  { code: 'RS', name: 'Rio Grande do Sul', type: 'state' },
  { code: 'RO', name: 'Rondônia', type: 'state' },
  { code: 'RR', name: 'Roraima', type: 'state' },
  { code: 'SC', name: 'Santa Catarina', type: 'state' },
  { code: 'SP', name: 'São Paulo', type: 'state' },
  { code: 'SE', name: 'Sergipe', type: 'state' },
  { code: 'TO', name: 'Tocantins', type: 'state' },
];

// Mexico - States
export const MX_STATES: StateProvince[] = [
  { code: 'AGU', name: 'Aguascalientes', type: 'state' },
  { code: 'BCN', name: 'Baja California', type: 'state' },
  { code: 'BCS', name: 'Baja California Sur', type: 'state' },
  { code: 'CAM', name: 'Campeche', type: 'state' },
  { code: 'CHP', name: 'Chiapas', type: 'state' },
  { code: 'CHH', name: 'Chihuahua', type: 'state' },
  { code: 'COA', name: 'Coahuila', type: 'state' },
  { code: 'COL', name: 'Colima', type: 'state' },
  { code: 'CMX', name: 'Ciudad de México', type: 'district' },
  { code: 'DUR', name: 'Durango', type: 'state' },
  { code: 'GUA', name: 'Guanajuato', type: 'state' },
  { code: 'GRO', name: 'Guerrero', type: 'state' },
  { code: 'HID', name: 'Hidalgo', type: 'state' },
  { code: 'JAL', name: 'Jalisco', type: 'state' },
  { code: 'MEX', name: 'México', type: 'state' },
  { code: 'MIC', name: 'Michoacán', type: 'state' },
  { code: 'MOR', name: 'Morelos', type: 'state' },
  { code: 'NAY', name: 'Nayarit', type: 'state' },
  { code: 'NLE', name: 'Nuevo León', type: 'state' },
  { code: 'OAX', name: 'Oaxaca', type: 'state' },
  { code: 'PUE', name: 'Puebla', type: 'state' },
  { code: 'QUE', name: 'Querétaro', type: 'state' },
  { code: 'ROO', name: 'Quintana Roo', type: 'state' },
  { code: 'SLP', name: 'San Luis Potosí', type: 'state' },
  { code: 'SIN', name: 'Sinaloa', type: 'state' },
  { code: 'SON', name: 'Sonora', type: 'state' },
  { code: 'TAB', name: 'Tabasco', type: 'state' },
  { code: 'TAM', name: 'Tamaulipas', type: 'state' },
  { code: 'TLA', name: 'Tlaxcala', type: 'state' },
  { code: 'VER', name: 'Veracruz', type: 'state' },
  { code: 'YUC', name: 'Yucatán', type: 'state' },
  { code: 'ZAC', name: 'Zacatecas', type: 'state' },
];

// New Zealand - Regions
export const NZ_REGIONS: StateProvince[] = [
  { code: 'AUK', name: 'Auckland', type: 'region' },
  { code: 'BOP', name: 'Bay of Plenty', type: 'region' },
  { code: 'CAN', name: 'Canterbury', type: 'region' },
  { code: 'GIS', name: 'Gisborne', type: 'region' },
  { code: 'HKB', name: 'Hawke\'s Bay', type: 'region' },
  { code: 'MWT', name: 'Manawatu-Wanganui', type: 'region' },
  { code: 'MBH', name: 'Marlborough', type: 'region' },
  { code: 'NSN', name: 'Nelson', type: 'region' },
  { code: 'NTL', name: 'Northland', type: 'region' },
  { code: 'OTA', name: 'Otago', type: 'region' },
  { code: 'STL', name: 'Southland', type: 'region' },
  { code: 'TKI', name: 'Taranaki', type: 'region' },
  { code: 'TAS', name: 'Tasman', type: 'region' },
  { code: 'WKO', name: 'Waikato', type: 'region' },
  { code: 'WGN', name: 'Wellington', type: 'region' },
  { code: 'WTC', name: 'West Coast', type: 'region' },
];

// Thailand - Provinces
export const TH_PROVINCES: StateProvince[] = [
  { code: '10', name: 'Bangkok', type: 'province' },
  { code: '11', name: 'Samut Prakan', type: 'province' },
  { code: '12', name: 'Nonthaburi', type: 'province' },
  { code: '13', name: 'Pathum Thani', type: 'province' },
  { code: '14', name: 'Phra Nakhon Si Ayutthaya', type: 'province' },
  { code: '15', name: 'Ang Thong', type: 'province' },
  { code: '16', name: 'Lop Buri', type: 'province' },
  { code: '17', name: 'Sing Buri', type: 'province' },
  { code: '18', name: 'Chai Nat', type: 'province' },
  { code: '19', name: 'Saraburi', type: 'province' },
  { code: '20', name: 'Chon Buri', type: 'province' },
  { code: '21', name: 'Rayong', type: 'province' },
  { code: '22', name: 'Chanthaburi', type: 'province' },
  { code: '23', name: 'Trat', type: 'province' },
  { code: '24', name: 'Chachoengsao', type: 'province' },
  { code: '25', name: 'Prachin Buri', type: 'province' },
  { code: '26', name: 'Nakhon Nayok', type: 'province' },
  { code: '27', name: 'Sa Kaeo', type: 'province' },
  { code: '30', name: 'Nakhon Ratchasima', type: 'province' },
  { code: '31', name: 'Buri Ram', type: 'province' },
  { code: '32', name: 'Surin', type: 'province' },
  { code: '33', name: 'Si Sa Ket', type: 'province' },
  { code: '34', name: 'Ubon Ratchathani', type: 'province' },
  { code: '35', name: 'Yasothon', type: 'province' },
  { code: '36', name: 'Chaiyaphum', type: 'province' },
  { code: '37', name: 'Amnat Charoen', type: 'province' },
  { code: '39', name: 'Nong Bua Lam Phu', type: 'province' },
  { code: '40', name: 'Khon Kaen', type: 'province' },
  { code: '41', name: 'Udon Thani', type: 'province' },
  { code: '42', name: 'Loei', type: 'province' },
  { code: '43', name: 'Nong Khai', type: 'province' },
  { code: '44', name: 'Maha Sarakham', type: 'province' },
  { code: '45', name: 'Roi Et', type: 'province' },
  { code: '46', name: 'Kalasin', type: 'province' },
  { code: '47', name: 'Sakon Nakhon', type: 'province' },
  { code: '48', name: 'Nakhon Phanom', type: 'province' },
  { code: '49', name: 'Mukdahan', type: 'province' },
  { code: '50', name: 'Chiang Mai', type: 'province' },
  { code: '51', name: 'Lamphun', type: 'province' },
  { code: '52', name: 'Lampang', type: 'province' },
  { code: '53', name: 'Uttaradit', type: 'province' },
  { code: '54', name: 'Phrae', type: 'province' },
  { code: '55', name: 'Nan', type: 'province' },
  { code: '56', name: 'Phayao', type: 'province' },
  { code: '57', name: 'Chiang Rai', type: 'province' },
  { code: '58', name: 'Mae Hong Son', type: 'province' },
  { code: '60', name: 'Nakhon Sawan', type: 'province' },
  { code: '61', name: 'Uthai Thani', type: 'province' },
  { code: '62', name: 'Kamphaeng Phet', type: 'province' },
  { code: '63', name: 'Tak', type: 'province' },
  { code: '64', name: 'Sukhothai', type: 'province' },
  { code: '65', name: 'Phitsanulok', type: 'province' },
  { code: '66', name: 'Phichit', type: 'province' },
  { code: '67', name: 'Phetchabun', type: 'province' },
  { code: '70', name: 'Ratchaburi', type: 'province' },
  { code: '71', name: 'Kanchanaburi', type: 'province' },
  { code: '72', name: 'Suphan Buri', type: 'province' },
  { code: '73', name: 'Nakhon Pathom', type: 'province' },
  { code: '74', name: 'Samut Sakhon', type: 'province' },
  { code: '75', name: 'Samut Songkhram', type: 'province' },
  { code: '76', name: 'Phetchaburi', type: 'province' },
  { code: '77', name: 'Prachuap Khiri Khan', type: 'province' },
  { code: '80', name: 'Nakhon Si Thammarat', type: 'province' },
  { code: '81', name: 'Krabi', type: 'province' },
  { code: '82', name: 'Phang Nga', type: 'province' },
  { code: '83', name: 'Phuket', type: 'province' },
  { code: '84', name: 'Surat Thani', type: 'province' },
  { code: '85', name: 'Ranong', type: 'province' },
  { code: '86', name: 'Chumphon', type: 'province' },
  { code: '90', name: 'Songkhla', type: 'province' },
  { code: '91', name: 'Satun', type: 'province' },
  { code: '92', name: 'Trang', type: 'province' },
  { code: '93', name: 'Phatthalung', type: 'province' },
  { code: '94', name: 'Pattani', type: 'province' },
  { code: '95', name: 'Yala', type: 'province' },
  { code: '96', name: 'Narathiwat', type: 'province' },
];

// Singapore - No states/provinces (city-state)
export const SG_REGIONS: StateProvince[] = [
  { code: 'SG', name: 'Singapore', type: 'region' },
];

// Switzerland - Cantons
export const CH_CANTONS: StateProvince[] = [
  { code: 'AG', name: 'Aargau', type: 'canton' },
  { code: 'AI', name: 'Appenzell Innerrhoden', type: 'canton' },
  { code: 'AR', name: 'Appenzell Ausserrhoden', type: 'canton' },
  { code: 'BE', name: 'Bern', type: 'canton' },
  { code: 'BL', name: 'Basel-Landschaft', type: 'canton' },
  { code: 'BS', name: 'Basel-Stadt', type: 'canton' },
  { code: 'FR', name: 'Fribourg', type: 'canton' },
  { code: 'GE', name: 'Genève', type: 'canton' },
  { code: 'GL', name: 'Glarus', type: 'canton' },
  { code: 'GR', name: 'Graubünden', type: 'canton' },
  { code: 'JU', name: 'Jura', type: 'canton' },
  { code: 'LU', name: 'Luzern', type: 'canton' },
  { code: 'NE', name: 'Neuchâtel', type: 'canton' },
  { code: 'NW', name: 'Nidwalden', type: 'canton' },
  { code: 'OW', name: 'Obwalden', type: 'canton' },
  { code: 'SG', name: 'St. Gallen', type: 'canton' },
  { code: 'SH', name: 'Schaffhausen', type: 'canton' },
  { code: 'SO', name: 'Solothurn', type: 'canton' },
  { code: 'SZ', name: 'Schwyz', type: 'canton' },
  { code: 'TG', name: 'Thurgau', type: 'canton' },
  { code: 'TI', name: 'Ticino', type: 'canton' },
  { code: 'UR', name: 'Uri', type: 'canton' },
  { code: 'VD', name: 'Vaud', type: 'canton' },
  { code: 'VS', name: 'Valais', type: 'canton' },
  { code: 'ZG', name: 'Zug', type: 'canton' },
  { code: 'ZH', name: 'Zürich', type: 'canton' },
];

// Norway - Counties
export const NO_COUNTIES: StateProvince[] = [
  { code: '03', name: 'Oslo', type: 'county' },
  { code: '11', name: 'Rogaland', type: 'county' },
  { code: '15', name: 'Møre og Romsdal', type: 'county' },
  { code: '18', name: 'Nordland', type: 'county' },
  { code: '30', name: 'Viken', type: 'county' },
  { code: '34', name: 'Innlandet', type: 'county' },
  { code: '38', name: 'Vestfold og Telemark', type: 'county' },
  { code: '42', name: 'Agder', type: 'county' },
  { code: '46', name: 'Vestland', type: 'county' },
  { code: '50', name: 'Trøndelag', type: 'county' },
  { code: '54', name: 'Troms og Finnmark', type: 'county' },
];

// All countries with their states/provinces
export const COUNTRY_STATES: Record<string, CountryStates> = {
  US: {
    countryCode: 'US',
    countryName: 'United States',
    states: US_STATES
  },
  CA: {
    countryCode: 'CA',
    countryName: 'Canada',
    states: CA_PROVINCES
  },
  AU: {
    countryCode: 'AU',
    countryName: 'Australia',
    states: AU_STATES
  },
  DE: {
    countryCode: 'DE',
    countryName: 'Germany',
    states: DE_STATES
  },
  FR: {
    countryCode: 'FR',
    countryName: 'France',
    states: FR_REGIONS
  },
  GB: {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    states: GB_REGIONS
  },
  IT: {
    countryCode: 'IT',
    countryName: 'Italy',
    states: IT_REGIONS
  },
  ES: {
    countryCode: 'ES',
    countryName: 'Spain',
    states: ES_REGIONS
  },
  JP: {
    countryCode: 'JP',
    countryName: 'Japan',
    states: JP_PREFECTURES
  },
  BR: {
    countryCode: 'BR',
    countryName: 'Brazil',
    states: BR_STATES
  },
  MX: {
    countryCode: 'MX',
    countryName: 'Mexico',
    states: MX_STATES
  },
  NZ: {
    countryCode: 'NZ',
    countryName: 'New Zealand',
    states: NZ_REGIONS
  },
  TH: {
    countryCode: 'TH',
    countryName: 'Thailand',
    states: TH_PROVINCES
  },
  SG: {
    countryCode: 'SG',
    countryName: 'Singapore',
    states: SG_REGIONS
  },
  CH: {
    countryCode: 'CH',
    countryName: 'Switzerland',
    states: CH_CANTONS
  },
  NO: {
    countryCode: 'NO',
    countryName: 'Norway',
    states: NO_COUNTIES
  }
};

// Helper functions
export const getStatesByCountry = (countryCode: string): StateProvince[] => {
  return COUNTRY_STATES[countryCode]?.states || [];
};

export const getStateByCode = (countryCode: string, stateCode: string): StateProvince | undefined => {
  const states = getStatesByCountry(countryCode);
  return states.find(state => state.code === stateCode);
};

export const getCountryStatesData = (countryCode: string): CountryStates | undefined => {
  return COUNTRY_STATES[countryCode];
};

export const getAllCountriesWithStates = (): string[] => {
  return Object.keys(COUNTRY_STATES);
};

export const hasStates = (countryCode: string): boolean => {
  return countryCode in COUNTRY_STATES;
};

// Get all states for countries that can onboard sellers
export const getOnboardingCountriesStates = (): Record<string, CountryStates> => {
  const onboardingCountries = ['US', 'CA', 'AU', 'DE', 'FR', 'GB', 'IT', 'ES', 'JP', 'BR', 'MX', 'NZ', 'TH', 'SG', 'CH', 'NO'];
  const result: Record<string, CountryStates> = {};
  
  onboardingCountries.forEach(countryCode => {
    if (COUNTRY_STATES[countryCode]) {
      result[countryCode] = COUNTRY_STATES[countryCode];
    }
  });
  
  return result;
};
