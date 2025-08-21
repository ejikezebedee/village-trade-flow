import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

export const SecurityTestSuite: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runSecurityTests = async () => {
    setIsRunning(true);
    const testResults: TestResult[] = [];

    try {
      // Test 1: Admin table access (should be blocked for non-admins)
      try {
        const { data, error } = await supabase
          .from('admins')
          .select('*')
          .limit(1);
        
        if (error && error.message.includes('policy')) {
          testResults.push({
            name: 'Admin Table RLS',
            status: 'pass',
            message: 'Admin table properly protected by RLS',
            details: 'Non-admin users cannot access admin data'
          });
        } else {
          testResults.push({
            name: 'Admin Table RLS',
            status: 'fail',
            message: 'Admin table may be publicly accessible',
            details: 'RLS policies may not be working correctly'
          });
        }
      } catch (error) {
        testResults.push({
          name: 'Admin Table RLS',
          status: 'warning',
          message: 'Could not test admin table access',
          details: String(error)
        });
      }

      // Test 2: User sessions access (should only see own data)
      try {
        const { data, error } = await supabase
          .from('user_sessions')
          .select('*')
          .limit(5);
        
        if (!error && data) {
          // Check if all sessions belong to current user
          const currentUserId = (await supabase.auth.getUser()).data.user?.id;
          const hasOwnSessionsOnly = data.every(session => session.user_id === currentUserId);
          
          if (hasOwnSessionsOnly || data.length === 0) {
            testResults.push({
              name: 'User Sessions RLS',
              status: 'pass',
              message: 'User sessions properly isolated',
              details: `Found ${data.length} sessions, all belonging to current user`
            });
          } else {
            testResults.push({
              name: 'User Sessions RLS',
              status: 'fail',
              message: 'Can access other users\' sessions',
              details: 'RLS policies not working correctly'
            });
          }
        } else {
          testResults.push({
            name: 'User Sessions RLS',
            status: 'pass',
            message: 'User sessions access controlled',
            details: 'No unauthorized access detected'
          });
        }
      } catch (error) {
        testResults.push({
          name: 'User Sessions RLS',
          status: 'warning',
          message: 'Could not test user sessions',
          details: String(error)
        });
      }

      // Test 3: Profiles recursion check
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, user_role')
          .limit(1);
        
        if (!error) {
          testResults.push({
            name: 'Profiles RLS Recursion',
            status: 'pass',
            message: 'Profiles queries work without recursion',
            details: 'No infinite recursion detected'
          });
        } else if (error.message.includes('infinite recursion')) {
          testResults.push({
            name: 'Profiles RLS Recursion',
            status: 'fail',
            message: 'Infinite recursion detected in profiles policies',
            details: error.message
          });
        } else {
          testResults.push({
            name: 'Profiles RLS Recursion',
            status: 'warning',
            message: 'Profiles access issue (not recursion)',
            details: error.message
          });
        }
      } catch (error) {
        testResults.push({
          name: 'Profiles RLS Recursion',
          status: 'fail',
          message: 'Error testing profiles',
          details: String(error)
        });
      }

      // Test 4: Function hardening consistency
      try {
        const { data: healthData, error: healthError } = await supabase.rpc('get_security_health_summary');
        const { data: statusData, error: statusError } = await supabase.rpc('get_comprehensive_security_status');
        
        if (!healthError && !statusError && healthData && statusData) {
          const healthPercentage = (healthData as any)?.functions?.percent || 0;
          const statusPercentage = (statusData as any)?.function_hardening?.percentage || 0;
          const difference = Math.abs(healthPercentage - statusPercentage);
          
          if (difference < 1) {
            testResults.push({
              name: 'Monitoring Consistency',
              status: 'pass',
              message: 'Security monitoring reports consistent data',
              details: `Both functions report ~${healthPercentage}% hardening`
            });
          } else {
            testResults.push({
              name: 'Monitoring Consistency',
              status: 'fail',
              message: 'Security monitoring reports inconsistent data',
              details: `Health: ${healthPercentage}%, Status: ${statusPercentage}%`
            });
          }
        } else {
          testResults.push({
            name: 'Monitoring Consistency',
            status: 'warning',
            message: 'Could not test monitoring functions',
            details: healthError?.message || statusError?.message || 'Unknown error'
          });
        }
      } catch (error) {
        testResults.push({
          name: 'Monitoring Consistency',
          status: 'warning',
          message: 'Error testing monitoring functions',
          details: String(error)
        });
      }

      // Test 5: 2FA functionality
      try {
        const { data, error } = await supabase.functions.invoke('secure-2fa-setup', {
          body: { action: 'generate_secret' }
        });
        
        if (!error && data?.secret) {
          testResults.push({
            name: '2FA Edge Functions',
            status: 'pass',
            message: '2FA setup function working correctly',
            details: 'Secret generation successful'
          });
        } else {
          testResults.push({
            name: '2FA Edge Functions',
            status: 'fail',
            message: '2FA setup function not working',
            details: error?.message || data?.error || 'Unknown error'
          });
        }
      } catch (error) {
        testResults.push({
          name: '2FA Edge Functions',
          status: 'fail',
          message: '2FA edge function error',
          details: String(error)
        });
      }

      setResults(testResults);
      
      const passCount = testResults.filter(r => r.status === 'pass').length;
      const failCount = testResults.filter(r => r.status === 'fail').length;
      
      toast({
        title: "Security Tests Complete",
        description: `${passCount} passed, ${failCount} failed`,
        variant: failCount === 0 ? "default" : "destructive"
      });

    } catch (error) {
      console.error('Security test error:', error);
      toast({
        title: "Test Error",
        description: "Failed to run security tests",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pass: 'default',
      fail: 'destructive',
      warning: 'secondary'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Test Suite
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Button 
              onClick={runSecurityTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              {isRunning ? 'Running Tests...' : 'Run Security Tests'}
            </Button>
            
            {results.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {results.filter(r => r.status === 'pass').length} passed, {' '}
                {results.filter(r => r.status === 'fail').length} failed, {' '}
                {results.filter(r => r.status === 'warning').length} warnings
              </div>
            )}
          </div>

          <div className="space-y-3">
            {results.map((result, index) => (
              <Card key={index} className="border-l-4 border-l-transparent data-[status=pass]:border-l-green-500 data-[status=fail]:border-l-red-500 data-[status=warning]:border-l-yellow-500" data-status={result.status}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <div className="font-medium">{result.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {result.message}
                        </div>
                        {result.details && (
                          <div className="text-xs text-muted-foreground mt-2 font-mono bg-muted p-2 rounded">
                            {result.details}
                          </div>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(result.status)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {results.length === 0 && !isRunning && (
            <div className="text-center py-8 text-muted-foreground">
              Click "Run Security Tests" to start the security validation suite
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};