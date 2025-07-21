import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requireVerification?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  requireVerification = false 
}) => {
  const { user, profile, loading, hasRole, isVerified } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Setting up your profile...</h2>
          <p className="text-muted-foreground">Please wait while we create your account.</p>
        </div>
      </div>
    );
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            You don't have permission to access this page. Required role: {requiredRole}
          </p>
          <p className="text-sm text-muted-foreground">
            Your current role: {profile.user_type}
          </p>
        </div>
      </div>
    );
  }

  if (requireVerification && !isVerified()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2">Verification Required</h2>
          <p className="text-muted-foreground mb-4">
            Your account needs to be verified before you can access this feature.
          </p>
          <p className="text-sm text-muted-foreground">
            Current status: {profile.verification_status}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};