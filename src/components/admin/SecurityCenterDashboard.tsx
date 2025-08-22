import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle, CheckCircle, XCircle, Activity, Database, Lock, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SecurityIntegrationTests } from '@/components/tests/SecurityIntegrationTests';
import { useAuth } from '@/contexts/AuthContext';

interface SecurityStatus {
  rls_coverage: number;
  function_hardening_coverage: number;
  rls_tables: number;
  total_tables: number;
  hardened_functions: number;
  total_functions: number;
  recent_failed_2fa: number;
  suspicious_logins_1h: number;
  security_status: string;
  security_monitoring_active: boolean;
  last_security_check: string;
}

interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  status: string;
  created_at: string;
  acknowledged_at?: string;
}

export function SecurityCenterDashboard() {
  const { user } = useAuth();
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);

      // Fetch comprehensive security status
      const { data: statusData, error: statusError } = await supabase.rpc('get_comprehensive_security_status');
      
      if (statusError) {
        console.error('Failed to fetch security status:', statusError);
        toast.error('Failed to load security status');
      } else if (statusData && typeof statusData === 'object') {
        setSecurityStatus(statusData as unknown as SecurityStatus);
      }

      // Fetch recent security alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('security_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (alertsError) {
        console.error('Failed to fetch security alerts:', alertsError);
      } else {
        setSecurityAlerts(alertsData || []);
      }

    } catch (error) {
      console.error('Error fetching security data:', error);
      toast.error('Failed to load security dashboard');
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('security_alerts')
        .update({ 
          status: 'acknowledged', 
          acknowledged_by: user?.id,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) {
        toast.error('Failed to acknowledge alert');
      } else {
        toast.success('Alert acknowledged');
        fetchSecurityData();
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast.error('Failed to acknowledge alert');
    }
  };

  const getSecurityStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-500';
      case 'good':
        return 'text-blue-500';
      case 'adequate':
        return 'text-yellow-500';
      default:
        return 'text-red-500';
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: 'secondary',
      medium: 'default',
      high: 'destructive',
      critical: 'destructive'
    } as const;

    return (
      <Badge variant={variants[severity as keyof typeof variants] || 'default'}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Shield className="h-6 w-6 text-blue-500" />
        <h1 className="text-2xl font-bold">Security Center Dashboard</h1>
      </div>

      {securityStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Status</CardTitle>
              <Shield className={`h-4 w-4 ${getSecurityStatusColor(securityStatus.security_status)}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getSecurityStatusColor(securityStatus.security_status)}`}>
                {securityStatus.security_status.toUpperCase()}
              </div>
              <p className="text-xs text-muted-foreground">
                Overall security assessment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">RLS Coverage</CardTitle>
              <Database className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{securityStatus.rls_coverage}%</div>
              <p className="text-xs text-muted-foreground">
                {securityStatus.rls_tables} of {securityStatus.total_tables} tables protected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Function Hardening</CardTitle>
              <Lock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{securityStatus.function_hardening_coverage}%</div>
              <p className="text-xs text-muted-foreground">
                {securityStatus.hardened_functions} of {securityStatus.total_functions} functions secured
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <Activity className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{securityStatus.recent_failed_2fa}</div>
              <p className="text-xs text-muted-foreground">
                Failed 2FA attempts (10m)
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">Security Alerts</TabsTrigger>
          <TabsTrigger value="tests">Integration Tests</TabsTrigger>
          <TabsTrigger value="monitoring">Real-time Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Alerts</CardTitle>
              <CardDescription>
                Monitor and respond to security events across the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {securityAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium">No Security Alerts</p>
                  <p className="text-muted-foreground">All systems are secure</p>
                </div>
              ) : (
                securityAlerts.map((alert) => (
                  <div key={alert.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {alert.severity === 'critical' ? (
                          <XCircle className="h-5 w-5 text-red-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        )}
                        <span className="font-medium">{alert.title}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getSeverityBadge(alert.severity)}
                        {alert.status === 'new' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <SecurityIntegrationTests />
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Security Monitoring</CardTitle>
              <CardDescription>
                Live security metrics and threat detection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {securityStatus && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Authentication Security</h4>
                    <div className="space-y-1 text-sm">
                      <div>Failed 2FA attempts (10m): <span className="font-mono">{securityStatus.recent_failed_2fa}</span></div>
                      <div>Suspicious logins (1h): <span className="font-mono">{securityStatus.suspicious_logins_1h}</span></div>
                      <div>Monitoring status: 
                        <Badge className="ml-2" variant={securityStatus.security_monitoring_active ? 'default' : 'destructive'}>
                          {securityStatus.security_monitoring_active ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Database Security</h4>
                    <div className="space-y-1 text-sm">
                      <div>RLS Coverage: <span className="font-mono">{securityStatus.rls_coverage}%</span></div>
                      <div>Function Hardening: <span className="font-mono">{securityStatus.function_hardening_coverage}%</span></div>
                      <div>Last Check: <span className="font-mono">{new Date(securityStatus.last_security_check).toLocaleString()}</span></div>
                    </div>
                  </div>
                </div>
              )}
              
              <Button onClick={fetchSecurityData} className="w-full">
                <Activity className="h-4 w-4 mr-2" />
                Refresh Security Status
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}