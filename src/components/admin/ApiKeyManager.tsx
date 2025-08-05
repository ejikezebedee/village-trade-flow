import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Key, Edit, Trash2, Eye, EyeOff, Copy, Activity, AlertTriangle, CheckCircle } from 'lucide-react';

interface ApiKey {
  id: string;
  key_name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_used_at?: string;
  usage_count: number;
}

interface AuditLog {
  id: string;
  action_type: string;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
  api_keys?: { key_name: string };
  profiles?: { first_name: string; last_name: string };
}

interface ValidationResult {
  all_configured: boolean;
  missing_keys: string[];
  configured_keys: string[];
}

export const ApiKeyManager: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [keyValues, setKeyValues] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    key_name: '',
    key_value: '',
    description: ''
  });

  const { toast } = useToast();

  const callApiKeyFunction = async (action: string, data: any = {}) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('manage-api-keys', {
        body: { action, ...data }
      });

      if (error) throw error;
      return result;
    } catch (error: any) {
      console.error('API Key function error:', error);
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
      throw error;
    }
  };

  const fetchApiKeys = async () => {
    try {
      const result = await callApiKeyFunction('list');
      if (result.success) {
        setApiKeys(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const result = await callApiKeyFunction('audit');
      if (result.success) {
        setAuditLogs(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  const validateConfiguration = async () => {
    try {
      const result = await callApiKeyFunction('validate');
      if (result.success) {
        setValidation(result.data);
      }
    } catch (error) {
      console.error('Error validating configuration:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchApiKeys(),
        fetchAuditLogs(),
        validateConfiguration()
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  const handleViewKeyValue = async (keyName: string) => {
    if (visibleKeys.has(keyName)) {
      setVisibleKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(keyName);
        return newSet;
      });
      return;
    }

    try {
      const result = await callApiKeyFunction('get', { key_name: keyName });
      if (result.success) {
        setKeyValues(prev => ({ ...prev, [keyName]: result.data.key_value }));
        setVisibleKeys(prev => new Set(prev).add(keyName));
      }
    } catch (error) {
      console.error('Error fetching key value:', error);
    }
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "API key copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleSaveApiKey = async () => {
    if (!formData.key_name || !formData.key_value) {
      toast({
        title: "Validation Error",
        description: "Key name and value are required",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await callApiKeyFunction('upsert', formData);
      if (result.success) {
        toast({
          title: "Success",
          description: selectedKey ? "API key updated successfully" : "API key created successfully"
        });
        
        setIsAddDialogOpen(false);
        setIsEditDialogOpen(false);
        setSelectedKey(null);
        setFormData({ key_name: '', key_value: '', description: '' });
        
        await Promise.all([fetchApiKeys(), fetchAuditLogs(), validateConfiguration()]);
      }
    } catch (error) {
      console.error('Error saving API key:', error);
    }
  };

  const handleDeleteApiKey = async (keyName: string) => {
    if (!confirm(`Are you sure you want to deactivate the API key "${keyName}"?`)) {
      return;
    }

    try {
      const result = await callApiKeyFunction('delete', { key_name: keyName });
      if (result.success) {
        toast({
          title: "Success",
          description: "API key deactivated successfully"
        });
        
        await Promise.all([fetchApiKeys(), fetchAuditLogs(), validateConfiguration()]);
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
    }
  };

  const openEditDialog = (apiKey: ApiKey) => {
    setSelectedKey(apiKey);
    setFormData({
      key_name: apiKey.key_name,
      key_value: '',
      description: apiKey.description || ''
    });
    setIsEditDialogOpen(true);
  };

  const getKeyStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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
          <h1 className="text-3xl font-bold">API Key Manager</h1>
          <p className="text-muted-foreground">
            Manage your application's API keys and monitor their usage
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New API Key</DialogTitle>
              <DialogDescription>
                Add a new API key to your application configuration
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="key_name">Key Name</Label>
                <Input
                  id="key_name"
                  value={formData.key_name}
                  onChange={(e) => setFormData({ ...formData, key_name: e.target.value })}
                  placeholder="e.g., OPENAI_API_KEY"
                />
              </div>
              <div>
                <Label htmlFor="key_value">Key Value</Label>
                <Input
                  id="key_value"
                  type="password"
                  value={formData.key_value}
                  onChange={(e) => setFormData({ ...formData, key_value: e.target.value })}
                  placeholder="Enter API key value"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this API key is used for"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveApiKey}>Add Key</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {validation && (
        <Alert className={validation.all_configured ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {validation.all_configured ? (
              <span className="text-green-800">✅ All required API keys are configured</span>
            ) : (
              <span className="text-yellow-800">
                ⚠️ Missing API keys: {validation.missing_keys.join(', ')}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="keys" className="space-y-4">
        <TabsList>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          <div className="grid gap-4">
            {apiKeys.map((apiKey) => (
              <Card key={apiKey.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        <span className="font-medium">{apiKey.key_name}</span>
                        {getKeyStatusBadge(apiKey.is_active)}
                      </div>
                      {apiKey.description && (
                        <p className="text-sm text-muted-foreground">{apiKey.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Created: {formatDate(apiKey.created_at)}</span>
                        {apiKey.last_used_at && (
                          <span>Last used: {formatDate(apiKey.last_used_at)}</span>
                        )}
                        <span>Usage: {apiKey.usage_count} times</span>
                      </div>
                      {visibleKeys.has(apiKey.key_name) && keyValues[apiKey.key_name] && (
                        <div className="flex items-center gap-2 mt-2">
                          <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                            {keyValues[apiKey.key_name]}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyToClipboard(keyValues[apiKey.key_name])}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewKeyValue(apiKey.key_name)}
                      >
                        {visibleKeys.has(apiKey.key_name) ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(apiKey)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteApiKey(apiKey.key_name)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {apiKeys.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center">
                  <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">No API Keys</h3>
                  <p className="text-muted-foreground mb-4">
                    Get started by adding your first API key
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add API Key
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Recent API key management activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>API Key</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge variant="outline">{log.action_type}</Badge>
                      </TableCell>
                      <TableCell>{log.api_keys?.key_name || 'N/A'}</TableCell>
                      <TableCell>
                        {log.profiles?.first_name && log.profiles?.last_name
                          ? `${log.profiles.first_name} ${log.profiles.last_name}`
                          : 'System'}
                      </TableCell>
                      <TableCell>{formatDate(log.created_at)}</TableCell>
                      <TableCell>{log.ip_address || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {auditLogs.length === 0 && (
                <div className="text-center py-6">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No audit logs available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Best Practices</CardTitle>
              <CardDescription>
                Follow these guidelines to keep your API keys secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Rotate Keys Regularly</h4>
                    <p className="text-sm text-muted-foreground">
                      Change your API keys every 90 days or when team members leave
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Monitor Usage</h4>
                    <p className="text-sm text-muted-foreground">
                      Keep track of API key usage and watch for unusual activity
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Use Least Privilege</h4>
                    <p className="text-sm text-muted-foreground">
                      Only grant the minimum permissions required for each API key
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Setup Templates</CardTitle>
              <CardDescription>
                Common API key configurations for popular services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <Button
                  variant="outline"
                  className="justify-start h-auto p-4"
                  onClick={() => {
                    setFormData({
                      key_name: 'OPENAI_API_KEY',
                      key_value: '',
                      description: 'OpenAI API key for AI-powered features'
                    });
                    setIsAddDialogOpen(true);
                  }}
                >
                  <div className="text-left">
                    <div className="font-medium">OpenAI API Key</div>
                    <div className="text-sm text-muted-foreground">
                      For ChatGPT and AI features
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto p-4"
                  onClick={() => {
                    setFormData({
                      key_name: 'STRIPE_SECRET_KEY',
                      key_value: '',
                      description: 'Stripe secret key for payment processing'
                    });
                    setIsAddDialogOpen(true);
                  }}
                >
                  <div className="text-left">
                    <div className="font-medium">Stripe Secret Key</div>
                    <div className="text-sm text-muted-foreground">
                      For payment processing
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit API Key</DialogTitle>
            <DialogDescription>
              Update the API key configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_key_name">Key Name</Label>
              <Input
                id="edit_key_name"
                value={formData.key_name}
                onChange={(e) => setFormData({ ...formData, key_name: e.target.value })}
                disabled
              />
            </div>
            <div>
              <Label htmlFor="edit_key_value">New Key Value</Label>
              <Input
                id="edit_key_value"
                type="password"
                value={formData.key_value}
                onChange={(e) => setFormData({ ...formData, key_value: e.target.value })}
                placeholder="Enter new API key value"
              />
            </div>
            <div>
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this API key is used for"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveApiKey}>Update Key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};