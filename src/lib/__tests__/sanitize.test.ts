import {
  sanitizeHtml,
  sanitizeString,
  validateEmail,
  validateUrl,
  sanitizeFilename,
  stripHtml,
  escapeHtml,
  sanitizeLanguage,
  validateFileType,
  validateFileSize,
} from '../sanitize';

describe('Sanitize Library', () => {
  describe('sanitizeHtml', () => {
    it('should allow safe HTML tags', () => {
      const html = '<p>Hello <strong>world</strong></p>';
      const result = sanitizeHtml(html);
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
    });

    it('should remove script tags', () => {
      const html = '<p>Hello</p><script>alert("xss")</script>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    it('should remove event handlers', () => {
      const html = '<p onclick="alert(1)">Click me</p>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('onclick');
    });

    it('should allow safe attributes', () => {
      const html = '<a href="https://example.com" title="Link">Click</a>';
      const result = sanitizeHtml(html);
      expect(result).toContain('href');
      expect(result).toContain('title');
    });
  });

  describe('sanitizeString', () => {
    it('should remove angle brackets', () => {
      const str = 'Hello <world>';
      const result = sanitizeString(str);
      expect(result).toBe('Hello world');
    });

    it('should remove javascript: protocol', () => {
      const str = 'javascript:alert(1)';
      const result = sanitizeString(str);
      expect(result).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      const str = 'onclick=alert(1)';
      const result = sanitizeString(str);
      expect(result).not.toContain('onclick=');
    });

    it('should trim whitespace', () => {
      const str = '  hello  ';
      const result = sanitizeString(str);
      expect(result).toBe('hello');
    });
  });

  describe('validateEmail', () => {
    it('should validate correct emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user+tag@domain.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
    });
  });

  describe('validateUrl', () => {
    it('should validate correct URLs', () => {
      expect(validateUrl('https://example.com')).toBe(true);
      expect(validateUrl('http://example.com/path')).toBe(true);
      expect(validateUrl('https://example.com:8080/path?query=1')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(validateUrl('not-a-url')).toBe(false);
      expect(validateUrl('javascript:alert(1)')).toBe(false);
      expect(validateUrl('')).toBe(false);
    });
  });

  describe('sanitizeFilename', () => {
    it('should convert to lowercase', () => {
      expect(sanitizeFilename('MyFile.TXT')).toBe('myfile.txt');
    });

    it('should replace special characters with underscore', () => {
      expect(sanitizeFilename('my file (1).txt')).toBe('my_file__1_.txt');
    });

    it('should remove consecutive underscores', () => {
      expect(sanitizeFilename('my___file.txt')).toBe('my_file.txt');
    });

    it('should preserve dots and hyphens', () => {
      expect(sanitizeFilename('my-file.v1.txt')).toBe('my-file.v1.txt');
    });
  });

  describe('stripHtml', () => {
    it('should remove all HTML tags', () => {
      const html = '<p>Hello <strong>world</strong></p>';
      expect(stripHtml(html)).toBe('Hello world');
    });

    it('should handle nested tags', () => {
      const html = '<div><p><span>Text</span></p></div>';
      expect(stripHtml(html)).toBe('Text');
    });

    it('should handle self-closing tags', () => {
      const html = 'Text<br/>More text';
      expect(stripHtml(html)).toBe('TextMore text');
    });
  });

  describe('escapeHtml', () => {
    it('should escape special HTML characters', () => {
      expect(escapeHtml('&')).toBe('&amp;');
      expect(escapeHtml('<')).toBe('&lt;');
      expect(escapeHtml('>')).toBe('&gt;');
      expect(escapeHtml('"')).toBe('&quot;');
      expect(escapeHtml("'")).toBe('&#039;');
    });

    it('should escape multiple characters', () => {
      const text = '<script>alert("XSS")</script>';
      const escaped = escapeHtml(text);
      expect(escaped).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    });

    it('should preserve safe characters', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
    });
  });

  describe('sanitizeLanguage', () => {
    it('should accept valid language codes', () => {
      expect(sanitizeLanguage('ar')).toBe('ar');
      expect(sanitizeLanguage('en')).toBe('en');
      expect(sanitizeLanguage('fr')).toBe('fr');
      expect(sanitizeLanguage('es')).toBe('es');
    });

    it('should convert to lowercase', () => {
      expect(sanitizeLanguage('AR')).toBe('ar');
      expect(sanitizeLanguage('En')).toBe('en');
    });

    it('should truncate to 2 characters', () => {
      expect(sanitizeLanguage('ara')).toBe('ar');
      expect(sanitizeLanguage('eng')).toBe('en');
    });

    it('should reject invalid language codes', () => {
      expect(sanitizeLanguage('xx')).toBe(null);
      expect(sanitizeLanguage('de')).toBe(null);
      expect(sanitizeLanguage('123')).toBe(null);
    });
  });

  describe('validateFileType', () => {
    it('should accept default image types', () => {
      expect(validateFileType('image/jpeg')).toBe(true);
      expect(validateFileType('image/jpg')).toBe(true);
      expect(validateFileType('image/png')).toBe(true);
      expect(validateFileType('image/webp')).toBe(true);
      expect(validateFileType('image/gif')).toBe(true);
    });

    it('should reject non-image types by default', () => {
      expect(validateFileType('application/pdf')).toBe(false);
      expect(validateFileType('text/plain')).toBe(false);
    });

    it('should accept custom allowed types', () => {
      const allowed = ['application/pdf', 'text/plain'];
      expect(validateFileType('application/pdf', allowed)).toBe(true);
      expect(validateFileType('image/jpeg', allowed)).toBe(false);
    });
  });

  describe('validateFileSize', () => {
    it('should accept files within default limit (5MB)', () => {
      expect(validateFileSize(1000000)).toBe(true); // 1MB
      expect(validateFileSize(5242880)).toBe(true); // Exactly 5MB
    });

    it('should reject files exceeding default limit', () => {
      expect(validateFileSize(5242881)).toBe(false); // 5MB + 1 byte
      expect(validateFileSize(10485760)).toBe(false); // 10MB
    });

    it('should respect custom max size', () => {
      expect(validateFileSize(2000000, 1000000)).toBe(false); // 2MB > 1MB limit
      expect(validateFileSize(500000, 1000000)).toBe(true); // 0.5MB < 1MB limit
    });
  });
});
