import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/SecureAuthProvider';
import { Navigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, Clock } from 'lucide-react';
import TwoFactorVerification from '@/components/auth/TwoFactorVerification';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { user, profile, loading } = useAuth();
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorVerified, setTwoFactorVerified] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check if admin needs 2FA verification
    if (profile?.user_role === 'admin') {
      const lastVerified = profile.two_factor_last_verified_at;
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      if (!profile.two_factor_enabled || !lastVerified || new Date(lastVerified) < oneHourAgo) {
        setShowTwoFactor(true);
        setTwoFactorVerified(false);
      } else {
        setTwoFactorVerified(true);
      }
    }
  }, [profile]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Not admin role
  if (profile?.user_role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have administrator privileges to access this area.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.history.back()} 
              className="w-full"
              variant="outline"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin but 2FA not enabled
  if (!profile.two_factor_enabled) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <CardTitle>Two-Factor Authentication Required</CardTitle>
            <CardDescription>
              Admin accounts must have 2FA enabled for security. Please set up TOTP authentication.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = '/settings/security'} 
              className="w-full"
            >
              Set Up 2FA
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin but needs 2FA verification
  if (showTwoFactor && !twoFactorVerified) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle>Security Verification Required</CardTitle>
            <CardDescription>
              Please verify your identity with 2FA to access admin features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TwoFactorVerification
              userId={user.id}
              userEmail={user.email || ''}
              onVerificationComplete={() => {
                setTwoFactorVerified(true);
                setShowTwoFactor(false);
              }}
              onCancel={() => window.history.back()}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // All checks passed - render admin content
  return <>{children}</>;
};