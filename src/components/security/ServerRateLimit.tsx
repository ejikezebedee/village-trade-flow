import React from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RateLimitOptions {
  identifier: string;
  action: string;
  maxAttempts?: number;
  windowMinutes?: number;
}

interface RateLimitResult {
  allowed: boolean;
  blocked: boolean;
  blocked_until?: string;
  attempts_remaining?: number;
}

export class ServerRateLimit {
  static async checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
    try {
      const { data, error } = await supabase.functions.invoke('server-rate-limit', {
        body: {
          identifier: options.identifier,
          action: options.action,
          maxAttempts: options.maxAttempts || 5,
          windowMinutes: options.windowMinutes || 10,
        },
      });

      if (error) {
        console.error('Server rate limit error:', error);
        // Fail open for availability, but log the error
        return { allowed: true, blocked: false };
      }

      return data as RateLimitResult;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Fail open for availability
      return { allowed: true, blocked: false };
    }
  }

  static async checkAuthRateLimit(action: 'login' | 'signup' | 'password_reset', identifier?: string): Promise<RateLimitResult> {
    const userId = identifier || this.getClientIdentifier();
    
    const limits = {
      login: { maxAttempts: 5, windowMinutes: 15 },
      signup: { maxAttempts: 3, windowMinutes: 60 },
      password_reset: { maxAttempts: 3, windowMinutes: 30 },
    };

    return this.checkRateLimit({
      identifier: userId,
      action: `auth_${action}`,
      ...limits[action],
    });
  }

  static async checkApiRateLimit(endpoint: string, identifier?: string): Promise<RateLimitResult> {
    const userId = identifier || this.getClientIdentifier();
    
    return this.checkRateLimit({
      identifier: userId,
      action: `api_${endpoint}`,
      maxAttempts: 100,
      windowMinutes: 60,
    });
  }

  private static getClientIdentifier(): string {
    // Generate a stable client identifier based on user session or IP
    if (typeof window !== 'undefined') {
      let identifier = localStorage.getItem('client_id');
      if (!identifier) {
        identifier = 'client_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('client_id', identifier);
      }
      return identifier;
    }
    return 'unknown_client';
  }
}

// React hook for easy rate limiting in components
export function useServerRateLimit() {
  const checkRateLimit = async (options: RateLimitOptions): Promise<RateLimitResult> => {
    return ServerRateLimit.checkRateLimit(options);
  };

  const checkAuthRateLimit = async (action: 'login' | 'signup' | 'password_reset', identifier?: string): Promise<RateLimitResult> => {
    return ServerRateLimit.checkAuthRateLimit(action, identifier);
  };

  const checkApiRateLimit = async (endpoint: string, identifier?: string): Promise<RateLimitResult> => {
    return ServerRateLimit.checkApiRateLimit(endpoint, identifier);
  };

  return {
    checkRateLimit,
    checkAuthRateLimit,
    checkApiRateLimit,
  };
}

// Higher-order component for rate limiting protection
interface WithRateLimitProps {
  rateLimitKey?: string;
  rateLimitAction?: string;
  maxAttempts?: number;
  windowMinutes?: number;
  onRateLimited?: (result: RateLimitResult) => void;
}

export function withRateLimit<P extends object>(
  Component: React.ComponentType<P>,
  defaultOptions: WithRateLimitProps = {}
) {
  return function RateLimitedComponent(props: P & WithRateLimitProps) {
    const {
      rateLimitKey = 'default',
      rateLimitAction = 'action',
      maxAttempts = 10,
      windowMinutes = 60,
      onRateLimited,
      ...componentProps
    } = { ...defaultOptions, ...props };

    const [isRateLimited, setIsRateLimited] = React.useState(false);
    const [rateLimitResult, setRateLimitResult] = React.useState<RateLimitResult | null>(null);
    const { checkRateLimit } = useServerRateLimit();

    const handleAction = React.useCallback(async () => {
      const result = await checkRateLimit({
        identifier: rateLimitKey,
        action: rateLimitAction,
        maxAttempts,
        windowMinutes,
      });

      setRateLimitResult(result);
      setIsRateLimited(result.blocked);

      if (result.blocked && onRateLimited) {
        onRateLimited(result);
      }

      return result;
    }, [rateLimitKey, rateLimitAction, maxAttempts, windowMinutes, onRateLimited, checkRateLimit]);

    if (isRateLimited) {
      const blockedUntil = rateLimitResult?.blocked_until 
        ? new Date(rateLimitResult.blocked_until).toLocaleString()
        : 'Unknown';

      return (
        <div className="p-4 border border-destructive rounded-md bg-destructive/10">
          <h3 className="font-semibold text-destructive">Rate Limited</h3>
          <p className="text-sm text-muted-foreground">
            Too many attempts. Please try again after {blockedUntil}.
          </p>
        </div>
      );
    }

    return <Component {...(componentProps as P)} onAction={handleAction} />;
  };
}

export default ServerRateLimit;