import { Injectable } from '@nestjs/common';
import { JSDOM } from 'jsdom';

@Injectable()
export class SanitizationService {
  private purify: any;

  constructor() {
    const window = new JSDOM('').window;
    const DOMPurify = require('dompurify');
    this.purify = DOMPurify(window);
  }

  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  sanitizeHtml(dirty: string): string {
    if (!dirty) return '';
    
    // Configure DOMPurify
    const config = {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href', 'title'],
      ALLOW_DATA_ATTR: false,
    };
    
    return this.purify.sanitize(dirty, config);
  }

  /**
   * Sanitize plain text (removes all HTML)
   */
  sanitizeText(text: string): string {
    if (!text) return '';
    
    // Remove all HTML tags
    const cleaned = this.purify.sanitize(text, { ALLOWED_TAGS: [] });
    
    // Additional sanitization
    return cleaned
      .replace(/[<>]/g, '') // Remove any remaining angle brackets
      .trim();
  }

  /**
   * Sanitize email address
   */
  sanitizeEmail(email: string): string {
    if (!email) return '';
    
    // Basic email sanitization
    return email
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9@._-]/gi, '');
  }

  /**
   * Sanitize filename to prevent path traversal
   */
  sanitizeFilename(filename: string): string {
    if (!filename) return '';
    
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid chars with underscore
      .replace(/\.\./g, '_') // Prevent directory traversal
      .replace(/^\./, '_') // Don't allow hidden files
      .substring(0, 255); // Limit length
  }

  /**
   * Sanitize URL
   */
  sanitizeUrl(url: string): string {
    if (!url) return '';
    
    try {
      const parsed = new URL(url);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return '';
      }
      
      return parsed.toString();
    } catch {
      return '';
    }
  }

  /**
   * Sanitize SQL-like strings to prevent injection
   */
  sanitizeSqlString(str: string): string {
    if (!str) return '';
    
    // This is a basic example - Prisma already handles parameterization
    return str
      .replace(/['";\\]/g, '') // Remove common SQL injection characters
      .replace(/--/g, '') // Remove SQL comments
      .replace(/\/\*/g, '') // Remove multi-line comments
      .replace(/\*\//g, '')
      .trim();
  }

  /**
   * Sanitize JSON string
   */
  sanitizeJson(jsonString: string): any {
    try {
      const parsed = JSON.parse(jsonString);
      // Recursively sanitize string values in the JSON
      return this.sanitizeJsonObject(parsed);
    } catch {
      return null;
    }
  }

  private sanitizeJsonObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeText(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeJsonObject(item));
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          // Sanitize the key as well
          const sanitizedKey = this.sanitizeText(key);
          sanitized[sanitizedKey] = this.sanitizeJsonObject(obj[key]);
        }
      }
      return sanitized;
    }
    
    return obj;
  }

  /**
   * Validate and sanitize phone number
   */
  sanitizePhoneNumber(phone: string): string {
    if (!phone) return '';
    
    // Remove all non-numeric characters except + for international
    return phone.replace(/[^0-9+]/g, '').substring(0, 20);
  }

  /**
   * Strip script tags and event handlers from HTML
   */
  stripScripts(html: string): string {
    if (!html) return '';
    
    return this.purify.sanitize(html, {
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    });
  }
}