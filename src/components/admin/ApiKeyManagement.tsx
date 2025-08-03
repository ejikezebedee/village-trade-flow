import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Key, 
  Eye, 
  EyeOff, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Copy,
  History,
  Settings,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ApiKey {
  id: string;
  key_name: string;
  description: string;
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

export default function ApiKeyManagement() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  const [showValues, setShowValues] = useState<{ [key: string]: boolean }>({});
  const [keyValues, setKeyValues] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    key_name: '',
    key_value: '',
    description: ''
  });

  useEffect(() => {
    fetchApiKeys();
    fetchAuditLogs();
    validateConfiguration();
  }, []);

  const callApiKeyFunction = async (action: string, data?: any) => {
    const { data: result, error } = await supabase.functions.invoke('manage-api-keys', {
      body: { action, ...data }
    });

    if (error) throw error;
    if (!result.success) throw new Error(result.error || 'Unknown error');
    
    return result.data;
  };

  const fetchApiKeys = async () => {
    try {
      const data = await callApiKeyFunction('list');
      setApiKeys(data || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast({
        title: "Error",
        description: "Failed to load API keys.",
        variant: "destructive"
      });
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const data = await callApiKeyFunction('audit');
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  const validateConfiguration = async () => {
    try {
      const data = await callApiKeyFunction('validate');
      setValidation(data);
    } catch (error) {
      console.error('Error validating configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewKeyValue = async (keyName: string) => {
    if (keyValues[keyName]) {
      setShowValues(prev => ({ ...prev, [keyName]: !prev[keyName] }));
      return;
    }

    try {
      const data = await callApiKeyFunction('get', { key_name: keyName });
      setKeyValues(prev => ({ ...prev, [keyName]: data.key_value }));
      setShowValues(prev => ({ ...prev, [keyName]: true }));
    } catch (error) {
      console.error('Error fetching key value:', error);
      toast({
        title: "Error",
        description: "Failed to decrypt API key.",
        variant: "destructive"
      });
    }
  };

  const handleCopyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({
        title: "Copied",
        description: "API key copied to clipboard."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive"
      });
    }
  };

  const handleSaveApiKey = async () => {
    if (!formData.key_name || !formData.key_value) {
      toast({
        title: "Validation Error",
        description: "Key name and value are required.",
        variant: "destructive"
      });
      return;
    }

    try {
      await callApiKeyFunction('upsert', formData);
      
      toast({
        title: "Success",
        description: `API key ${editingKey ? 'updated' : 'created'} successfully.`
      });
      
      setShowDialog(false);
      setEditingKey(null);
      setFormData({ key_name: '', key_value: '', description: '' });
      fetchApiKeys();
      validateConfiguration();
    } catch (error) {
      console.error('Error saving API key:', error);
      toast({
        title: "Error",
        description: "Failed to save API key.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteApiKey = async (keyName: string) => {
    if (!confirm(`Are you sure you want to deactivate the API key "${keyName}"?`)) {
      return;
    }

    try {
      await callApiKeyFunction('delete', { key_name: keyName });
      
      toast({
        title: "Success",
        description: "API key deactivated successfully."
      });
      
      fetchApiKeys();
      validateConfiguration();
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate API key.",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (apiKey?: ApiKey) => {
    if (apiKey) {
      setEditingKey(apiKey);
      setFormData({
        key_name: apiKey.key_name,
        key_value: '', // Don't pre-fill for security
        description: apiKey.description || ''
      });
    } else {
      setEditingKey(null);
      setFormData({ key_name: '', key_value: '', description: '' });
    }
    setShowDialog(true);
  };

  const getKeyStatusBadge = (apiKey: ApiKey) => {
    if (!apiKey.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    const isConfigured = keyValues[apiKey.key_name] || apiKey.key_name;
    return isConfigured ? 
      <Badge className="bg-green-100 text-green-800">Active</Badge> : 
      <Badge variant="outline">Not Configured</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading API key management...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Key className="h-6 w-6 text-primary" />
            API Key Management
          </h2>
          <p className="text-muted-foreground">Centralized management of all platform API keys</p>
        </div>
        
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => openEditDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingKey ? 'Update API Key' : 'Add New API Key'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="key_name">Key Name</Label>
                <Input
                  id="key_name"
                  value={formData.key_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, key_name: e.target.value }))}
                  placeholder="e.g., OPENAI_API_KEY"
                  disabled={!!editingKey}
                />
              </div>
              
              <div>
                <Label htmlFor="key_value">Key Value</Label>
                <Input
                  id="key_value"
                  type="password"
                  value={formData.key_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, key_value: e.target.value }))}
                  placeholder="Enter the actual API key"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this API key"
                  rows={2}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveApiKey}>
                  {editingKey ? 'Update' : 'Create'} Key
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Configuration Status Alert */}
      {validation && (
        <Alert className={validation.all_configured ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {validation.all_configured ? (
              <span className="text-green-800">
                ✅ All required API keys are configured and active.
              </span>
            ) : (
              <span className="text-orange-800">
                ⚠️ Missing required API keys: {validation.missing_keys.join(', ')}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="keys" className="space-y-4">
        <TabsList>
          <TabsTrigger value="keys">
            <Key className="h-4 w-4 mr-2" />
            API Keys ({apiKeys.length})
          </TabsTrigger>
          <TabsTrigger value="audit">
            <History className="h-4 w-4 mr-2" />
            Audit Log ({auditLogs.length})
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          <div className="grid gap-4">
            {apiKeys.map((apiKey) => (
              <Card key={apiKey.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{apiKey.key_name}</h3>
                        {getKeyStatusBadge(apiKey)}
                      </div>
                      {apiKey.description && (
                        <p className="text-muted-foreground text-sm mb-2">{apiKey.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Created: {formatDate(apiKey.created_at)}</span>
                        <span>Updated: {formatDate(apiKey.updated_at)}</span>
                        {apiKey.last_used_at && (
                          <span>Last used: {formatDate(apiKey.last_used_at)}</span>
                        )}
                        <span>Used {apiKey.usage_count} times</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewKeyValue(apiKey.key_name)}
                      >
                        {showValues[apiKey.key_name] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(apiKey)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteApiKey(apiKey.key_name)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {showValues[apiKey.key_name] && keyValues[apiKey.key_name] && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-mono break-all">
                          {keyValues[apiKey.key_name]}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyToClipboard(keyValues[apiKey.key_name])}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        log.action_type === 'created' ? 'bg-green-100 text-green-600' :
                        log.action_type === 'updated' ? 'bg-blue-100 text-blue-600' :
                        log.action_type === 'deleted' ? 'bg-red-100 text-red-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        <Key className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {log.api_keys?.key_name} {log.action_type}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          by {log.profiles?.first_name} {log.profiles?.last_name}
                          {log.ip_address && ` from ${log.ip_address}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 inline mr-1" />
                      {formatDate(log.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Security Best Practices:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• API keys are encrypted in the database</li>
                    <li>• All access is logged and audited</li>
                    <li>• Only admin users can view/modify API keys</li>
                    <li>• Keys are transmitted over HTTPS only</li>
                    <li>• Consider rotating keys regularly</li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <h4 className="font-medium">Quick Setup Templates</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={() => openEditDialog()}>
                    Add Google OAuth Keys
                  </Button>
                  <Button variant="outline" onClick={() => openEditDialog()}>
                    Add Stripe Keys
                  </Button>
                  <Button variant="outline" onClick={() => openEditDialog()}>
                    Add OpenAI Key
                  </Button>
                  <Button variant="outline" onClick={() => openEditDialog()}>
                    Add Binance API Key
                  </Button>
                </div>
              </div>

              <Button 
                variant="outline" 
                onClick={() => {
                  fetchApiKeys();
                  fetchAuditLogs();
                  validateConfiguration();
                }}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh All Data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}