import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  AlertTriangle, 
  Shield, 
  Eye, 
  Filter,
  Download,
  FileText,
  Activity,
  Users,
  Calendar,
  Search,
  UserX,
  UserCheck,
  KeyRound,
  DollarSign
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  event_data?: any;
  created_at: string;
}

interface LoginAttempt {
  id: string;
  user_id?: string;
  ip_address?: string;
  success: boolean;
  failure_reason?: string;
  user_agent?: string;
  created_at: string;
}

interface Alert {
  id: string;
  type: 'failed_logins' | 'role_change' | 'password_resets';
  message: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
  created_at: string;
}

export default function AdminSecurityDashboard() {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterEventType, setFilterEventType] = useState('all');
  const [realTimeAlerts, setRealTimeAlerts] = useState<Alert[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchSecurityData();
    setupRealTimeSubscriptions();
  }, []);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);

      // Fetch security audit logs
      const { data: auditData, error: auditError } = await supabase
        .from('security_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (auditError) throw auditError;

      // Fetch security audit events
      const { data: securityData, error: securityError } = await supabase
        .from('security_audit')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (securityError) throw securityError;

      // Combine and transform data
      const combinedEvents: SecurityEvent[] = [
        ...(auditData || []).map(item => ({
          id: item.id,
          event_type: item.event_type,
          severity: 'medium',
          user_id: item.admin_id || undefined,
          ip_address: item.ip_address as string,
          user_agent: undefined,
          event_data: item.metadata,
          created_at: item.created_at
        })),
        ...(securityData || []).map(item => ({
          id: item.id,
          event_type: item.event_type,
          severity: item.severity || 'low',
          user_id: item.user_id || undefined,
          ip_address: item.ip_address as string,
          user_agent: item.user_agent || undefined,
          event_data: item.event_data,
          created_at: item.created_at
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setSecurityEvents(combinedEvents);

      // Generate mock login attempts based on security events
      const mockLoginAttempts: LoginAttempt[] = combinedEvents
        .filter(event => event.event_type.includes('login') || event.event_type.includes('auth'))
        .map((event, index) => ({
          id: `login_${event.id}_${index}`,
          user_id: event.user_id,
          ip_address: event.ip_address,
          success: !event.event_type.includes('failed'),
          failure_reason: event.event_type.includes('failed') ? 'Invalid credentials' : undefined,
          user_agent: event.user_agent,
          created_at: event.created_at
        }));

      setLoginAttempts(mockLoginAttempts);

      // Generate real-time alerts
      generateAlerts(combinedEvents);

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

  const generateAlerts = (events: SecurityEvent[]) => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // Group events by IP for failed login detection
    const ipFailures: { [key: string]: number } = {};
    const roleChanges: SecurityEvent[] = [];
    const passwordResets: SecurityEvent[] = [];

    events.forEach(event => {
      const eventTime = new Date(event.created_at);
      if (eventTime < oneHourAgo) return;

      if (event.event_type.includes('failed') && event.ip_address) {
        ipFailures[event.ip_address] = (ipFailures[event.ip_address] || 0) + 1;
      }
      
      if (event.event_type.includes('role_change')) {
        roleChanges.push(event);
      }
      
      if (event.event_type.includes('password_reset')) {
        passwordResets.push(event);
      }
    });

    const newAlerts: Alert[] = [];

    // Multiple failed logins alert
    Object.entries(ipFailures).forEach(([ip, count]) => {
      if (count >= 3) {
        newAlerts.push({
          id: `failed_${ip}`,
          type: 'failed_logins',
          message: `Multiple failed login attempts from IP: ${ip}`,
          count,
          severity: count >= 5 ? 'high' : 'medium',
          created_at: now.toISOString()
        });
      }
    });

    // Role changes alert
    if (roleChanges.length > 0) {
      newAlerts.push({
        id: `role_changes_${Date.now()}`,
        type: 'role_change',
        message: `${roleChanges.length} role change(s) detected in the last hour`,
        count: roleChanges.length,
        severity: 'high',
        created_at: now.toISOString()
      });
    }

    // Password resets alert
    if (passwordResets.length >= 5) {
      newAlerts.push({
        id: `password_resets_${Date.now()}`,
        type: 'password_resets',
        message: `High volume of password resets: ${passwordResets.length} in the last hour`,
        count: passwordResets.length,
        severity: 'medium',
        created_at: now.toISOString()
      });
    }

    setAlerts(newAlerts);
    setRealTimeAlerts(newAlerts);
  };

  const setupRealTimeSubscriptions = () => {
    const subscription = supabase
      .channel('security_events')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'security_audit_logs' },
        () => fetchSecurityData()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'security_audit' },
        () => fetchSecurityData()
      )
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const filteredEvents = securityEvents.filter(event => {
    const matchesDate = !filterDate || 
      new Date(event.created_at).toISOString().split('T')[0] === filterDate;
    const matchesUser = !filterUser || 
      (event.user_id && event.user_id.toLowerCase().includes(filterUser.toLowerCase()));
    const matchesType = filterEventType === 'all' || event.event_type === filterEventType;
    
    return matchesDate && matchesUser && matchesType;
  });

  const exportToCSV = () => {
    const headers = ['Date', 'Event Type', 'Severity', 'User ID', 'IP Address', 'Details'];
    const rows = filteredEvents.map(event => [
      new Date(event.created_at).toLocaleString(),
      event.event_type,
      event.severity,
      event.user_id || 'N/A',
      event.ip_address || 'N/A',
      JSON.stringify(event.event_data || {})
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'failed_logins': return <UserX className="h-4 w-4" />;
      case 'role_change': return <UserCheck className="h-4 w-4" />;
      case 'password_resets': return <KeyRound className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Security Dashboard
          </h2>
          <p className="text-muted-foreground">Monitor security events and manage platform security</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Real-time Alerts */}
      {realTimeAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10">
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Security Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {realTimeAlerts.map(alert => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded border">
                  <div className="flex items-center space-x-3">
                    {getAlertIcon(alert.type)}
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge className={getSeverityColor(alert.severity)}>
                    {alert.severity.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{securityEvents.length}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed Logins</p>
                <p className="text-2xl font-bold">{loginAttempts.filter(l => !l.success).length}</p>
              </div>
              <UserX className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold">{alerts.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Severity</p>
                <p className="text-2xl font-bold">
                  {securityEvents.filter(e => e.severity === 'high').length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">User ID</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by user..."
                  value={filterUser}
                  onChange={(e) => setFilterUser(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Event Type</label>
              <select
                value={filterEventType}
                onChange={(e) => setFilterEventType(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Events</option>
                <option value="login_attempt">Login Attempts</option>
                <option value="role_change">Role Changes</option>
                <option value="password_change">Password Changes</option>
                <option value="2fa_change">2FA Changes</option>
                <option value="escrow_release">Escrow Releases</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => {
                  setFilterDate('');
                  setFilterUser('');
                  setFilterEventType('all');
                }}
                variant="outline"
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Events Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Security Events ({filteredEvents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredEvents.map((event) => (
              <div key={event.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">{event.event_type}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge className={getSeverityColor(event.severity)}>
                    {event.severity.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">User ID:</span> {event.user_id || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">IP Address:</span> {event.ip_address || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">User Agent:</span> {event.user_agent ? event.user_agent.substring(0, 30) + '...' : 'N/A'}
                  </div>
                </div>

                {event.event_data && (
                  <div className="mt-3 p-2 bg-muted rounded text-xs">
                    <span className="font-medium">Details:</span>
                    <pre className="mt-1 whitespace-pre-wrap">
                      {JSON.stringify(event.event_data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Login Attempts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recent Login Attempts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-64 overflow-y-auto">
            {loginAttempts.slice(0, 20).map((attempt) => (
              <div key={attempt.id} className="flex justify-between items-center p-3 border rounded">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${attempt.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div>
                    <p className="font-medium">
                      {attempt.success ? 'Successful Login' : 'Failed Login'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {attempt.ip_address} • {new Date(attempt.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm">{attempt.user_id || 'Unknown User'}</p>
                  {attempt.failure_reason && (
                    <p className="text-xs text-red-600">{attempt.failure_reason}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}