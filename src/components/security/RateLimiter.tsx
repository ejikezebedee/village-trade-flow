import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Clock, AlertTriangle } from 'lucide-react';

interface RateLimitState {
  attempts: number;
  lastAttempt: number;
  blockedUntil?: number;
}

interface RateLimiterProps {
  identifier: string; // Usually IP address or user ID
  maxAttempts: number;
  windowMs: number; // Time window in milliseconds
  blockDurationMs: number; // How long to block after max attempts
  onRateLimited?: (blockedUntil: number) => void;
  children: React.ReactNode;
}

// Simple in-memory store (in production, use Redis or database)
const rateLimitStore = new Map<string, RateLimitState>();

export const useRateLimit = (
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 10 * 60 * 1000, // 10 minutes
  blockDurationMs: number = 30 * 60 * 1000 // 30 minutes
) => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(maxAttempts);

  const checkRateLimit = (): boolean => {
    const now = Date.now();
    const key = `rate_limit_${identifier}`;
    const current = rateLimitStore.get(key);

    if (!current) {
      rateLimitStore.set(key, {
        attempts: 0,
        lastAttempt: now
      });
      setAttemptsLeft(maxAttempts);
      return true;
    }

    // Check if still blocked
    if (current.blockedUntil && now < current.blockedUntil) {
      setIsBlocked(true);
      setRemainingTime(Math.ceil((current.blockedUntil - now) / 1000));
      return false;
    }

    // Reset if window has passed
    if (now - current.lastAttempt > windowMs) {
      rateLimitStore.set(key, {
        attempts: 0,
        lastAttempt: now
      });
      setIsBlocked(false);
      setAttemptsLeft(maxAttempts);
      return true;
    }

    setAttemptsLeft(Math.max(0, maxAttempts - current.attempts));
    return current.attempts < maxAttempts;
  };

  const recordAttempt = (success: boolean = false): boolean => {
    const now = Date.now();
    const key = `rate_limit_${identifier}`;
    const current = rateLimitStore.get(key) || { attempts: 0, lastAttempt: now };

    if (success) {
      // Reset on successful attempt
      rateLimitStore.set(key, {
        attempts: 0,
        lastAttempt: now
      });
      setIsBlocked(false);
      setAttemptsLeft(maxAttempts);
      return true;
    }

    // Increment failed attempts
    const newAttempts = current.attempts + 1;
    const newState: RateLimitState = {
      attempts: newAttempts,
      lastAttempt: now
    };

    if (newAttempts >= maxAttempts) {
      newState.blockedUntil = now + blockDurationMs;
      setIsBlocked(true);
      setRemainingTime(Math.ceil(blockDurationMs / 1000));
    }

    rateLimitStore.set(key, newState);
    setAttemptsLeft(Math.max(0, maxAttempts - newAttempts));
    
    return newAttempts < maxAttempts;
  };

  useEffect(() => {
    checkRateLimit();
  }, [identifier]);

  useEffect(() => {
    if (isBlocked && remainingTime > 0) {
      const timer = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            setIsBlocked(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isBlocked, remainingTime]);

  return {
    isBlocked,
    remainingTime,
    attemptsLeft,
    checkRateLimit,
    recordAttempt
  };
};

export const RateLimiter: React.FC<RateLimiterProps> = ({
  identifier,
  maxAttempts,
  windowMs,
  blockDurationMs,
  onRateLimited,
  children
}) => {
  const { isBlocked, remainingTime, attemptsLeft } = useRateLimit(
    identifier,
    maxAttempts,
    windowMs,
    blockDurationMs
  );

  useEffect(() => {
    if (isBlocked && onRateLimited) {
      onRateLimited(Date.now() + remainingTime * 1000);
    }
  }, [isBlocked, remainingTime, onRateLimited]);

  if (isBlocked) {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;

    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Too many failed attempts. Please try again in {minutes > 0 && `${minutes}m `}{seconds}s.
          </AlertDescription>
        </Alert>
        <div className="text-center text-muted-foreground">
          <Shield className="h-8 w-8 mx-auto mb-2" />
          <p>Security protection is active</p>
        </div>
      </div>
    );
  }

  if (attemptsLeft <= 2 && attemptsLeft > 0) {
    return (
      <div className="space-y-4">
        <Alert variant="default">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining before temporary lockout.
          </AlertDescription>
        </Alert>
        {children}
      </div>
    );
  }

  return <>{children}</>;
};

export default RateLimiter;