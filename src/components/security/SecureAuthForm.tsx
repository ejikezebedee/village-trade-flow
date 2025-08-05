import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { validateEmail, validatePassword, sanitizeInput } from '@/components/security/InputSanitizer';
import RateLimiter, { useRateLimit } from '@/components/security/RateLimiter';
import { supabase } from '@/integrations/supabase/client';

interface SecureAuthFormProps {
  mode: 'signin' | 'signup';
  onSubmit: (data: any) => Promise<void>;
  onModeChange: (mode: 'signin' | 'signup') => void;
}

const SecureAuthForm: React.FC<SecureAuthFormProps> = ({
  mode,
  onSubmit,
  onModeChange
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    userType: 'buyer'
  });
  const [passwordValidation, setPasswordValidation] = useState({
    isValid: false,
    errors: []
  });

  // Rate limiting based on IP (simplified - in production use actual IP)
  const clientIP = 'user_session'; // In production, get actual IP
  const { 
    isBlocked, 
    recordAttempt, 
    attemptsLeft 
  } = useRateLimit(
    `auth_${mode}_${clientIP}`,
    5, // Max 5 attempts
    10 * 60 * 1000, // 10 minute window
    30 * 60 * 1000 // 30 minute block
  );

  const handleInputChange = (field: string, value: string) => {
    // Sanitize input
    const sanitizedValue = sanitizeInput(value, {
      maxLength: field === 'email' ? 254 : 128,
      stripSpecialChars: field !== 'password'
    });

    setFormData(prev => ({
      ...prev,
      [field]: sanitizedValue
    }));

    // Real-time password validation
    if (field === 'password') {
      const validation = validatePassword(sanitizedValue);
      setPasswordValidation(validation);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isBlocked) {
      toast({
        title: "Account Temporarily Locked",
        description: "Too many failed attempts. Please try again later.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Enhanced input sanitization
      const sanitizedData = {
        email: sanitizeInput(formData.email, { stripSpecialChars: false, maxLength: 254 }).toLowerCase(),
        password: formData.password, // Don't sanitize passwords as they may contain special chars
        firstName: formData.firstName ? sanitizeInput(formData.firstName, { stripSpecialChars: true, maxLength: 50 }) : '',
        lastName: formData.lastName ? sanitizeInput(formData.lastName, { stripSpecialChars: true, maxLength: 50 }) : '',
        userType: formData.userType,
        confirmPassword: formData.confirmPassword
      };

      // Enhanced email validation
      if (!validateEmail(sanitizedData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // For signup, check password against breach database
      if (mode === 'signup') {
        // Check password strength
        if (!passwordValidation.isValid) {
          throw new Error('Password does not meet security requirements');
        }

        // Additional security checks for admin accounts
        if (sanitizedData.userType === 'admin') {
          throw new Error('Admin accounts cannot be created through this form. Contact system administrator.');
        }

        // Check password against known breaches with enhanced security
        try {
          const { data: breachCheck, error: breachError } = await supabase.functions.invoke('password-security', {
            body: {
              password: sanitizedData.password,
              action: 'check_breach',
              email: sanitizedData.email // For additional context
            }
          });

          if (breachError) {
            console.warn('Password breach check failed:', breachError);
            // Continue without blocking if service is unavailable
          } else if (breachCheck?.isBreached) {
            throw new Error(`This password has been found in ${breachCheck.breachCount} data breaches. Please choose a different password.`);
          }
        } catch (breachError) {
          console.warn('Password breach check failed:', breachError);
          // Continue with signup if breach check fails (fail open)
        }

        // Confirm password match for signup
        if (sanitizedData.password !== sanitizedData.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        // Validate required fields for signup
        if (!sanitizedData.firstName.trim() || !sanitizedData.lastName.trim()) {
          throw new Error('First name and last name are required');
        }
      }

      // Submit form with sanitized data
      await onSubmit(sanitizedData);
      
      // Record successful attempt
      recordAttempt(true);

    } catch (error: any) {
      // Record failed attempt
      recordAttempt(false);
      
      // Log security events for failed attempts
      if (mode === 'signin' && error.message.includes('Invalid')) {
        // Create security alert for repeated failed login attempts
        supabase.functions.invoke('send-security-alert', {
          body: {
            alert_type: 'login_failure',
            severity: 'medium',
            title: 'Failed Login Attempt',
            message: `Failed login attempt for email: ${formData.email}`,
            metadata: { 
              email: formData.email, 
              timestamp: new Date().toISOString(),
              userAgent: navigator.userAgent
            }
          }
        }).catch(console.error); // Don't block UI for logging
      }
      
      toast({
        title: "Authentication Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isBlocked) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Shield className="h-12 w-12 mx-auto text-destructive" />
            <div>
              <h3 className="text-lg font-semibold">Account Protection Active</h3>
              <p className="text-sm text-muted-foreground">
                Too many failed attempts. Please try again later.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <RateLimiter 
      identifier={`auth_${mode}_${clientIP}`}
      maxAttempts={5}
      windowMs={10 * 60 * 1000}
      blockDurationMs={30 * 60 * 1000}
    >
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </CardTitle>
          <CardDescription className="text-center">
            {mode === 'signin' 
              ? 'Welcome back to VillageMarket' 
              : 'Join VillageMarket today'
            }
          </CardDescription>
          {attemptsLeft <= 2 && attemptsLeft > 0 && (
            <Alert variant="default">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                      maxLength={50}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                      maxLength={50}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="userType">Account Type</Label>
                  <select 
                    id="userType"
                    value={formData.userType}
                    onChange={(e) => handleInputChange('userType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                    <option value="driver">Driver</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                autoComplete="email"
                maxLength={254}
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  autoComplete={mode === 'signin' ? "current-password" : "new-password"}
                  maxLength={128}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    required
                    autoComplete="new-password"
                    maxLength={128}
                  />
                </div>

                {/* Password Requirements */}
                {formData.password && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Password Requirements:</h4>
                    <div className="grid grid-cols-1 gap-1 text-xs">
                      {[
                        { label: 'At least 8 characters', check: formData.password.length >= 8 },
                        { label: 'Uppercase letter', check: /[A-Z]/.test(formData.password) },
                        { label: 'Lowercase letter', check: /[a-z]/.test(formData.password) },
                        { label: 'Number', check: /\d/.test(formData.password) },
                        { label: 'Special character', check: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) }
                      ].map((req, index) => (
                        <div key={index} className="flex items-center gap-2">
                          {req.check ? (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-3 w-3 text-gray-400" />
                          )}
                          <span className={req.check ? 'text-green-600' : 'text-gray-500'}>
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || (mode === 'signup' && !passwordValidation.isValid)}
            >
              {loading ? 'Processing...' : (mode === 'signin' ? 'Sign In' : 'Create Account')}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => onModeChange(mode === 'signin' ? 'signup' : 'signin')}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                {mode === 'signin' 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"
                }
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </RateLimiter>
  );
};

export default SecureAuthForm;