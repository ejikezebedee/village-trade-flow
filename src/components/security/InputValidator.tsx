import React from 'react';
import { z } from 'zod';

// D) Input Validation & XSS/Injection Defense - Centralized validation schemas

export const ProductCreateSchema = z.object({
  name: z.string()
    .min(1, 'Product name is required')
    .max(100, 'Product name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Product name contains invalid characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  price: z.number()
    .min(0.01, 'Price must be greater than 0')
    .max(100000, 'Price is too high'),
  category: z.string()
    .min(1, 'Category is required')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Category contains invalid characters'),
  tags: z.array(z.string().regex(/^[a-zA-Z0-9\s\-_]+$/, 'Tag contains invalid characters')).optional(),
  stock_quantity: z.number().int().min(0, 'Stock cannot be negative')
});

export const MessageCreateSchema = z.object({
  content: z.string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message is too long')
    .regex(/^[^<>{}]*$/, 'Message contains invalid characters'),
  recipient_id: z.string().uuid('Invalid recipient ID')
});

export const ProfileUpdateSchema = z.object({
  display_name: z.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Display name contains invalid characters')
    .optional(),
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .regex(/^[^<>{}]*$/, 'Bio contains invalid characters')
    .optional(),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional(),
  address: z.string()
    .max(200, 'Address must be less than 200 characters')
    .regex(/^[a-zA-Z0-9\s\-,._]+$/, 'Address contains invalid characters')
    .optional()
});

export const ApiKeyCreateSchema = z.object({
  key_name: z.string()
    .min(3, 'Key name must be at least 3 characters')
    .max(50, 'Key name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_\-]+$/, 'Key name can only contain letters, numbers, hyphens, and underscores'),
  description: z.string()
    .max(200, 'Description must be less than 200 characters')
    .regex(/^[^<>{}]*$/, 'Description contains invalid characters')
    .optional()
});

export const PayPalOrderSchema = z.object({
  order_id: z.string()
    .min(1, 'Order ID is required')
    .regex(/^[A-Z0-9]+$/, 'Invalid PayPal order ID format'),
  amount: z.number()
    .min(0.01, 'Amount must be greater than 0')
    .max(10000, 'Amount exceeds maximum allowed'),
  currency: z.string()
    .length(3, 'Currency must be 3 characters')
    .regex(/^[A-Z]{3}$/, 'Invalid currency format')
});

// Utility functions for sanitization
export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>{}]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

// XSS test payloads for testing
export const XSS_TEST_PAYLOADS = [
  '<script>alert("xss")</script>',
  'javascript:alert("xss")',
  '<img src="x" onerror="alert(\'xss\')" />',
  '<svg onload="alert(\'xss\')" />',
  '"><script>alert("xss")</script>',
  "'; DROP TABLE users; --",
  "1' OR '1'='1",
  "<iframe src='javascript:alert(\"xss\")'></iframe>"
];

// SQL injection test payloads
export const SQL_INJECTION_TEST_PAYLOADS = [
  "'; DROP TABLE users; --",
  "1' OR '1'='1",
  "1' UNION SELECT * FROM users --",
  "admin'--",
  "admin'/*",
  "' OR 1=1#",
  "' OR 1=1/*"
];

interface InputValidatorProps {
  children: React.ReactNode;
  schema: z.ZodSchema;
  data: any;
  onValidationError?: (errors: z.ZodError) => void;
  onSuccess?: (validatedData: any) => void;
}

export const InputValidator: React.FC<InputValidatorProps> = ({
  children,
  schema,
  data,
  onValidationError,
  onSuccess
}) => {
  const validate = () => {
    try {
      const validatedData = schema.parse(data);
      onSuccess?.(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        onValidationError?.(error);
      }
    }
  };

  return (
    <div data-validation="enabled">
      {children}
    </div>
  );
};

export default InputValidator;