import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  Bell, 
  Settings, 
  Mail,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserX,
  UserCheck,
  KeyRound,
  DollarSign,
  Trash2,
  Plus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  status: string;
  created_at: string;
  actor_id?: string;
  ip_address?: unknown;
  metadata?: any;
}

interface AlertSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  is_active: boolean;
}

export default function SecurityAlertsManager() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [settings, setSettings] = useState<AlertSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailRecipients, setEmailRecipients] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchAlerts();
    fetchSettings();
    setupRealTimeSubscription();
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('security_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast({
        title: "Error",
        description: "Failed to load security alerts.",
        variant: "destructive"
      });
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('alert_settings')
        .select('*');

      if (error) throw error;
      
      setSettings(data || []);
      
      // Extract email recipients
      const emailSetting = data?.find(s => s.setting_key === 'alert_recipients');
      if (emailSetting && typeof emailSetting.setting_value === 'object' && emailSetting.setting_value !== null) {
        const settingValue = emailSetting.setting_value as { emails?: string[] };
        setEmailRecipients(settingValue.emails || []);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeSubscription = () => {
    const subscription = supabase
      .channel('security_alerts_channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'security_alerts' },
        () => fetchAlerts()
      )
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('security_alerts')
        .update({ 
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: "Alert Acknowledged",
        description: "Security alert has been acknowledged.",
      });

      fetchAlerts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast({
        title: "Error",
        description: "Failed to acknowledge alert.",
        variant: "destructive"
      });
    }
  };

  const closeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('security_alerts')
        .update({ status: 'closed' })
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: "Alert Closed",
        description: "Security alert has been closed.",
      });

      fetchAlerts();
    } catch (error) {
      console.error('Error closing alert:', error);
      toast({
        title: "Error",
        description: "Failed to close alert.",
        variant: "destructive"
      });
    }
  };

  const updateAlertSetting = async (settingKey: string, value: any) => {
    try {
      const { error } = await supabase
        .from('alert_settings')
        .update({ setting_value: value })
        .eq('setting_key', settingKey);

      if (error) throw error;

      toast({
        title: "Settings Updated",
        description: "Alert settings have been updated.",
      });

      fetchSettings();
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update alert settings.",
        variant: "destructive"
      });
    }
  };

  const addEmailRecipient = () => {
    if (newEmail && !emailRecipients.includes(newEmail)) {
      const updatedEmails = [...emailRecipients, newEmail];
      setEmailRecipients(updatedEmails);
      updateAlertSetting('alert_recipients', { emails: updatedEmails, sms: [] });
      setNewEmail('');
    }
  };

  const removeEmailRecipient = (email: string) => {
    const updatedEmails = emailRecipients.filter(e => e !== email);
    setEmailRecipients(updatedEmails);
    updateAlertSetting('alert_recipients', { emails: updatedEmails, sms: [] });
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('security_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: "Alert Resolved",
        description: "Security alert has been resolved.",
      });

      fetchAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast({
        title: "Error",
        description: "Failed to resolve alert.",
        variant: "destructive"
      });
    }
  };

  const markAsFalsePositive = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('security_alerts')
        .update({
          status: 'false_positive',
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: "Alert Marked as False Positive",
        description: "Security alert has been marked as false positive.",
      });

      fetchAlerts();
    } catch (error) {
      console.error('Error marking alert:', error);
      toast({
        title: "Error",
        description: "Failed to mark alert as false positive.",
        variant: "destructive"
      });
    }
  };

  const testAlert = async () => {
    try {
      const { error } = await supabase.functions.invoke('send-security-alert', {
        body: {
          alert_type: 'test_alert',
          severity: 'medium',
          title: 'Test Security Alert',
          message: 'This is a test alert to verify the security alerting system is working correctly.',
          metadata: { 
            test: true,
            generated_by: 'admin_panel',
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Test Alert Sent",
        description: "Test security alert has been triggered.",
      });

      fetchAlerts();
    } catch (error) {
      console.error('Error sending test alert:', error);
      toast({
        title: "Error",
        description: "Failed to send test alert.",
        variant: "destructive"
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'acknowledged': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'closed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'failed_logins': return <UserX className="h-4 w-4" />;
      case 'role_change': return <UserCheck className="h-4 w-4" />;
      case 'password_resets': return <KeyRound className="h-4 w-4" />;
      case 'password_changed': return <KeyRound className="h-4 w-4" />;
      case 'admin_migration_required': return <AlertTriangle className="h-4 w-4" />;
      case 'test_alert': return <MessageSquare className="h-4 w-4" />;
      case 'escrow_anomaly': return <DollarSign className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesStatus = filterStatus === 'all' || alert.status === filterStatus;
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    const matchesSearch = !searchTerm || 
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.alert_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSeverity && matchesSearch;
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Security Alerts Manager
          </h2>
          <p className="text-muted-foreground">Configure and monitor real-time security alerts</p>
        </div>
        <Button onClick={testAlert} variant="outline">
          <MessageSquare className="h-4 w-4 mr-2" />
          Test Alert
        </Button>
      </div>

      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Alerts</p>
                <p className="text-2xl font-bold">{alerts.length}</p>
              </div>
              <Bell className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold">{alerts.filter(a => a.status === 'active').length}</p>
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
                <p className="text-2xl font-bold">{alerts.filter(a => a.severity === 'critical').length}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold">{alerts.filter(a => a.status === 'resolved').length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Alert Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Recipients */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Recipients
            </h4>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter email address"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addEmailRecipient()}
                />
                <Button onClick={addEmailRecipient}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {emailRecipients.map((email) => (
                  <Badge key={email} variant="secondary" className="flex items-center gap-1">
                    {email}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEmailRecipient(email)}
                      className="h-4 w-4 p-0 hover:bg-transparent"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Alert Thresholds */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium">Failed Login Threshold</label>
              <Input
                type="number"
                defaultValue={5}
                className="mt-1"
                onChange={(e) => {
                  const threshold = parseInt(e.target.value);
                  updateAlertSetting('failed_logins_threshold', { threshold, time_window_minutes: 10 });
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">Number of failed logins before alert</p>
            </div>
            <div>
              <label className="text-sm font-medium">Password Reset Threshold</label>
              <Input
                type="number"
                defaultValue={5}
                className="mt-1"
                onChange={(e) => {
                  const threshold = parseInt(e.target.value);
                  updateAlertSetting('password_reset_threshold', { threshold, time_window_minutes: 60 });
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">Number of password resets in 1 hour before alert</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="resolved">Resolved</option>
                <option value="false_positive">False Positive</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Severity</label>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => {
                  setFilterStatus('all');
                  setFilterSeverity('all');
                  setSearchTerm('');
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

      {/* Security Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Security Alerts ({filteredAlerts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <div key={alert.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {getAlertIcon(alert.alert_type)}
                    <h4 className="font-semibold">{alert.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(alert.status)}>
                      {alert.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">{alert.message}</p>
                
                <div className="flex justify-between items-center">
                  <div className="text-xs text-muted-foreground">
                    <p>Created: {new Date(alert.created_at).toLocaleString()}</p>
                    {alert.ip_address && <p>IP: {String(alert.ip_address)}</p>}
                  </div>
                  
                  {(alert.status === 'active' || alert.status === 'new') && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Acknowledge
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsFalsePositive(alert.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        False Positive
                      </Button>
                    </div>
                  )}
                  
                  {alert.status === 'acknowledged' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsFalsePositive(alert.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        False Positive
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {filteredAlerts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <p>No security alerts found</p>
                <p className="text-sm">
                  {alerts.length === 0 
                    ? "No security alerts have been generated yet." 
                    : "No alerts match your current filters."}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}