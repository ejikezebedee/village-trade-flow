import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, 
  AlertTriangle, 
  Users, 
  Ban,
  Eye,
  Search,
  Filter,
  UserX,
  FileText,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecurityAuditLog {
  id: string;
  event_type: string;
  severity: string;
  user_id?: string;
  admin_id?: string;
  target_resource?: string;
  target_id?: string;
  action_performed: string;
  metadata?: any;
  created_at: string;
}

interface UserRestriction {
  id: string;
  user_id: string;
  restriction_type: string;
  reason: string;
  restricted_by?: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
}

interface FraudReport {
  id: string;
  reported_user_id: string;
  reporter_id?: string;
  report_type: string;
  description: string;
  evidence?: any;
  status: string;
  assigned_to?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export const AdminSecurityPanel: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [userRestrictions, setUserRestrictions] = useState<UserRestriction[]>([]);
  const [fraudReports, setFraudReports] = useState<FraudReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      // Fetch audit logs
      const { data: logsData, error: logsError } = await supabase
        .from('security_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) throw logsError;

      // Fetch user restrictions
      const { data: restrictionsData, error: restrictionsError } = await supabase
        .from('user_restrictions')
        .select('*')
        .order('created_at', { ascending: false });

      if (restrictionsError) throw restrictionsError;

      // Fetch fraud reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('fraud_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;

      setAuditLogs(logsData || []);
      setUserRestrictions(restrictionsData || []);
      setFraudReports(reportsData || []);
    } catch (error) {
      console.error('Error fetching security data:', error);
      toast({
        title: "Error",
        description: "Failed to load security data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('user_restrictions')
        .insert({
          user_id: userId,
          restriction_type: 'blocked',
          reason: reason,
          restricted_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      // Log the security action
      await supabase.rpc('log_security_event', {
        p_event_type: 'user_blocked',
        p_severity: 'warning',
        p_user_id: userId,
        p_action_performed: `User blocked: ${reason}`,
        p_metadata: { reason }
      });

      toast({
        title: "User Blocked",
        description: "User has been successfully blocked.",
      });

      fetchSecurityData();
    } catch (error) {
      console.error('Error blocking user:', error);
      toast({
        title: "Error",
        description: "Failed to block user.",
        variant: "destructive"
      });
    }
  };

  const handleResolveFraudReport = async (reportId: string, resolution: string) => {
    try {
      const { error } = await supabase
        .from('fraud_reports')
        .update({
          status: 'resolved',
          resolution_notes: resolution,
          assigned_to: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Report Resolved",
        description: "Fraud report has been resolved.",
      });

      fetchSecurityData();
    } catch (error) {
      console.error('Error resolving fraud report:', error);
      toast({
        title: "Error",
        description: "Failed to resolve fraud report.",
        variant: "destructive"
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'investigating': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.action_performed.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.event_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Security Events</p>
                <p className="text-2xl font-bold">{auditLogs.length}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Restrictions</p>
                <p className="text-2xl font-bold">{userRestrictions.filter(r => r.is_active).length}</p>
              </div>
              <UserX className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fraud Reports</p>
                <p className="text-2xl font-bold">{fraudReports.filter(r => r.status === 'pending').length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical Alerts</p>
                <p className="text-2xl font-bold">{auditLogs.filter(l => l.severity === 'critical').length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="audit-logs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="restrictions">User Restrictions</TabsTrigger>
          <TabsTrigger value="fraud-reports">Fraud Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="audit-logs">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Security Audit Logs</CardTitle>
                <div className="flex space-x-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search logs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="warning">Warning</option>
                    <option value="info">Info</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{log.event_type}</h3>
                        <p className="text-sm text-muted-foreground">{log.action_performed}</p>
                      </div>
                      <Badge className={getSeverityColor(log.severity)}>
                        {log.severity}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Resource:</span> {log.target_resource || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">User ID:</span> {log.user_id?.slice(0, 8) || 'N/A'}...
                      </div>
                      <div>
                        <span className="font-medium">Admin ID:</span> {log.admin_id?.slice(0, 8) || 'N/A'}...
                      </div>
                      <div>
                        <span className="font-medium">Time:</span> {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>

                    {log.metadata && (
                      <div className="mt-2 p-2 bg-muted rounded text-xs">
                        <strong>Metadata:</strong> {JSON.stringify(log.metadata, null, 2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="restrictions">
          <Card>
            <CardHeader>
              <CardTitle>User Restrictions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userRestrictions.map((restriction) => (
                  <div key={restriction.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold capitalize">{restriction.restriction_type}</h3>
                        <p className="text-sm text-muted-foreground">{restriction.reason}</p>
                      </div>
                      <Badge variant={restriction.is_active ? "destructive" : "secondary"}>
                        {restriction.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">User ID:</span> {restriction.user_id.slice(0, 8)}...
                      </div>
                      <div>
                        <span className="font-medium">Expires:</span> {restriction.expires_at ? new Date(restriction.expires_at).toLocaleDateString() : 'Never'}
                      </div>
                      <div>
                        <span className="font-medium">Created:</span> {new Date(restriction.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fraud-reports">
          <Card>
            <CardHeader>
              <CardTitle>Fraud Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fraudReports.map((report) => (
                  <div key={report.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold capitalize">{report.report_type.replace('_', ' ')}</h3>
                        <p className="text-sm text-muted-foreground">{report.description}</p>
                      </div>
                      <Badge className={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                      <div>
                        <span className="font-medium">Reported User:</span> {report.reported_user_id.slice(0, 8)}...
                      </div>
                      <div>
                        <span className="font-medium">Reporter:</span> {report.reporter_id?.slice(0, 8) || 'Anonymous'}...
                      </div>
                      <div>
                        <span className="font-medium">Created:</span> {new Date(report.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {report.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleBlockUser(report.reported_user_id, `Fraud report: ${report.description}`)}
                        >
                          <Ban className="w-4 h-4 mr-2" />
                          Block User
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleResolveFraudReport(report.id, 'Investigated and resolved')}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Resolve
                        </Button>
                      </div>
                    )}

                    {report.resolution_notes && (
                      <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                        <strong>Resolution:</strong> {report.resolution_notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};