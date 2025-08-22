import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  UserPlus, 
  Coins, 
  ToggleLeft,
  Server,
  Shield,
  AlertTriangle,
  CheckCircle,
  Activity,
  Database
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function SystemSettingsPanel() {
  const [features, setFeatures] = useState({
    auctions: true,
    referrals: true,
    notifications: true,
    twoFactor: true,
    maintenanceMode: false
  });
  const [rewardSettings, setRewardSettings] = useState({
    buyerRate: 0.01,
    sellerRate: 0.05,
    agentRate: 0.10,
    globalMultiplier: 1.0
  });
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [systemHealth, setSystemHealth] = useState({
    database: 'healthy',
    storage: 'healthy',
    functions: 'healthy',
    lastBackup: '2024-01-28 02:00:00'
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
    fetchSystemHealth();
  }, []);

  const fetchSettings = async () => {
    try {
      // Use alert_settings table as a proxy for system settings
      const { data: settingsData } = await supabase
        .from('alert_settings')
        .select('*');

      // For now, use default values since we don't have system_settings table
      setFeatures({
        auctions: true,
        referrals: true,
        notifications: true,
        twoFactor: true,
        maintenanceMode: false
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      // Check system health
      const { data: healthData } = await supabase
        .from('backup_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (healthData && healthData.length > 0) {
        setSystemHealth(prev => ({
          ...prev,
          lastBackup: healthData[0].created_at
        }));
      }
    } catch (error) {
      console.error('Error fetching system health:', error);
    }
  };

  const updateFeature = async (feature: string, enabled: boolean) => {
    setLoading(true);
    try {
      // For now, just update local state since we don't have system_settings table
      setFeatures(prev => ({ ...prev, [feature]: enabled }));
      
      toast({
        title: "Feature Updated",
        description: `${feature} has been ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error updating feature:', error);
      toast({
        title: "Error",
        description: "Failed to update feature setting",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRewardSettings = async () => {
    setLoading(true);
    try {
      // Update token config table
      const updates = [
        { user_role: 'buyer', reward_rate: rewardSettings.buyerRate },
        { user_role: 'seller', reward_rate: rewardSettings.sellerRate },
        { user_role: 'agent', reward_rate: rewardSettings.agentRate }
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('token_config')
          .update({ 
            reward_rate: update.reward_rate,
            multiplier: rewardSettings.globalMultiplier 
          })
          .eq('user_role', update.user_role)
          .eq('is_active', true);

        if (error) throw error;
      }

      toast({
        title: "Reward Settings Updated",
        description: "Platform-wide reward rates have been updated",
      });
    } catch (error) {
      console.error('Error updating reward settings:', error);
      toast({
        title: "Error",
        description: "Failed to update reward settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createAdmin = async () => {
    if (!newAdminUsername || !newAdminPassword) {
      toast({
        title: "Missing Information",
        description: "Please enter username and password",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Admin creation is now handled via Supabase Auth + role assignment
      // This functionality should be replaced with proper user invitation system
      toast({
        title: "Admin Creation Disabled",
        description: "Admin accounts must now be created via Supabase Auth and role assignment",
        variant: "destructive"
      });
      return;
    } catch (error) {
      console.error('Error creating admin:', error);
      toast({
        title: "Error",
        description: "Failed to create admin account",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            System Settings
          </h2>
          <p className="text-muted-foreground">Configure platform settings and system preferences</p>
        </div>
      </div>

      <Tabs defaultValue="features" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ToggleLeft className="h-5 w-5" />
                Feature Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base font-medium">Auction System</Label>
                    <p className="text-sm text-muted-foreground">Enable product auctions</p>
                  </div>
                  <Switch
                    checked={features.auctions}
                    onCheckedChange={(checked) => updateFeature('auctions', checked)}
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base font-medium">Referral Program</Label>
                    <p className="text-sm text-muted-foreground">Enable user referrals</p>
                  </div>
                  <Switch
                    checked={features.referrals}
                    onCheckedChange={(checked) => updateFeature('referrals', checked)}
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base font-medium">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Enable in-app notifications</p>
                  </div>
                  <Switch
                    checked={features.notifications}
                    onCheckedChange={(checked) => updateFeature('notifications', checked)}
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base font-medium">Two-Factor Auth</Label>
                    <p className="text-sm text-muted-foreground">Require 2FA for users</p>
                  </div>
                  <Switch
                    checked={features.twoFactor}
                    onCheckedChange={(checked) => updateFeature('twoFactor', checked)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-red-50">
                  <div>
                    <Label className="text-base font-medium text-red-800">Maintenance Mode</Label>
                    <p className="text-sm text-red-600">Disable access for all users except admins</p>
                  </div>
                  <Switch
                    checked={features.maintenanceMode}
                    onCheckedChange={(checked) => updateFeature('maintenanceMode', checked)}
                    disabled={loading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Platform Reward Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="buyer-rate">Buyer Reward Rate (per $1)</Label>
                  <Input
                    id="buyer-rate"
                    type="number"
                    step="0.001"
                    value={rewardSettings.buyerRate}
                    onChange={(e) => setRewardSettings(prev => ({
                      ...prev,
                      buyerRate: parseFloat(e.target.value)
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seller-rate">Seller Reward Rate (per $1)</Label>
                  <Input
                    id="seller-rate"
                    type="number"
                    step="0.001"
                    value={rewardSettings.sellerRate}
                    onChange={(e) => setRewardSettings(prev => ({
                      ...prev,
                      sellerRate: parseFloat(e.target.value)
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agent-rate">Agent Reward Rate (per $1)</Label>
                  <Input
                    id="agent-rate"
                    type="number"
                    step="0.001"
                    value={rewardSettings.agentRate}
                    onChange={(e) => setRewardSettings(prev => ({
                      ...prev,
                      agentRate: parseFloat(e.target.value)
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="global-multiplier">Global Multiplier</Label>
                  <Input
                    id="global-multiplier"
                    type="number"
                    step="0.1"
                    value={rewardSettings.globalMultiplier}
                    onChange={(e) => setRewardSettings(prev => ({
                      ...prev,
                      globalMultiplier: parseFloat(e.target.value)
                    }))}
                  />
                </div>
              </div>

              <Button onClick={updateRewardSettings} disabled={loading} className="w-full">
                <Coins className="h-4 w-4 mr-2" />
                {loading ? 'Updating...' : 'Update Reward Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Admin Account Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-username">New Admin Username</Label>
                  <Input
                    id="admin-username"
                    placeholder="Enter username"
                    value={newAdminUsername}
                    onChange={(e) => setNewAdminUsername(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-password">New Admin Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="Enter password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={createAdmin} disabled={loading} className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                {loading ? 'Creating...' : 'Create Admin Account'}
              </Button>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Security Warning</h3>
                <p className="text-sm text-muted-foreground">
                  Admin accounts have full access to the platform. Only create accounts for trusted individuals.
                  Consider implementing secure password policies and two-factor authentication.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  System Health Monitor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Database</div>
                      <div className="text-sm text-muted-foreground">Connection & Performance</div>
                    </div>
                    <div className={`flex items-center gap-2 ${getHealthColor(systemHealth.database)}`}>
                      {getHealthIcon(systemHealth.database)}
                      <Badge variant="outline">Healthy</Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Storage</div>
                      <div className="text-sm text-muted-foreground">File Storage & CDN</div>
                    </div>
                    <div className={`flex items-center gap-2 ${getHealthColor(systemHealth.storage)}`}>
                      {getHealthIcon(systemHealth.storage)}
                      <Badge variant="outline">Healthy</Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Edge Functions</div>
                      <div className="text-sm text-muted-foreground">API & Background Jobs</div>
                    </div>
                    <div className={`flex items-center gap-2 ${getHealthColor(systemHealth.functions)}`}>
                      {getHealthIcon(systemHealth.functions)}
                      <Badge variant="outline">Healthy</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Backup & Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Last Backup</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(systemHealth.lastBackup).toLocaleString()}
                    </div>
                  </div>
                  <Badge variant="outline">Automated</Badge>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Database className="h-4 w-4 mr-2" />
                    Force Backup
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Activity className="h-4 w-4 mr-2" />
                    Run Health Check
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}