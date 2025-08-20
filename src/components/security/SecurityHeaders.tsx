import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

// H) HTTP Security Headers & CSRF Protection

interface SecurityHeadersProps {
  nonce?: string;
  reportUri?: string;
}

export const SecurityHeaders: React.FC<SecurityHeadersProps> = ({ 
  nonce, 
  reportUri = '/api/csp-report' 
}) => {
  // Environment-aware CSP policy
  const isDevelopment = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  const cspPolicy = [
    "default-src 'self'",
    isDevelopment 
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.paypal.com https://www.sandbox.paypal.com"
      : "script-src 'self' https://js.stripe.com https://www.paypal.com https://www.sandbox.paypal.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.stripe.com https://api-m.sandbox.paypal.com https://api-m.paypal.com https://*.supabase.co",
    isDevelopment 
      ? "frame-src 'self' https://js.stripe.com https://www.paypal.com https://www.sandbox.paypal.com http://localhost:* https://*.lovable.app"
      : "frame-src 'self' https://js.stripe.com https://www.paypal.com https://www.sandbox.paypal.com",
    "object-src 'none'",
    "base-uri 'self'",
    isDevelopment ? "" : "upgrade-insecure-requests",
    `report-uri ${reportUri}`
  ].filter(Boolean).join('; ');

  return (
    <Helmet>
      {/* Content Security Policy */}
      <meta httpEquiv="Content-Security-Policy" content={cspPolicy} />
      
      {/* HTTP Strict Transport Security */}
      <meta httpEquiv="Strict-Transport-Security" content="max-age=31536000; includeSubDomains" />
      
      {/* X-Content-Type-Options */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      
      {/* X-Frame-Options */}
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      
      {/* X-XSS-Protection */}
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      
      {/* Referrer Policy */}
      <meta name="referrer" content="strict-origin-when-cross-origin" />
      
      {/* Permissions Policy */}
      <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=(), payment=()" />
      
      {/* Cross-Origin-Embedder-Policy */}
      <meta httpEquiv="Cross-Origin-Embedder-Policy" content="require-corp" />
      
      {/* Cross-Origin-Opener-Policy */}
      <meta httpEquiv="Cross-Origin-Opener-Policy" content="same-origin" />
      
      {/* Cross-Origin-Resource-Policy */}
      <meta httpEquiv="Cross-Origin-Resource-Policy" content="same-origin" />
    </Helmet>
  );
};

// CSRF Token Hook
export const useCSRFToken = () => {
  const [csrfToken, setCSRFToken] = React.useState<string>('');

  useEffect(() => {
    // Generate CSRF token
    const token = generateCSRFToken();
    setCSRFToken(token);
    
    // Store in session storage
    sessionStorage.setItem('csrf_token', token);
  }, []);

  return csrfToken;
};

// CSRF Token Generation
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// CSRF Token Validation
export const validateCSRFToken = (providedToken: string): boolean => {
  const storedToken = sessionStorage.getItem('csrf_token');
  return storedToken === providedToken && providedToken.length === 64;
};

// CSRF Protected Form Component
interface CSRFProtectedFormProps {
  children: React.ReactNode;
  onSubmit: (event: React.FormEvent<HTMLFormElement>, csrfToken: string) => void;
  className?: string;
  [key: string]: any;
}

export const CSRFProtectedForm: React.FC<CSRFProtectedFormProps> = ({
  children,
  onSubmit,
  ...props
}) => {
  const csrfToken = useCSRFToken();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validateCSRFToken(csrfToken)) {
      onSubmit(event, csrfToken);
    } else {
      console.error('CSRF token validation failed');
      alert('Security error: Invalid form submission');
    }
  };

  return (
    <form {...props} onSubmit={handleSubmit}>
      <input type="hidden" name="csrf_token" value={csrfToken} />
      {children}
    </form>
  );
};

export default SecurityHeaders;