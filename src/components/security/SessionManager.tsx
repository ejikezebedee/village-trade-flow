import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// G) Session & Token Hardening - Enhanced session management

interface SessionManagerProps {
  children: React.ReactNode;
  idleTimeoutMinutes?: number;
  maxSessionHours?: number;
}

export const SessionManager: React.FC<SessionManagerProps> = ({
  children,
  idleTimeoutMinutes = 30,
  maxSessionHours = 24
}) => {
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [sessionStartTime] = useState<number>(Date.now());
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const { toast } = useToast();

  const handleSessionExpiry = useCallback(async () => {
    setIsSessionExpired(true);
    await supabase.auth.signOut();
    
    toast({
      title: "Session Expired",
      description: "Your session has expired for security reasons. Please log in again.",
      variant: "destructive"
    });
  }, [toast]);

  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  const checkSessionValidity = useCallback(() => {
    const now = Date.now();
    const idleTime = now - lastActivity;
    const sessionTime = now - sessionStartTime;

    // Check idle timeout (30 minutes)
    if (idleTime > idleTimeoutMinutes * 60 * 1000) {
      handleSessionExpiry();
      return;
    }

    // Check absolute session timeout (24 hours)
    if (sessionTime > maxSessionHours * 60 * 60 * 1000) {
      handleSessionExpiry();
      return;
    }
  }, [lastActivity, sessionStartTime, idleTimeoutMinutes, maxSessionHours, handleSessionExpiry]);

  useEffect(() => {
    // Activity listeners
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // Session check interval (every minute)
    const sessionCheckInterval = setInterval(checkSessionValidity, 60000);

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
      clearInterval(sessionCheckInterval);
    };
  }, [updateActivity, checkSessionValidity]);

  // Session warning before expiry
  useEffect(() => {
    const warningTime = (idleTimeoutMinutes - 5) * 60 * 1000; // 5 minutes before expiry
    const warningTimeout = setTimeout(() => {
      const timeLeft = Math.ceil((idleTimeoutMinutes * 60 * 1000 - (Date.now() - lastActivity)) / 60000);
      
      if (timeLeft > 0 && timeLeft <= 5) {
        toast({
          title: "Session Warning",
          description: `Your session will expire in ${timeLeft} minute(s). Click anywhere to extend.`,
          variant: "default"
        });
      }
    }, warningTime);

    return () => clearTimeout(warningTimeout);
  }, [lastActivity, idleTimeoutMinutes, toast]);

  if (isSessionExpired) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Session Expired</h2>
          <p className="text-muted-foreground mb-4">
            Your session has expired for security reasons.
          </p>
          <button 
            onClick={() => window.location.href = '/auth'}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Log In Again
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Hook for session information
export const useSessionInfo = () => {
  const [sessionInfo, setSessionInfo] = useState({
    isActive: false,
    timeRemaining: 0,
    lastActivity: 0
  });

  useEffect(() => {
    const updateSessionInfo = () => {
      const lastActivity = parseInt(localStorage.getItem('lastActivity') || '0');
      const now = Date.now();
      const timeRemaining = Math.max(0, 30 * 60 * 1000 - (now - lastActivity));
      
      setSessionInfo({
        isActive: timeRemaining > 0,
        timeRemaining,
        lastActivity
      });
    };

    updateSessionInfo();
    const interval = setInterval(updateSessionInfo, 1000);

    return () => clearInterval(interval);
  }, []);

  return sessionInfo;
};

// Secure cookie utilities
export const setSecureCookie = (name: string, value: string, days: number = 1) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Strict; Secure; HttpOnly`;
};

export const getSecureCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  
  return null;
};

export const deleteSecureCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict; Secure;`;
};

export default SessionManager;