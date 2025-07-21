import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Key, AlertTriangle, Lock, Eye, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EncryptionKey {
  id: string;
  key_id: string;
  algorithm: string;
  key_purpose: string;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
  usage_count: number;
  last_used_at: string | null;
}

interface SecurityPolicy {
  id: string;
  policy_name: string;
  policy_description: string;
  policy_type: string;
  implementation_status: string;
  priority_level: string;
  compliance_frameworks: string[];
}

interface ComplianceCheck {
  table_name: string;
  column_name: string;
  classification_level: string;
  encryption_required: boolean;
  current_encryption_status: string;
  compliance_status: string;
}

export default function AdminSecurityPanel() {
  const [encryptionKeys, setEncryptionKeys] = useState<EncryptionKey[]>([]);
  const [securityPolicies, setSecurityPolicies] = useState<SecurityPolicy[]>([]);
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);

      // Fetch encryption keys (metadata only)
      const { data: keys, error: keysError } = await supabase
        .from('encryption_keys')
        .select('id, key_id, algorithm, key_purpose, created_at, expires_at, is_active, usage_count, last_used_at')
        .order('created_at', { ascending: false });

      if (keysError) throw keysError;

      // Fetch security policies
      const { data: policies, error: policiesError } = await supabase
        .from('security_policies')
        .select('*')
        .order('priority_level', { ascending: false });

      if (policiesError) throw policiesError;

      // Fetch compliance data
      const { data: compliance, error: complianceError } = await supabase
        .rpc('check_encryption_compliance');

      if (complianceError) throw complianceError;

      setEncryptionKeys(keys || []);
      setSecurityPolicies(policies || []);
      setComplianceChecks(compliance || []);
    } catch (error: any) {
      toast({
        title: "Error loading security data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateNewKey = async (purpose: string) => {
    try {
      const keyId = `${purpose}_${Date.now()}`;
      const keyData = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const { error } = await supabase
        .from('encryption_keys')
        .insert({
          key_id: keyId,
          encrypted_key_data: keyData,
          key_purpose: purpose,
          algorithm: 'AES-256-GCM'
        });

      if (error) throw error;

      toast({
        title: "Encryption key generated",
        description: `New ${purpose} key created successfully`,
      });

      fetchSecurityData();
    } catch (error: any) {
      toast({
        title: "Error generating key",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deactivateKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from('encryption_keys')
        .update({ is_active: false })
        .eq('id', keyId);

      if (error) throw error;

      toast({
        title: "Key deactivated",
        description: "Encryption key has been safely deactivated",
      });

      fetchSecurityData();
    } catch (error: any) {
      toast({
        title: "Error deactivating key",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented': return 'default';
      case 'pending': return 'destructive';
      case 'review_required': return 'secondary';
      default: return 'default';
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'COMPLIANT': return 'default';
      case 'REQUIRES_REVIEW': return 'destructive';
      case 'NOT_ENCRYPTED': return 'destructive';
      case 'PARTIALLY_ENCRYPTED': return 'secondary';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Security Administration</h2>
      </div>

      <Tabs defaultValue="encryption" className="space-y-4">
        <TabsList>
          <TabsTrigger value="encryption">Encryption Management</TabsTrigger>
          <TabsTrigger value="policies">Security Policies</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Status</TabsTrigger>
        </TabsList>

        <TabsContent value="encryption" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Keys</CardTitle>
                <Key className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {encryptionKeys.filter(k => k.is_active).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {encryptionKeys.reduce((sum, k) => sum + k.usage_count, 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expired Keys</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {encryptionKeys.filter(k => k.expires_at && new Date(k.expires_at) < new Date()).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Key Types</CardTitle>
                <Lock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(encryptionKeys.map(k => k.key_purpose)).size}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Encryption Keys</CardTitle>
              <CardDescription>
                Manage encryption keys for different data types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <Button onClick={() => generateNewKey('profile_data')} size="sm">
                    <Key className="h-4 w-4 mr-2" />
                    Generate Profile Key
                  </Button>
                  <Button onClick={() => generateNewKey('transaction_data')} size="sm">
                    <Key className="h-4 w-4 mr-2" />
                    Generate Transaction Key
                  </Button>
                  <Button onClick={() => generateNewKey('message_data')} size="sm">
                    <Key className="h-4 w-4 mr-2" />
                    Generate Message Key
                  </Button>
                </div>

                <div className="space-y-2">
                  {encryptionKeys.map((key) => (
                    <div key={key.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{key.key_id}</div>
                        <div className="text-sm text-muted-foreground">
                          {key.key_purpose} • {key.algorithm} • Used {key.usage_count} times
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={key.is_active ? "default" : "secondary"}>
                          {key.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {key.is_active && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deactivateKey(key.id)}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Policies</CardTitle>
              <CardDescription>
                Review and manage security policy implementation status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityPolicies.map((policy) => (
                  <div key={policy.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium">{policy.policy_name}</h3>
                      <div className="flex gap-2">
                        <Badge variant={getPriorityColor(policy.priority_level)}>
                          {policy.priority_level}
                        </Badge>
                        <Badge variant={getStatusColor(policy.implementation_status)}>
                          {policy.implementation_status}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {policy.policy_description}
                    </p>
                    <div className="flex gap-1">
                      {policy.compliance_frameworks.map((framework) => (
                        <Badge key={framework} variant="outline" className="text-xs">
                          {framework}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Classification & Compliance</CardTitle>
              <CardDescription>
                Review encryption compliance for sensitive data fields
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {complianceChecks.map((check, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">
                        {check.table_name}.{check.column_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Classification: {check.classification_level}
                        {check.encryption_required && " • Encryption Required"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getComplianceColor(check.current_encryption_status)}>
                        {check.current_encryption_status}
                      </Badge>
                      <Badge variant={getComplianceColor(check.compliance_status)}>
                        {check.compliance_status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}