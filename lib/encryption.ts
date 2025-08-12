import crypto from 'crypto';

// Constants
const ALGORITHM = 'aes-256-gcm'; // Using GCM mode for authenticated encryption
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits for GCM
const SALT_LENGTH = 16; // 128 bits for key derivation

// Get encryption key from environment
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.NEXT_PUBLIC_ENCRYPTION_KEY;
console.log("Encryption key exists:", !!ENCRYPTION_KEY);
console.log("Encryption key length:", ENCRYPTION_KEY?.length);

if (!ENCRYPTION_KEY) {
  if (typeof window === 'undefined') {
    // Server-side error
    throw new Error('ENCRYPTION_KEY environment variable is not set. Please add it to your .env file.');
  } else {
    // Client-side error
    console.error('ENCRYPTION_KEY environment variable is not set');
    throw new Error('Encryption key is not configured properly');
  }
}

// Validate key length
const key = Buffer.from(ENCRYPTION_KEY, 'hex');
if (key.length !== KEY_LENGTH) {
  console.error(`Invalid key length: ${key.length} bytes. Expected ${KEY_LENGTH} bytes.`);
  throw new Error(`Invalid key length: ${key.length} bytes. Expected ${KEY_LENGTH} bytes.`);
}

// Generate a random IV
export function generateIV(): string {
  return crypto.randomBytes(IV_LENGTH).toString('hex');
}

// Generate a random salt for key derivation
export function generateSalt(): string {
  return crypto.randomBytes(SALT_LENGTH).toString('hex');
}

// Derive a key using PBKDF2
function deriveKey(masterKey: Buffer, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(masterKey, salt, 100000, KEY_LENGTH, 'sha256');
}

// Encrypt data with additional security measures
export function encryptData(data: string): { encrypted: string; iv: string; salt: string } {
  try {
    // Generate a random salt for key derivation
    const salt = generateSalt();
    const saltBuffer = Buffer.from(salt, 'hex');
    
    // Derive a unique key for this encryption
    const derivedKey = deriveKey(key, saltBuffer);
    
    // Generate a random IV
    const iv = generateIV();
    const ivBuffer = Buffer.from(iv, 'hex');
    
    // Create cipher with GCM mode
    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, ivBuffer);
    
    // Add associated data for authentication (optional)
    cipher.setAAD(Buffer.from('YarnnuMarketplace'));
    
    // Encrypt the data
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag
    const authTag = cipher.getAuthTag();
    
    // Combine encrypted data with auth tag
    const result = encrypted + authTag.toString('hex');
    
    return {
      encrypted: result,
      iv,
      salt
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

// Decrypt data with additional security measures
export function decryptData(encryptedData: string, iv: string, salt: string): string {
  try {
    // Check for invalid encryption values (from old seller applications)
    if (iv === "temp-iv" || salt === "temp-salt" || !iv || !salt) {
      console.warn("Invalid encryption values detected, returning fallback value");
      return "Temporary Data - Please Update";
    }

    // Convert salt and IV to buffers
    const saltBuffer = Buffer.from(salt, 'hex');
    const ivBuffer = Buffer.from(iv, 'hex');
    
    // Derive the same key used for encryption
    const derivedKey = deriveKey(key, saltBuffer);
    
    // Extract auth tag from the end of encrypted data
    const authTag = Buffer.from(encryptedData.slice(-32), 'hex');
    const encrypted = encryptedData.slice(0, -32);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, ivBuffer);
    
    // Set authentication tag
    decipher.setAuthTag(authTag);
    
    // Add associated data for authentication (must match encryption)
    decipher.setAAD(Buffer.from('YarnnuMarketplace'));
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    // Return a fallback value instead of throwing an error
    return "Temporary Data - Please Update";
  }
}

// Helper function to encrypt seller tax information
export function encryptSellerTaxInfo(data: {
  businessName: string;
  taxId: string;
  additionalTaxRegistrations?: string;
}): {
  encryptedBusinessName: string;
  businessNameIV: string;
  businessNameSalt: string;
  encryptedTaxId: string;
  taxIdIV: string;
  taxIdSalt: string;
  encryptedAdditionalTaxRegistrations?: string;
  additionalTaxRegistrationsIV?: string;
  additionalTaxRegistrationsSalt?: string;
} {
  const { encrypted: encryptedBusinessName, iv: businessNameIV, salt: businessNameSalt } = encryptData(data.businessName);
  const { encrypted: encryptedTaxId, iv: taxIdIV, salt: taxIdSalt } = encryptData(data.taxId);

  const result: any = {
    encryptedBusinessName,
    businessNameIV,
    businessNameSalt,
    encryptedTaxId,
    taxIdIV,
    taxIdSalt,
  };

  if (data.additionalTaxRegistrations) {
    const { encrypted: encryptedAdditionalTaxRegistrations, iv: additionalTaxRegistrationsIV, salt: additionalTaxRegistrationsSalt } = 
      encryptData(data.additionalTaxRegistrations);
    result.encryptedAdditionalTaxRegistrations = encryptedAdditionalTaxRegistrations;
    result.additionalTaxRegistrationsIV = additionalTaxRegistrationsIV;
    result.additionalTaxRegistrationsSalt = additionalTaxRegistrationsSalt;
  }

  return result;
}

// Helper function to decrypt seller tax information
export function decryptSellerTaxInfo(data: {
  encryptedBusinessName: string;
  businessNameIV: string;
  businessNameSalt: string;
  encryptedTaxId: string;
  taxIdIV: string;
  taxIdSalt: string;
  encryptedAdditionalTaxRegistrations?: string;
  additionalTaxRegistrationsIV?: string;
  additionalTaxRegistrationsSalt?: string;
}): {
  businessName: string;
  taxId: string;
  additionalTaxRegistrations?: string;
} {
  const result: any = {
    businessName: decryptData(data.encryptedBusinessName, data.businessNameIV, data.businessNameSalt),
    taxId: decryptData(data.encryptedTaxId, data.taxIdIV, data.taxIdSalt),
  };

  if (data.encryptedAdditionalTaxRegistrations && data.additionalTaxRegistrationsIV && data.additionalTaxRegistrationsSalt) {
    result.additionalTaxRegistrations = decryptData(
      data.encryptedAdditionalTaxRegistrations,
      data.additionalTaxRegistrationsIV,
      data.additionalTaxRegistrationsSalt
    );
  }

  return result;
}

// Debug logging
//console.log("ENCRYPTION_KEY exists:", !!ENCRYPTION_KEY);
//console.log("ENCRYPTION_KEY length:", ENCRYPTION_KEY?.length);

// Encrypt a name using AES-256-CBC
export const encryptName = (name: string): { encrypted: string; iv: string } => {
  // Generate IV specifically for CBC mode (16 bytes)
  const iv = crypto.randomBytes(16).toString('hex');
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const ivBuffer = Buffer.from(iv, 'hex');
  
  const cipher = crypto.createCipheriv('aes-256-cbc', key, ivBuffer);
  let encrypted = cipher.update(name, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return { encrypted, iv };
};

// Decrypt a name using AES-256-CBC
export const decryptName = (encrypted: string, iv: string): string => {
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const ivBuffer = Buffer.from(iv, 'hex');
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, ivBuffer);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

export function encryptOrderData(data: string): { encrypted: string; iv: string; salt: string } {
  try {
    // Generate a random salt for key derivation
    const salt = generateSalt();
    const saltBuffer = Buffer.from(salt, 'hex');
    
    // Derive a unique key for this encryption
    const derivedKey = deriveKey(key, saltBuffer);
    
    // Generate a random IV
    const iv = generateIV();
    const ivBuffer = Buffer.from(iv, 'hex');
    
    // Create cipher with GCM mode
    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, ivBuffer);
    
    // Add associated data for authentication (optional)
    cipher.setAAD(Buffer.from('YarnnuMarketplace'));
    
    // Encrypt the data
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag
    const authTag = cipher.getAuthTag();
    
    // Combine encrypted data with auth tag
    const result = encrypted + authTag.toString('hex');
    
    return {
      encrypted: result,
      iv,
      salt
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

export function decryptOrderData(encryptedData: string, iv: string, salt: string): string {
  try {
    // Convert salt and IV to buffers
    const saltBuffer = Buffer.from(salt, 'hex');
    const ivBuffer = Buffer.from(iv, 'hex');
    
    // Derive the same key used for encryption
    const derivedKey = deriveKey(key, saltBuffer);
    
    // Extract auth tag from the end of encrypted data
    const authTag = Buffer.from(encryptedData.slice(-32), 'hex');
    const encrypted = encryptedData.slice(0, -32);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, ivBuffer);
    
    // Set authentication tag
    decipher.setAuthTag(authTag);
    
    // Add associated data for authentication (must match encryption)
    decipher.setAAD(Buffer.from('YarnnuMarketplace'));
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

// Helper function to encrypt address fields
export function encryptAddress(address: {
  street: string;
  street2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}): {
  encryptedStreet: string;
  streetIV: string;
  streetSalt: string;
  encryptedStreet2?: string;
  street2IV?: string;
  street2Salt?: string;
  encryptedCity: string;
  cityIV: string;
  citySalt: string;
  encryptedState?: string;
  stateIV?: string;
  stateSalt?: string;
  encryptedPostal: string;
  postalIV: string;
  postalSalt: string;
  encryptedCountry: string;
  countryIV: string;
  countrySalt: string;
} {
  const { encrypted: encryptedStreet, iv: streetIV, salt: streetSalt } = encryptData(address.street);
  const { encrypted: encryptedCity, iv: cityIV, salt: citySalt } = encryptData(address.city);
  const { encrypted: encryptedPostal, iv: postalIV, salt: postalSalt } = encryptData(address.postalCode);
  const { encrypted: encryptedCountry, iv: countryIV, salt: countrySalt } = encryptData(address.country);

  const result: any = {
    encryptedStreet,
    streetIV,
    streetSalt,
    encryptedCity,
    cityIV,
    citySalt,
    encryptedPostal,
    postalIV,
    postalSalt,
    encryptedCountry,
    countryIV,
    countrySalt,
  };

  if (address.street2) {
    const { encrypted: encryptedStreet2, iv: street2IV, salt: street2Salt } = encryptData(address.street2);
    result.encryptedStreet2 = encryptedStreet2;
    result.street2IV = street2IV;
    result.street2Salt = street2Salt;
  }

  if (address.state) {
    const { encrypted: encryptedState, iv: stateIV, salt: stateSalt } = encryptData(address.state);
    result.encryptedState = encryptedState;
    result.stateIV = stateIV;
    result.stateSalt = stateSalt;
  }

  return result;
}

// Helper function to decrypt address fields
export function encryptLocationInfo(data: {
  state?: string;
  city?: string;
}): {
  encryptedState?: string;
  stateIV?: string;
  stateSalt?: string;
  encryptedCity?: string;
  cityIV?: string;
  citySalt?: string;
} {
  const result: {
    encryptedState?: string;
    stateIV?: string;
    stateSalt?: string;
    encryptedCity?: string;
    cityIV?: string;
    citySalt?: string;
  } = {};

  // Encrypt state if provided
  if (data.state && data.state.trim() !== '') {
    const stateEncryption = encryptData(data.state);
    result.encryptedState = stateEncryption.encrypted;
    result.stateIV = stateEncryption.iv;
    result.stateSalt = stateEncryption.salt;
  }

  // Encrypt city if provided
  if (data.city && data.city.trim() !== '') {
    const cityEncryption = encryptData(data.city);
    result.encryptedCity = cityEncryption.encrypted;
    result.cityIV = cityEncryption.iv;
    result.citySalt = cityEncryption.salt;
  }

  return result;
}

export function decryptLocationInfo(data: {
  encryptedState?: string;
  stateIV?: string;
  stateSalt?: string;
  encryptedCity?: string;
  cityIV?: string;
  citySalt?: string;
}): {
  state?: string;
  city?: string;
} {
  const result: {
    state?: string;
    city?: string;
  } = {};

  // Decrypt state if available
  if (data.encryptedState && data.stateIV && data.stateSalt) {
    try {
      result.state = decryptData(data.encryptedState, data.stateIV, data.stateSalt);
    } catch (error) {
      console.error('Error decrypting state:', error);
      result.state = '';
    }
  }

  // Decrypt city if available
  if (data.encryptedCity && data.cityIV && data.citySalt) {
    try {
      result.city = decryptData(data.encryptedCity, data.cityIV, data.citySalt);
    } catch (error) {
      console.error('Error decrypting city:', error);
      result.city = '';
    }
  }

  return result;
}

export function decryptAddress(address: {
  encryptedStreet: string;
  streetIV: string;
  streetSalt: string;
  encryptedStreet2?: string;
  street2IV?: string;
  street2Salt?: string;
  encryptedCity: string;
  cityIV: string;
  citySalt: string;
  encryptedState?: string;
  stateIV?: string;
  stateSalt?: string;
  encryptedPostal: string;
  postalIV: string;
  postalSalt: string;
  encryptedCountry: string;
  countryIV: string;
  countrySalt: string;
}): {
  street: string;
  street2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
} {
  const result: any = {
    street: decryptData(address.encryptedStreet, address.streetIV, address.streetSalt),
    city: decryptData(address.encryptedCity, address.cityIV, address.citySalt),
    postalCode: decryptData(address.encryptedPostal, address.postalIV, address.postalSalt),
    country: decryptData(address.encryptedCountry, address.countryIV, address.countrySalt),
  };

  if (address.encryptedStreet2 && address.street2IV && address.street2Salt) {
    result.street2 = decryptData(address.encryptedStreet2, address.street2IV, address.street2Salt);
  }

  if (address.encryptedState && address.stateIV && address.stateSalt) {
    result.state = decryptData(address.encryptedState, address.stateIV, address.stateSalt);
  }

  return result;
} 