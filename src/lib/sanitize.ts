import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'a',
      'img',
      'figure',
      'figcaption',
      'blockquote',
      'div',
      'span',
      'code',
      'pre',
    ],
    ALLOWED_ATTR: [
      'href',
      'src',
      'alt',
      'title',
      'class',
      'width',
      'height',
      'target',
      'rel',
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
}

/**
 * Sanitize string (remove HTML and special characters)
 */
export function sanitizeString(str: string): string {
  return str
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate email
 */
export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validate URL
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9.\-_]/gi, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

/**
 * Strip HTML tags
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Escape HTML
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Validate and sanitize language code
 */
export function sanitizeLanguage(lang: string): 'ar' | 'en' | 'fr' | 'es' | null {
  const validLanguages = ['ar', 'en', 'fr', 'es'];
  const sanitized = lang.toLowerCase().slice(0, 2);

  return validLanguages.includes(sanitized) ? (sanitized as 'ar' | 'en' | 'fr' | 'es') : null;
}

/**
 * Validate file type
 */
export function validateFileType(mimeType: string, allowedTypes: string[] = []): boolean {
  const defaultAllowed = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  const allowed = allowedTypes.length > 0 ? allowedTypes : defaultAllowed;
  return allowed.includes(mimeType);
}

/**
 * Validate file size
 */
export function validateFileSize(size: number, maxSize: number = 5242880): boolean {
  // Default max: 5MB
  return size <= maxSize;
}
