import crypto from 'crypto';

// Generate a random initialization vector
const generateIV = () => {
  return crypto.randomBytes(16).toString('hex');
};

// Encrypt a name using AES-256-CBC
export const encryptName = (name: string): { encrypted: string; iv: string } => {
  const iv = generateIV();
  const key = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex');
  
  const cipher = crypto.createCipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
  let encrypted = cipher.update(name, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return { encrypted, iv };
};

// Decrypt a name using AES-256-CBC
export const decryptName = (encrypted: string, iv: string): string => {
  const key = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex');
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}; 