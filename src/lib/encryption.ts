import crypto from 'crypto';

// Encryption key - في الإنتاج يجب أن يكون في متغيرات البيئة
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Encrypt a string value
 */
export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    // Derive key from encryption key and salt
    const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, 'sha512');
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Combine salt, iv, tag, and encrypted data
    return salt.toString('hex') + ':' + iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt an encrypted string
 */
export function decrypt(encryptedText: string): string {
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }
    
    const [saltHex, ivHex, tagHex, encrypted] = parts;
    
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    
    // Derive key from encryption key and salt
    const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, 'sha512');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

