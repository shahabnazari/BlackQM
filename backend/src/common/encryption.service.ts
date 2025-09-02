import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits
  private readonly saltLength = 64; // 512 bits
  private readonly iterations = 100000; // PBKDF2 iterations
  private encryptionKey!: Buffer;

  constructor(private configService: ConfigService) {
    this.initializeEncryptionKey();
  }

  /**
   * Initialize the encryption key from environment or generate one
   */
  private initializeEncryptionKey() {
    const masterKey = this.configService.get<string>('ENCRYPTION_MASTER_KEY');
    
    if (!masterKey) {
      throw new Error('ENCRYPTION_MASTER_KEY not configured. Please set it in your environment variables.');
    }

    // Derive encryption key from master key using PBKDF2
    const salt = this.configService.get<string>('ENCRYPTION_SALT') || 'vqmethod-default-salt';
    this.encryptionKey = crypto.pbkdf2Sync(
      masterKey,
      salt,
      this.iterations,
      this.keyLength,
      'sha256',
    );
  }

  /**
   * Encrypt sensitive data using AES-256-GCM
   */
  encrypt(plaintext: string | object): string {
    try {
      // Convert object to JSON string if needed
      const text = typeof plaintext === 'object' 
        ? JSON.stringify(plaintext) 
        : plaintext;

      // Generate random IV
      const iv = crypto.randomBytes(this.ivLength);
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
      
      // Encrypt the data
      const encrypted = Buffer.concat([
        cipher.update(text, 'utf8'),
        cipher.final(),
      ]);
      
      // Get the authentication tag
      const authTag = cipher.getAuthTag();
      
      // Combine IV, auth tag, and encrypted data
      const combined = Buffer.concat([iv, authTag, encrypted]);
      
      // Return base64 encoded string
      return combined.toString('base64');
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Decrypt data encrypted with AES-256-GCM
   */
  decrypt(encryptedData: string): string {
    try {
      // Decode from base64
      const combined = Buffer.from(encryptedData, 'base64');
      
      // Extract components
      const iv = combined.slice(0, this.ivLength);
      const authTag = combined.slice(this.ivLength, this.ivLength + this.tagLength);
      const encrypted = combined.slice(this.ivLength + this.tagLength);
      
      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);
      
      // Decrypt the data
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);
      
      return decrypted.toString('utf8');
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Decrypt and parse JSON data
   */
  decryptJSON<T = any>(encryptedData: string): T {
    const decrypted = this.decrypt(encryptedData);
    try {
      return JSON.parse(decrypted);
    } catch {
      // If it's not JSON, return as string
      return decrypted as any;
    }
  }

  /**
   * Hash sensitive data (one-way, for comparison)
   */
  hash(data: string): string {
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }

  /**
   * Generate a random encryption key
   */
  generateKey(): string {
    return crypto.randomBytes(this.keyLength).toString('base64');
  }

  /**
   * Generate a random salt
   */
  generateSalt(): string {
    return crypto.randomBytes(this.saltLength).toString('base64');
  }

  /**
   * Encrypt specific fields in an object
   */
  encryptFields<T extends Record<string, any>>(
    obj: T,
    fieldsToEncrypt: string[],
  ): T {
    const result = { ...obj } as any;
    
    for (const field of fieldsToEncrypt) {
      if (result[field] !== undefined && result[field] !== null) {
        result[field] = this.encrypt(result[field]);
      }
    }
    
    return result as T;
  }

  /**
   * Decrypt specific fields in an object
   */
  decryptFields<T extends Record<string, any>>(
    obj: T,
    fieldsToDecrypt: string[],
  ): T {
    const result = { ...obj } as any;
    
    for (const field of fieldsToDecrypt) {
      if (result[field] !== undefined && result[field] !== null) {
        try {
          result[field] = this.decrypt(result[field]);
          // Try to parse as JSON if possible
          try {
            result[field] = JSON.parse(result[field]);
          } catch {
            // Keep as string if not JSON
          }
        } catch (error) {
          // If decryption fails, leave the field as is
          console.error(`Failed to decrypt field ${field}:`, error instanceof Error ? error.message : String(error));
        }
      }
    }
    
    return result as T;
  }

  /**
   * Create a deterministic encryption key from a password
   */
  deriveKeyFromPassword(password: string, salt: string): Buffer {
    return crypto.pbkdf2Sync(
      password,
      salt,
      this.iterations,
      this.keyLength,
      'sha256',
    );
  }

  /**
   * Encrypt data with a password (for user-specific encryption)
   */
  encryptWithPassword(plaintext: string, password: string): string {
    const salt = crypto.randomBytes(this.saltLength);
    const key = this.deriveKeyFromPassword(password, salt.toString('base64'));
    
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    
    const authTag = cipher.getAuthTag();
    
    // Combine salt, IV, auth tag, and encrypted data
    const combined = Buffer.concat([salt, iv, authTag, encrypted]);
    
    return combined.toString('base64');
  }

  /**
   * Decrypt data encrypted with a password
   */
  decryptWithPassword(encryptedData: string, password: string): string {
    const combined = Buffer.from(encryptedData, 'base64');
    
    const salt = combined.slice(0, this.saltLength);
    const iv = combined.slice(this.saltLength, this.saltLength + this.ivLength);
    const authTag = combined.slice(
      this.saltLength + this.ivLength,
      this.saltLength + this.ivLength + this.tagLength,
    );
    const encrypted = combined.slice(this.saltLength + this.ivLength + this.tagLength);
    
    const key = this.deriveKeyFromPassword(password, salt.toString('base64'));
    
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    
    return decrypted.toString('utf8');
  }
}