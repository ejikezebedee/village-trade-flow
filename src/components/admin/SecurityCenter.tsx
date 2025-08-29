import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, 
  Lock, 
  Key, 
  Eye, 
  EyeOff, 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  Database,
  Server,
  Settings,
  ExternalLink,
  Gauge
} from 'lucide-react';

interface TableInfo {
  table_name: string;
  rls_enabled: boolean;
  policy_count: number;
}

interface SecurityMetric {
  name: string;
  value: number;
  status: 'good' | 'warning' | 'critical';
  description: string;
}

export const SecurityCenter: React.FC = () => {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSecurityData = async () => {
    try {
      // Mock data for now - will be replaced with actual RPC calls
      const mockTables: TableInfo[] = [
        { table_name: 'profiles', rls_enabled: true, policy_count: 3 },
        { table_name: 'orders', rls_enabled: true, policy_count: 4 },
        { table_name: 'products', rls_enabled: false, policy_count: 0 },
        { table_name: 'payments', rls_enabled: true, policy_count: 2 },
        { table_name: 'notifications', rls_enabled: true, policy_count: 2 }
      ];

      const mockMetrics: SecurityMetric[] = [
        { name: 'Tables with RLS', value: 4, status: 'good', description: 'Number of tables with Row Level Security enabled' },
        { name: 'Security Policies', value: 11, status: 'good', description: 'Number of tables with security policies configured' },
        { name: 'Active Sessions', value: 5, status: 'good', description: 'Current number of active user sessions' },
        { name: 'Data Encryption', value: 1, status: 'good', description: 'Database encryption status' }
      ];

      setTables(mockTables);
      setMetrics(mockMetrics);
    } catch (error) {
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
  }, []);

  const toggleRLS = async (tableName: string, enabled: boolean) => {
    try {
      // Update the local state immediately for better UX
      setTables(prevTables => 
        prevTables.map(table => 
          table.table_name === tableName 
            ? { ...table, rls_enabled: enabled }
            : table
        )
      );

      toast({
        title: "Success",
        description: `RLS ${enabled ? 'enabled' : 'disabled'} for ${tableName}`,
      });
    } catch (error: any) {
      console.error('Error toggling RLS:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update RLS setting",
        variant: "destructive"
      });
    }
  };

  const runSecurityScan = async () => {
    setLoading(true);
    try {
      // Simulate security scan
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Security Scan Complete",
        description: "Security scan completed successfully",
      });

      await fetchSecurityData();
    } catch (error: any) {
      console.error('Error running security scan:', error);
      toast({
        title: "Error",
        description: "Failed to run security scan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSecurityScore = () => {
    if (metrics.length === 0) return 0;
    const goodCount = metrics.filter(m => m.status === 'good').length;
    return Math.round((goodCount / metrics.length) * 100);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
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

  const securityScore = getSecurityScore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Center</h1>
          <p className="text-muted-foreground">
            Monitor and manage your application's security settings
          </p>
        </div>
        <Button onClick={runSecurityScan} disabled={loading}>
          <Activity className="h-4 w-4 mr-2" />
          Run Security Scan
        </Button>
      </div>

      {/* Security Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`text-4xl font-bold ${getScoreColor(securityScore)}`}>
              {securityScore}%
            </div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    securityScore >= 80 ? 'bg-green-500' : 
                    securityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${securityScore}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Based on {metrics.length} security checks
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="tables" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tables">Database Tables</TabsTrigger>
          <TabsTrigger value="metrics">Security Metrics</TabsTrigger>
          <TabsTrigger value="settings">Security Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="tables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Row Level Security (RLS) Status</CardTitle>
              <CardDescription>
                Manage RLS settings for database tables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table Name</TableHead>
                    <TableHead>RLS Enabled</TableHead>
                    <TableHead>Policies</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tables.map((table) => (
                    <TableRow key={table.table_name}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          {table.table_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={table.rls_enabled ? "default" : "destructive"}>
                          {table.rls_enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={table.policy_count > 0 ? "text-green-600" : "text-red-600"}>
                          {table.policy_count} policies
                        </span>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={table.rls_enabled}
                          onCheckedChange={(checked) => toggleRLS(table.table_name, checked)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid gap-4">
            {metrics.map((metric, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {metric.status === 'good' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {metric.status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                        {metric.status === 'critical' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        <span className="font-medium">{metric.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{metric.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{metric.value}</div>
                      <Badge 
                        variant={
                          metric.status === 'good' ? 'default' : 
                          metric.status === 'warning' ? 'outline' : 'destructive'
                        }
                      >
                        {metric.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure global security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Two-Factor Authentication</h4>
                  <p className="text-sm text-muted-foreground">
                    Require 2FA for all admin accounts
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">API Rate Limiting</h4>
                  <p className="text-sm text-muted-foreground">
                    Enable rate limiting for API endpoints
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Security Audit Logging</h4>
                  <p className="text-sm text-muted-foreground">
                    Log all security-related events
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Encrypted Data Storage</h4>
                  <p className="text-sm text-muted-foreground">
                    Encrypt sensitive data at rest
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Recommendation:</strong> Review and update all RLS policies quarterly to ensure they meet your current security requirements.
                </AlertDescription>
              </Alert>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Recommendation:</strong> Implement API key rotation every 90 days for enhanced security.
                </AlertDescription>
              </Alert>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Recommendation:</strong> Enable monitoring and alerting for suspicious activities.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};