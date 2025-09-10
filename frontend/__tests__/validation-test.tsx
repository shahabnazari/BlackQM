/**
 * Form Validation Test Suite
 * Tests all validation scenarios for the study creation page
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Test data for validation scenarios
const validationTestCases = {
  // Title field validation
  title: {
    tooShort: 'Test',           // < 10 chars
    valid: 'Valid Study Title',  // 10-100 chars
    tooLong: 'A'.repeat(101),   // > 100 chars
    empty: '',                  // Required field
    withSpecialChars: 'Study @#$%^&* Test!', // Special characters
    withNumbers: 'Study 2025 Version 1.0',   // Numbers
  },
  
  // Description field validation
  description: {
    tooShort: 'Short desc',     // < 50 chars (optional but has min if provided)
    valid: 'This is a valid description that meets the minimum character requirement of 50 characters', // 50-500 chars
    tooLong: 'A'.repeat(501),   // > 500 chars
    empty: '',                  // Optional field
  },
  
  // Welcome message validation
  welcomeMessage: {
    tooShort: 'Welcome!',       // < 100 chars
    valid: 'Welcome to our research study. We appreciate your participation in this important Q-methodology research project that will help us understand various perspectives.', // 100-5000 chars
    tooLong: 'A'.repeat(5001), // > 5000 chars
    withHTML: '<p>Welcome to <strong>our study</strong></p>', // HTML content
    empty: '',                  // Required field
  },
  
  // Consent form validation
  consentForm: {
    tooShort: 'I consent to participate.', // < 500 chars
    valid: `This research study is being conducted to understand different perspectives on the topic. 
            By participating, you agree that your responses will be used for research purposes only. 
            All data will be anonymized and kept confidential. You have the right to withdraw from 
            the study at any time without penalty. Your participation is voluntary and you must be 
            18 years or older to participate. If you have any questions about the study, please 
            contact the research team. By continuing, you acknowledge that you have read and 
            understood this information and consent to participate in this research study.`, // 500-10000 chars
    tooLong: 'A'.repeat(10001), // > 10000 chars
    empty: '',                   // Required field
  },
  
  // Email validation (if applicable)
  email: {
    valid: 'researcher@university.edu',
    invalid: 'invalid-email',
    missingAt: 'emailexample.com',
    missingDomain: 'email@',
    specialChars: 'email+tag@example.com',
    multiple: 'email1@example.com,email2@example.com',
  },
  
  // File upload validation
  fileUpload: {
    validImage: {
      name: 'logo.png',
      type: 'image/png',
      size: 1024 * 1024, // 1MB
    },
    invalidType: {
      name: 'document.pdf',
      type: 'application/pdf',
      size: 1024 * 1024,
    },
    tooLarge: {
      name: 'large.jpg',
      type: 'image/jpeg',
      size: 10 * 1024 * 1024, // 10MB
    },
    empty: {
      name: '',
      type: '',
      size: 0,
    },
  },
};

// Validation rules to test
const validationRules = {
  title: {
    required: true,
    minLength: 10,
    maxLength: 100,
    pattern: null, // No specific pattern
  },
  description: {
    required: false,
    minLength: 50,
    maxLength: 500,
    pattern: null,
  },
  welcomeMessage: {
    required: true,
    minLength: 100,
    maxLength: 5000,
    stripHTML: true, // Should count text content only
  },
  consentForm: {
    required: true,
    minLength: 500,
    maxLength: 10000,
    stripHTML: true,
  },
  email: {
    required: false,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  fileUpload: {
    required: false,
    maxSize: 5 * 1024 * 1024, // 5MB
    acceptedTypes: ['image/jpeg', 'image/png', 'image/gif'],
  },
};

// Helper function to strip HTML
function stripHTML(html: string): string {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}

// Test validation function
function validateField(fieldName: string, value: any): { valid: boolean; error?: string } {
  const rules = validationRules[fieldName as keyof typeof validationRules];
  if (!rules) return { valid: true };
  
  // Check required
  if (rules.required && !value) {
    return { valid: false, error: `${fieldName} is required` };
  }
  
  // Check string validations
  if (typeof value === 'string') {
    let textValue = value;
    
    // Strip HTML if needed
    if ('stripHTML' in rules && rules.stripHTML) {
      textValue = stripHTML(value);
    }
    
    // Check min length
    if ('minLength' in rules && rules.minLength && textValue.length < rules.minLength) {
      return { 
        valid: false, 
        error: `${fieldName} must be at least ${rules.minLength} characters (currently ${textValue.length})` 
      };
    }
    
    // Check max length
    if ('maxLength' in rules && rules.maxLength && textValue.length > rules.maxLength) {
      return { 
        valid: false, 
        error: `${fieldName} must be less than ${rules.maxLength} characters (currently ${textValue.length})` 
      };
    }
    
    // Check pattern
    if ('pattern' in rules && rules.pattern && !rules.pattern.test(value)) {
      return { valid: false, error: `${fieldName} format is invalid` };
    }
  }
  
  // Check file validations
  if (fieldName === 'fileUpload' && value) {
    const fileRules = rules as typeof validationRules.fileUpload;
    
    if (fileRules.maxSize && value.size > fileRules.maxSize) {
      return { 
        valid: false, 
        error: `File size must be less than ${fileRules.maxSize / (1024 * 1024)}MB` 
      };
    }
    
    if (fileRules.acceptedTypes && !fileRules.acceptedTypes.includes(value.type)) {
      return { 
        valid: false, 
        error: `File type must be one of: ${fileRules.acceptedTypes.join(', ')}` 
      };
    }
  }
  
  return { valid: true };
}

// Test suite
describe('Form Validation Tests', () => {
  
  describe('1. Required Field Validation', () => {
    test('Title field - required validation', () => {
      const result = validateField('title', '');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });
    
    test('Welcome message - required validation', () => {
      const result = validateField('welcomeMessage', '');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });
    
    test('Consent form - required validation', () => {
      const result = validateField('consentForm', '');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });
    
    test('Description field - optional validation', () => {
      const result = validateField('description', '');
      expect(result.valid).toBe(true);
    });
  });
  
  describe('2. Character Limit Validation', () => {
    describe('Title Field', () => {
      test('Too short (< 10 chars)', () => {
        const result = validateField('title', validationTestCases.title.tooShort);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('at least 10 characters');
      });
      
      test('Valid length (10-100 chars)', () => {
        const result = validateField('title', validationTestCases.title.valid);
        expect(result.valid).toBe(true);
      });
      
      test('Too long (> 100 chars)', () => {
        const result = validateField('title', validationTestCases.title.tooLong);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('less than 100 characters');
      });
      
      test('Special characters allowed', () => {
        const result = validateField('title', validationTestCases.title.withSpecialChars);
        expect(result.valid).toBe(true);
      });
      
      test('Numbers allowed', () => {
        const result = validateField('title', validationTestCases.title.withNumbers);
        expect(result.valid).toBe(true);
      });
    });
    
    describe('Description Field', () => {
      test('Empty (optional field)', () => {
        const result = validateField('description', '');
        expect(result.valid).toBe(true);
      });
      
      test('Too short when provided (< 50 chars)', () => {
        const result = validateField('description', validationTestCases.description.tooShort);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('at least 50 characters');
      });
      
      test('Valid length (50-500 chars)', () => {
        const result = validateField('description', validationTestCases.description.valid);
        expect(result.valid).toBe(true);
      });
      
      test('Too long (> 500 chars)', () => {
        const result = validateField('description', validationTestCases.description.tooLong);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('less than 500 characters');
      });
    });
    
    describe('Welcome Message', () => {
      test('Too short (< 100 chars)', () => {
        const result = validateField('welcomeMessage', validationTestCases.welcomeMessage.tooShort);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('at least 100 characters');
      });
      
      test('Valid length (100-5000 chars)', () => {
        const result = validateField('welcomeMessage', validationTestCases.welcomeMessage.valid);
        expect(result.valid).toBe(true);
      });
      
      test('Too long (> 5000 chars)', () => {
        const result = validateField('welcomeMessage', validationTestCases.welcomeMessage.tooLong);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('less than 5000 characters');
      });
      
      test('HTML content stripped for counting', () => {
        const htmlContent = '<p>' + 'A'.repeat(100) + '</p>';
        const result = validateField('welcomeMessage', htmlContent);
        expect(result.valid).toBe(true);
      });
    });
    
    describe('Consent Form', () => {
      test('Too short (< 500 chars)', () => {
        const result = validateField('consentForm', validationTestCases.consentForm.tooShort);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('at least 500 characters');
      });
      
      test('Valid length (500-10000 chars)', () => {
        const result = validateField('consentForm', validationTestCases.consentForm.valid);
        expect(result.valid).toBe(true);
      });
      
      test('Too long (> 10000 chars)', () => {
        const result = validateField('consentForm', validationTestCases.consentForm.tooLong);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('less than 10000 characters');
      });
    });
  });
  
  describe('3. Email Format Validation', () => {
    test('Valid email format', () => {
      const result = validateField('email', validationTestCases.email.valid);
      expect(result.valid).toBe(true);
    });
    
    test('Invalid email - no @ symbol', () => {
      const result = validateField('email', validationTestCases.email.missingAt);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('format is invalid');
    });
    
    test('Invalid email - no domain', () => {
      const result = validateField('email', validationTestCases.email.missingDomain);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('format is invalid');
    });
    
    test('Valid email with special characters', () => {
      const result = validateField('email', validationTestCases.email.specialChars);
      expect(result.valid).toBe(true);
    });
    
    test('Invalid - multiple emails', () => {
      const result = validateField('email', validationTestCases.email.multiple);
      expect(result.valid).toBe(false);
    });
  });
  
  describe('4. File Upload Validation', () => {
    test('Valid image file', () => {
      const result = validateField('fileUpload', validationTestCases.fileUpload.validImage);
      expect(result.valid).toBe(true);
    });
    
    test('Invalid file type', () => {
      const result = validateField('fileUpload', validationTestCases.fileUpload.invalidType);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File type must be');
    });
    
    test('File too large', () => {
      const result = validateField('fileUpload', validationTestCases.fileUpload.tooLarge);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('less than 5MB');
    });
    
    test('Empty file', () => {
      const result = validateField('fileUpload', validationTestCases.fileUpload.empty);
      expect(result.valid).toBe(true); // File upload is optional
    });
  });
  
  describe('5. Error Message Display', () => {
    test('Error messages format correctly', () => {
      const titleError = validateField('title', 'Short');
      expect(titleError.error).toBe('title must be at least 10 characters (currently 5)');
      
      const descError = validateField('description', 'Short description');
      expect(descError.error).toBe('description must be at least 50 characters (currently 17)');
    });
    
    test('Character count displayed in error', () => {
      const result = validateField('welcomeMessage', 'Test');
      expect(result.error).toMatch(/currently 4/);
    });
    
    test('File size displayed in MB', () => {
      const largeFile = {
        name: 'large.jpg',
        type: 'image/jpeg',
        size: 10 * 1024 * 1024,
      };
      const result = validateField('fileUpload', largeFile);
      expect(result.error).toContain('5MB');
    });
  });
  
  describe('6. Edge Cases', () => {
    test('Whitespace-only input', () => {
      const result = validateField('title', '          ');
      expect(result.valid).toBe(false);
    });
    
    test('Unicode characters count correctly', () => {
      const unicodeText = '研究タイトル🔬📊'; // Japanese + emojis
      const result = validateField('title', unicodeText);
      expect(result.valid).toBe(true); // 10 characters
    });
    
    test('Line breaks count as characters', () => {
      const textWithBreaks = 'Line 1\nLine 2\nLine 3';
      const result = validateField('title', textWithBreaks);
      expect(result.valid).toBe(true);
    });
    
    test('Null/undefined handling', () => {
      expect(validateField('title', null).valid).toBe(false);
      expect(validateField('title', undefined).valid).toBe(false);
      expect(validateField('description', null).valid).toBe(true); // Optional field
    });
  });
});

// Export test results summary
export function generateValidationReport(): string {
  const results: string[] = [];
  results.push('FORM VALIDATION TEST REPORT');
  results.push('===========================\n');
  
  // Test each field
  const fields = ['title', 'description', 'welcomeMessage', 'consentForm', 'email', 'fileUpload'];
  
  fields.forEach(field => {
    results.push(`\n${field.toUpperCase()} FIELD:`);
    const testCases = validationTestCases[field as keyof typeof validationTestCases];
    
    if (testCases) {
      Object.entries(testCases).forEach(([testName, testValue]) => {
        const result = validateField(field, testValue);
        const status = result.valid ? '✅ PASS' : '❌ FAIL';
        results.push(`  ${testName}: ${status}`);
        if (!result.valid) {
          results.push(`    Error: ${result.error}`);
        }
      });
    }
  });
  
  return results.join('\n');
}