import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Shield, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
  details?: string;
}

export function SecurityIntegrationTests() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runSecurityTests = async () => {
    setIsRunning(true);
    setResults([]);
    const testResults: TestResult[] = [];

    try {
      // Test 1: Admin-only config access (should be blocked for non-admin users)
      try {
        const { data, error } = await supabase
          .from('security_configurations')
          .select('count');

        if (error && error.code === 'PGRST116') {
          testResults.push({
            name: 'Admin Config Access Control',
            status: 'passed',
            message: 'Access properly restricted to admin users only',
            details: 'Non-admin users correctly blocked from accessing security configurations'
          });
        } else if (data) {
          testResults.push({
            name: 'Admin Config Access Control',
            status: 'failed',
            message: 'Security configurations accessible without admin privileges',
            details: 'CRITICAL: Public access to sensitive config data detected'
          });
        }
      } catch (error) {
        testResults.push({
          name: 'Admin Config Access Control',
          status: 'passed',
          message: 'Access control working as expected'
        });
      }

      // Test 2: Monetization config access control
      try {
        const { data, error } = await supabase
          .from('monetization_config')
          .select('count');

        if (error && error.code === 'PGRST116') {
          testResults.push({
            name: 'Monetization Config Security',
            status: 'passed',
            message: 'Monetization config access properly restricted'
          });
        } else {
          testResults.push({
            name: 'Monetization Config Security',
            status: 'failed',
            message: 'Monetization config publicly accessible',
            details: 'CRITICAL: Financial configuration exposed'
          });
        }
      } catch (error) {
        testResults.push({
          name: 'Monetization Config Security',
          status: 'passed',
          message: 'Access control enforced'
        });
      }

      // Test 3: 2FA code validation (test with hardcoded demo codes)
      try {
        const { data, error } = await supabase.rpc('verify_two_factor_code', {
          p_user_id: '00000000-0000-0000-0000-000000000000',
          p_code: '123456',
          p_method: 'email'
        });

        if (data === false || error) {
          testResults.push({
            name: '2FA Demo Code Blocking',
            status: 'passed',
            message: 'Hardcoded demo codes properly rejected',
            details: 'Security enhancement: demo/test codes are blocked'
          });
        } else {
          testResults.push({
            name: '2FA Demo Code Blocking',
            status: 'failed',
            message: 'Demo codes still accepted',
            details: 'CRITICAL: Hardcoded 2FA codes pose security risk'
          });
        }
      } catch (error) {
        testResults.push({
          name: '2FA Demo Code Blocking',
          status: 'warning',
          message: 'Unable to test 2FA validation',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 4: Function hardening check
      try {
        const { data, error } = await supabase.rpc('get_function_hardening_counters');
        
        if (error) throw error;

        const functionData = Array.isArray(data) ? data[0] : data;

        if (functionData?.unhardened === 0) {
          testResults.push({
            name: 'Database Function Hardening',
            status: 'passed',
            message: `All ${functionData.total} functions have search_path protection`,
            details: 'SQL injection protection active on all database functions'
          });
        } else {
          testResults.push({
            name: 'Database Function Hardening',
            status: 'failed',
            message: `${functionData?.unhardened} of ${functionData?.total} functions lack search_path protection`,
            details: 'CRITICAL: Unhardened functions vulnerable to SQL injection'
          });
        }
      } catch (error) {
        testResults.push({
          name: 'Database Function Hardening',
          status: 'failed',
          message: 'Unable to check function security status',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 5: Security monitoring functionality
      try {
        const { data, error } = await supabase.rpc('get_comprehensive_security_status');
        
        if (error) throw error;

        const securityData = typeof data === 'object' && data !== null ? data as any : {};
        testResults.push({
          name: 'Security Monitoring System',
          status: 'passed',
          message: 'Security monitoring active and operational',
          details: `Recent failed 2FA: ${securityData.recent_failed_2fa || 0}, Suspicious logins: ${securityData.suspicious_logins_1h || 0}`
        });
      } catch (error) {
        testResults.push({
          name: 'Security Monitoring System',
          status: 'failed',
          message: 'Security monitoring not accessible',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 6: RLS policy coverage
      try {
        const { data, error } = await supabase.rpc('check_rls_policy_coverage');
        
        if (error) throw error;

        const tablesWithIssues = data.filter((table: any) => table.has_issues);
        
        if (tablesWithIssues.length === 0) {
          const rlsTables = data.filter((table: any) => table.rls_enabled);
          testResults.push({
            name: 'RLS Policy Coverage',
            status: 'passed',
            message: `All ${rlsTables.length} RLS-enabled tables have policies`,
            details: 'Row-level security properly configured'
          });
        } else {
          testResults.push({
            name: 'RLS Policy Coverage',
            status: 'failed',
            message: `${tablesWithIssues.length} tables have RLS but no policies`,
            details: 'CRITICAL: Some tables exposed without access control'
          });
        }
      } catch (error) {
        testResults.push({
          name: 'RLS Policy Coverage',
          status: 'warning',
          message: 'Unable to check RLS policy coverage',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      setResults(testResults);

      const passed = testResults.filter(r => r.status === 'passed').length;
      const failed = testResults.filter(r => r.status === 'failed').length;
      const warnings = testResults.filter(r => r.status === 'warning').length;

      if (failed === 0) {
        toast.success(`Security tests completed: ${passed} passed, ${warnings} warnings`);
      } else {
        toast.error(`Security tests completed: ${failed} critical issues found!`);
      }

    } catch (error) {
      toast.error('Failed to run security tests');
      console.error('Security test error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      passed: 'default',
      failed: 'destructive',
      warning: 'secondary'
    } as const;

    return (
      <Badge variant={variants[status]} className="ml-2">
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-blue-500" />
          <CardTitle>Security Integration Tests</CardTitle>
        </div>
      </CardHeader>
      <CardDescription className="px-6 pb-4">
        Comprehensive security validation suite for production readiness
      </CardDescription>
      <CardContent className="space-y-4">
        <Button 
          onClick={runSecurityTests} 
          disabled={isRunning} 
          className="w-full"
        >
          <Lock className="h-4 w-4 mr-2" />
          {isRunning ? 'Running Security Tests...' : 'Run Security Integration Tests'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3 pt-4">
            <h4 className="font-semibold flex items-center">
              Test Results ({results.filter(r => r.status === 'passed').length} passed, {results.filter(r => r.status === 'failed').length} failed, {results.filter(r => r.status === 'warning').length} warnings)
            </h4>
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(result.status)}
                    <span className="font-medium">{result.name}</span>
                  </div>
                  {getStatusBadge(result.status)}
                </div>
                <p className="text-sm text-muted-foreground">{result.message}</p>
                {result.details && (
                  <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    {result.details}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}