import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Eye,
  Filter,
  Download,
  Bell,
  Activity,
  Lock,
  Users,
  CreditCard,
  MessageSquare
} from 'lucide-react';

// I) Monitoring, Auditing, and Alerts - Enhanced Security Center

interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  metadata: any;
  created_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
}

interface AuditLog {
  id: string;
  event_type: string;
  user_id: string | null;
  event_data: any;
  severity: string;
  ip_address: unknown;
  created_at: string;
  user_agent: string | null;
}

interface SecurityMetric {
  type: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  severity: 'good' | 'warning' | 'critical';
}

export const EnhancedSecurityCenter: React.FC = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const { toast } = useToast();

  const fetchSecurityData = async () => {
    try {
      setLoading(true);

      // Fetch security alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('security_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (alertsError) throw alertsError;

      // Fetch audit logs
      const { data: auditData, error: auditError } = await supabase
        .from('security_audit')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (auditError) throw auditError;

      setAlerts((alertsData as any) || []);
      setAuditLogs((auditData as any) || []);

      // Calculate metrics
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const todayAlerts = alertsData?.filter(a => new Date(a.created_at) > yesterday) || [];
      const failedLogins = auditData?.filter(a => 
        a.event_type === 'login_failed' && new Date(a.created_at) > yesterday
      ) || [];
      const rateLimitHits = auditData?.filter(a => 
        a.event_type === 'rate_limit_exceeded' && new Date(a.created_at) > yesterday
      ) || [];
      const suspiciousPayments = auditData?.filter(a => 
        a.event_type === 'suspicious_payment' && new Date(a.created_at) > yesterday
      ) || [];

      setMetrics([
        { type: 'Security Alerts', count: todayAlerts.length, trend: 'stable', severity: todayAlerts.length > 10 ? 'critical' : 'good' },
        { type: 'Failed Logins', count: failedLogins.length, trend: 'down', severity: failedLogins.length > 50 ? 'warning' : 'good' },
        { type: 'Rate Limit Hits', count: rateLimitHits.length, trend: 'stable', severity: rateLimitHits.length > 100 ? 'critical' : 'good' },
        { type: 'Suspicious Payments', count: suspiciousPayments.length, trend: 'stable', severity: suspiciousPayments.length > 5 ? 'warning' : 'good' }
      ]);

    } catch (error: any) {
      console.error('Error fetching security data:', error);
      toast({
        title: "Error",
        description: "Failed to load security data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();

    // Set up real-time subscription for new alerts
    const alertsSubscription = supabase
      .channel('security_alerts')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'security_alerts' 
      }, (payload) => {
        setAlerts(prev => [payload.new as SecurityAlert, ...prev]);
        
        // Show notification for high/critical alerts
        if (payload.new.severity === 'high' || payload.new.severity === 'critical') {
          toast({
            title: "Security Alert",
            description: payload.new.title,
            variant: "destructive"
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(alertsSubscription);
    };
  }, [toast]);

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('security_alerts')
        .update({ acknowledged_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged_at: new Date().toISOString() } : alert
      ));

      toast({
        title: "Alert Acknowledged",
        description: "Security alert has been acknowledged",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to acknowledge alert",
        variant: "destructive"
      });
    }
  };

  const exportAuditLogs = () => {
    const csv = [
      ['Timestamp', 'Event Type', 'User ID', 'IP Address', 'Severity', 'Details'],
      ...auditLogs.map(log => [
        log.created_at,
        log.event_type,
        log.user_id || 'N/A',
        log.ip_address || 'N/A',
        log.severity,
        JSON.stringify(log.event_data)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesFilter = filter === '' || 
      alert.title.toLowerCase().includes(filter.toLowerCase()) ||
      alert.message.toLowerCase().includes(filter.toLowerCase()) ||
      alert.alert_type.toLowerCase().includes(filter.toLowerCase());
    
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    
    return matchesFilter && matchesSeverity;
  });

  const filteredAuditLogs = auditLogs.filter(log => {
    return filter === '' || 
      log.event_type.toLowerCase().includes(filter.toLowerCase()) ||
      log.user_id?.toLowerCase().includes(filter.toLowerCase()) ||
      (log.ip_address && String(log.ip_address).includes(filter));
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'Security Alerts': return <AlertTriangle className="h-4 w-4" />;
      case 'Failed Logins': return <Lock className="h-4 w-4" />;
      case 'Rate Limit Hits': return <Activity className="h-4 w-4" />;
      case 'Suspicious Payments': return <CreditCard className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Security Center</h1>
          <p className="text-muted-foreground">
            Real-time security monitoring, alerts, and audit trail
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportAuditLogs} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
          <Button onClick={fetchSecurityData} size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getMetricIcon(metric.type)}
                    <span className="font-medium text-sm">{metric.type}</span>
                  </div>
                  <div className="text-2xl font-bold">{metric.count}</div>
                </div>
                <Badge variant={metric.severity === 'good' ? 'default' : 
                                metric.severity === 'warning' ? 'secondary' : 'destructive'}>
                  {metric.severity}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search alerts, logs, users, IPs..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">Security Alerts</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="violations">RLS Violations</TabsTrigger>
          <TabsTrigger value="activity">Suspicious Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Alerts</CardTitle>
              <CardDescription>
                Real-time security alerts and incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAlerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No security alerts found</p>
                  </div>
                ) : (
                  filteredAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border ${
                        alert.acknowledged_at ? 'bg-muted/50' : 'bg-background'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={getSeverityColor(alert.severity)}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">{alert.alert_type}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(alert.created_at).toLocaleString()}
                            </span>
                          </div>
                          <h4 className="font-semibold">{alert.title}</h4>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                          {alert.metadata && (
                            <details className="text-xs">
                              <summary className="cursor-pointer">Metadata</summary>
                              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                                {JSON.stringify(alert.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                        {!alert.acknowledged_at && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>
                Comprehensive audit trail of all security events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Event Type</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAuditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.event_type}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.user_id || 'N/A'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {String(log.ip_address) || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.severity === 'error' ? 'destructive' : 'secondary'}>
                          {log.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <details className="text-xs">
                          <summary className="cursor-pointer">View</summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-w-xs">
                            {JSON.stringify(log.event_data, null, 2)}
                          </pre>
                        </details>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="violations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>RLS Violations</CardTitle>
              <CardDescription>
                Row Level Security policy violations and unauthorized access attempts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  RLS violation monitoring is active. Any attempts to bypass row-level security policies will be logged here.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Suspicious Activity</CardTitle>
              <CardDescription>
                Unusual patterns, potential threats, and security incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Eye className="h-4 w-4" />
                  <AlertDescription>
                    Monitoring for: Multiple failed login attempts, unusual access patterns, 
                    suspicious payment activities, and role change attempts.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedSecurityCenter;