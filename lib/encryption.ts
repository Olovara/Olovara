import crypto from 'crypto';

// Get encryption key from environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY as string;

// Debug logging
//console.log("ENCRYPTION_KEY exists:", !!ENCRYPTION_KEY);
//console.log("ENCRYPTION_KEY length:", ENCRYPTION_KEY?.length);

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY is not defined in environment variables');
}

// Generate a random initialization vector
const generateIV = () => {
  return crypto.randomBytes(16).toString('hex');
};

// Encrypt a name using AES-256-CBC
export const encryptName = (name: string): { encrypted: string; iv: string } => {
  const iv = generateIV();
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  
  const cipher = crypto.createCipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
  let encrypted = cipher.update(name, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return { encrypted, iv };
};

// Decrypt a name using AES-256-CBC
export const decryptName = (encrypted: string, iv: string): string => {
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

export function encryptOrderData(data: string): { encrypted: string; iv: string } {
  try {
    const iv = generateIV();
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    
    if (key.length !== 32) {
      throw new Error(`Invalid key length: ${key.length} bytes. Expected 32 bytes.`);
    }
    
    const cipher = crypto.createCipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw error;
  }
}

export function decryptOrderData(encrypted: string, iv: string): string {
  try {
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    
    if (key.length !== 32) {
      throw new Error(`Invalid key length: ${key.length} bytes. Expected 32 bytes.`);
    }
    
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      key,
      Buffer.from(iv, 'hex')
    );
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw error;
  }
} 