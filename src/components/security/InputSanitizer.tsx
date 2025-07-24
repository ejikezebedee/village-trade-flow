import React from 'react';
import DOMPurify from 'dompurify';

interface InputSanitizerProps {
  children: React.ReactNode;
  enableXSSProtection?: boolean;
  allowedTags?: string[];
}

// Security utility functions
export const sanitizeInput = (input: string, options: {
  allowHtml?: boolean;
  maxLength?: number;
  stripSpecialChars?: boolean;
} = {}): string => {
  if (!input) return '';
  
  let sanitized = input;
  
  // Remove potentially dangerous characters
  if (options.stripSpecialChars) {
    sanitized = sanitized.replace(/[<>\"'&]/g, '');
  }
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length
  if (options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }
  
  // HTML sanitization if HTML is allowed
  if (options.allowHtml) {
    sanitized = DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: []
    });
  } else {
    // Strip all HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }
  
  return sanitized;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  if (password.length > 128) {
    errors.push('Password cannot exceed 128 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const sanitizeFileName = (fileName: string): string => {
  // Remove path traversal attempts and dangerous characters
  return fileName
    .replace(/[^a-zA-Z0-9.\-_]/g, '')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255);
};

export const validateFileUpload = (file: File): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain'
  ];
  
  if (file.size > maxSize) {
    errors.push('File size cannot exceed 10MB');
  }
  
  if (!allowedTypes.includes(file.type)) {
    errors.push('File type not allowed');
  }
  
  const sanitizedName = sanitizeFileName(file.name);
  if (sanitizedName !== file.name) {
    errors.push('File name contains invalid characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// SQL Injection prevention for search terms
export const sanitizeSearchTerm = (term: string): string => {
  return term
    .replace(/['"`;\\]/g, '') // Remove SQL special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, 100); // Limit length
};

// XSS Protection wrapper component
export const InputSanitizer: React.FC<InputSanitizerProps> = ({ 
  children, 
  enableXSSProtection = true 
}) => {
  if (!enableXSSProtection) {
    return <>{children}</>;
  }
  
  // This component serves as a wrapper to remind developers
  // to sanitize inputs. The actual sanitization happens in the utility functions.
  return <>{children}</>;
};

export default InputSanitizer;