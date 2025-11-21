import { encrypt, decrypt } from '../encryption';

describe('Encryption Library', () => {
  describe('encrypt', () => {
    it('should encrypt a string', () => {
      const text = 'Hello World';
      const encrypted = encrypt(text);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toBe(text);
    });

    it('should produce different ciphertext for same plaintext (due to random IV and salt)', () => {
      const text = 'Hello World';
      const encrypted1 = encrypt(text);
      const encrypted2 = encrypt(text);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should have 4 parts separated by colon (salt:iv:tag:encrypted)', () => {
      const text = 'Test';
      const encrypted = encrypt(text);
      const parts = encrypted.split(':');

      expect(parts).toHaveLength(4);
    });

    it('should handle empty strings', () => {
      const text = '';
      const encrypted = encrypt(text);

      expect(encrypted).toBeDefined();
      expect(encrypted.split(':')).toHaveLength(4);
    });

    it('should handle special characters', () => {
      const text = '!@#$%^&*()_+-={}[]|:";\'<>?,./';
      const encrypted = encrypt(text);

      expect(encrypted).toBeDefined();
    });

    it('should handle Arabic text', () => {
      const text = 'مرحباً بالعالم';
      const encrypted = encrypt(text);

      expect(encrypted).toBeDefined();
    });

    it('should handle long strings', () => {
      const text = 'A'.repeat(10000);
      const encrypted = encrypt(text);

      expect(encrypted).toBeDefined();
    });
  });

  describe('decrypt', () => {
    it('should decrypt an encrypted string', () => {
      const originalText = 'Hello World';
      const encrypted = encrypt(originalText);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(originalText);
    });

    it('should handle empty strings', () => {
      const originalText = '';
      const encrypted = encrypt(originalText);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(originalText);
    });

    it('should handle special characters', () => {
      const originalText = '!@#$%^&*()_+-={}[]|:";\'<>?,./';
      const encrypted = encrypt(originalText);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(originalText);
    });

    it('should handle Arabic text', () => {
      const originalText = 'مرحباً بالعالم';
      const encrypted = encrypt(originalText);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(originalText);
    });

    it('should handle long strings', () => {
      const originalText = 'A'.repeat(10000);
      const encrypted = encrypt(originalText);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(originalText);
    });

    it('should throw error for invalid format (missing parts)', () => {
      const invalidEncrypted = 'invalid:format';

      expect(() => decrypt(invalidEncrypted)).toThrow();
    });

    it('should throw error for tampered ciphertext', () => {
      const text = 'Hello World';
      const encrypted = encrypt(text);
      const parts = encrypted.split(':');

      // Tamper with encrypted part
      parts[3] = 'tampered';
      const tampered = parts.join(':');

      expect(() => decrypt(tampered)).toThrow();
    });

    it('should throw error for tampered auth tag', () => {
      const text = 'Hello World';
      const encrypted = encrypt(text);
      const parts = encrypted.split(':');

      // Tamper with auth tag
      parts[2] = 'a'.repeat(parts[2].length);
      const tampered = parts.join(':');

      expect(() => decrypt(tampered)).toThrow();
    });

    it('should throw error for empty string', () => {
      expect(() => decrypt('')).toThrow();
    });
  });

  describe('encrypt/decrypt integration', () => {
    it('should handle multiple encrypt/decrypt cycles', () => {
      let text = 'Original Text';

      for (let i = 0; i < 10; i++) {
        const encrypted = encrypt(text);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(text);
        text = decrypted;
      }
    });

    it('should handle various data types (as strings)', () => {
      const testCases = [
        'Simple text',
        '123456',
        'true',
        'false',
        'null',
        JSON.stringify({ key: 'value' }),
        JSON.stringify([1, 2, 3]),
      ];

      testCases.forEach((testCase) => {
        const encrypted = encrypt(testCase);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(testCase);
      });
    });

    it('should produce unique ciphertexts but same decryption', () => {
      const text = 'Sensitive Data';
      const encrypted1 = encrypt(text);
      const encrypted2 = encrypt(text);
      const encrypted3 = encrypt(text);

      // All ciphertexts should be different
      expect(encrypted1).not.toBe(encrypted2);
      expect(encrypted1).not.toBe(encrypted3);
      expect(encrypted2).not.toBe(encrypted3);

      // But all should decrypt to the same value
      expect(decrypt(encrypted1)).toBe(text);
      expect(decrypt(encrypted2)).toBe(text);
      expect(decrypt(encrypted3)).toBe(text);
    });
  });

  describe('security properties', () => {
    it('should use random IV (different encrypted values for same input)', () => {
      const text = 'Test';
      const encryptions = new Set();

      for (let i = 0; i < 100; i++) {
        encryptions.add(encrypt(text));
      }

      // All 100 encryptions should be unique
      expect(encryptions.size).toBe(100);
    });

    it('should use random salt (different encrypted values for same input)', () => {
      const text = 'Test';
      const salts = new Set();

      for (let i = 0; i < 100; i++) {
        const encrypted = encrypt(text);
        const salt = encrypted.split(':')[0];
        salts.add(salt);
      }

      // All 100 salts should be unique (extremely high probability)
      expect(salts.size).toBeGreaterThan(95); // Allow for extremely rare collisions
    });
  });
});
