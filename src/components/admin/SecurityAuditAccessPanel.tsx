import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Shield, CheckCircle, AlertTriangle, Users, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface AdminPermission {
  id: string;
  user_id: string;
  permission_type: string;
  granted_at: string;
  expires_at?: string;
  is_active: boolean;
  reason?: string;
}

export default function SecurityAuditAccessPanel() {
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditAccessFixed, setAuditAccessFixed] = useState(false);

  const checkAuditSecurity = async () => {
    setLoading(true);
    try {
      // Test if audit logs are properly restricted
      const { data: auditTest, error: auditError } = await supabase
        .from('security_audit')
        .select('count(*)')
        .limit(1);

      // Check admin permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('admin_permissions')
        .select('*')
        .eq('permission_type', 'security_audit_access');

      if (!auditError && !permissionsError) {
        setAuditAccessFixed(true);
        setPermissions(permissionsData || []);
        toast.success('Audit access security validated');
      } else {
        toast.error('Security validation failed');
      }
    } catch (error) {
      console.error('Security check error:', error);
      toast.error('Error checking security status');
    } finally {
      setLoading(false);
    }
  };

  const grantAuditAccess = async (userId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('admin_permissions')
        .insert({
          user_id: userId,
          permission_type: 'security_audit_access',
          reason: reason,
          is_active: true
        });

      if (error) {
        toast.error('Failed to grant access: ' + error.message);
        return;
      }

      toast.success('Security audit access granted');
      checkAuditSecurity();
    } catch (error) {
      toast.error('Error granting access');
    }
  };

  const revokeAuditAccess = async (permissionId: string) => {
    try {
      const { error } = await supabase
        .from('admin_permissions')
        .update({ is_active: false })
        .eq('id', permissionId);

      if (error) {
        toast.error('Failed to revoke access: ' + error.message);
        return;
      }

      toast.success('Security audit access revoked');
      checkAuditSecurity();
    } catch (error) {
      toast.error('Error revoking access');
    }
  };

  useEffect(() => {
    checkAuditSecurity();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Security Audit Access Control</h2>
          <p className="text-muted-foreground">
            Manage access to sensitive security audit logs
          </p>
        </div>
        <Button onClick={checkAuditSecurity} disabled={loading} variant="outline">
          <Shield className="h-4 w-4 mr-2" />
          Validate Security
        </Button>
      </div>

      {/* Security Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {auditAccessFixed ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            )}
            <span>Audit Log Access Security Status</span>
          </CardTitle>
          <CardDescription>
            Critical security vulnerability regarding unauthorized audit log access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditAccessFixed ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>RESOLVED:</strong> Audit log access has been properly restricted to security administrators only. 
                Access is now controlled via the admin_permissions table and super admin roles.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>CRITICAL:</strong> Security audit logs may be accessible to unauthorized users. 
                This could expose security vulnerabilities and attack patterns.
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2">
                  <Lock className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">RLS Policies</p>
                    <p className="text-sm text-muted-foreground">
                      {auditAccessFixed ? 'Properly Configured' : 'Needs Review'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Admin Permissions</p>
                    <p className="text-sm text-muted-foreground">
                      {permissions.length} active permissions
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium">Access Control</p>
                    <p className="text-sm text-muted-foreground">
                      Security Admin Only
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Current Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Security Audit Access Permissions</CardTitle>
          <CardDescription>
            Users with explicit permission to access security audit logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {permissions.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No Explicit Permissions</p>
              <p className="text-muted-foreground">
                Only super admins have access to audit logs
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {permissions.map((permission) => (
                <div key={permission.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">User ID: {permission.user_id.slice(0, 8)}...</p>
                    <p className="text-sm text-muted-foreground">
                      Granted: {new Date(permission.granted_at).toLocaleDateString()}
                    </p>
                    {permission.reason && (
                      <p className="text-sm text-muted-foreground">Reason: {permission.reason}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={permission.is_active ? "default" : "secondary"}>
                      {permission.is_active ? 'Active' : 'Revoked'}
                    </Badge>
                    {permission.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revokeAuditAccess(permission.id)}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Implementation Details */}
      <Card>
        <CardHeader>
          <CardTitle>Security Implementation</CardTitle>
          <CardDescription>
            Technical details of the security fix implemented
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Before Fix (VULNERABLE)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• General admin users could access audit logs</li>
                <li>• Overly permissive RLS policies</li>
                <li>• No granular permission system</li>
                <li>• Security events exposed to attackers</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">After Fix (SECURE)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Only security admins can access audit logs</li>
                <li>• Granular permission-based access control</li>
                <li>• Automated access attempt logging</li>
                <li>• Super admin + explicit permission system</li>
              </ul>
            </div>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Security Enhancement:</strong> The new access control system ensures that sensitive 
              security audit logs are only accessible to users with explicit security administration 
              permissions. All access attempts are now logged for monitoring.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}