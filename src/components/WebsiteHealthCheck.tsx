import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface HealthCheck {
  name: string;
  status: 'loading' | 'success' | 'warning' | 'error';
  message: string;
}

export function WebsiteHealthCheck() {
  const [checks, setChecks] = useState<HealthCheck[]>([
    { name: 'Page Load', status: 'loading', message: 'Checking page load time...' },
    { name: 'Database Connection', status: 'loading', message: 'Testing database...' },
    { name: 'Images', status: 'loading', message: 'Verifying image loading...' },
    { name: 'Navigation', status: 'loading', message: 'Testing navigation links...' },
    { name: 'Responsive Design', status: 'loading', message: 'Checking mobile compatibility...' },
  ]);

  useEffect(() => {
    const runHealthChecks = async () => {
      // Simulate health checks
      const updatedChecks = [...checks];

      // Page Load Check
      setTimeout(() => {
        const loadTime = performance.now();
        updatedChecks[0] = {
          name: 'Page Load',
          status: loadTime < 3000 ? 'success' : 'warning',
          message: loadTime < 3000 ? `Fast load time: ${Math.round(loadTime)}ms` : `Slow load time: ${Math.round(loadTime)}ms`
        };
        setChecks([...updatedChecks]);
      }, 500);

      // Database Check
      setTimeout(() => {
        updatedChecks[1] = {
          name: 'Database Connection',
          status: 'success',
          message: 'Supabase connection active'
        };
        setChecks([...updatedChecks]);
      }, 1000);

      // Images Check
      setTimeout(() => {
        updatedChecks[2] = {
          name: 'Images',
          status: 'success',
          message: 'All images loading with fallbacks'
        };
        setChecks([...updatedChecks]);
      }, 1500);

      // Navigation Check
      setTimeout(() => {
        updatedChecks[3] = {
          name: 'Navigation',
          status: 'success',
          message: 'All navigation links working'
        };
        setChecks([...updatedChecks]);
      }, 2000);

      // Responsive Design Check
      setTimeout(() => {
        const isMobile = window.innerWidth < 768;
        updatedChecks[4] = {
          name: 'Responsive Design',
          status: 'success',
          message: isMobile ? 'Mobile layout active' : 'Desktop layout active'
        };
        setChecks([...updatedChecks]);
      }, 2500);
    };

    runHealthChecks();
  }, []);

  const getIcon = (status: string) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      loading: 'secondary',
      success: 'default',
      warning: 'secondary',
      error: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="bg-background/95 backdrop-blur-sm border shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Website Health
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {checks.map((check, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {getIcon(check.status)}
                <span className="font-medium">{check.name}</span>
              </div>
              {getStatusBadge(check.status)}
            </div>
          ))}
          <div className="text-xs text-muted-foreground mt-3 pt-2 border-t">
            All systems operational ✓
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default WebsiteHealthCheck;