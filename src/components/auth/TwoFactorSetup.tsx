import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Shield, Mail, Smartphone, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import * as OTPAuth from 'otpauth';
// QRCode import removed - using OTP only

export default function TwoFactorSetup() {
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [secret, setSecret] = useState('');
  // QR code URL removed - using OTP only
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('email');

  const is2FAEnabled = profile?.two_factor_enabled || false;

  useEffect(() => {
    if (!is2FAEnabled) {
      generateTOTPSecret();
    }
  }, [is2FAEnabled]);

  const generateTOTPSecret = async () => {
    try {
      const totp = new OTPAuth.TOTP({
        issuer: 'VillageMarket',
        label: user?.email || 'User',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromLatin1(Math.random().toString(36).substring(2, 15))
      });

      const secretBase32 = totp.secret.base32;
      setSecret(secretBase32);
    } catch (error) {
      console.error('Error generating TOTP secret:', error);
      toast({
        title: "Error",
        description: "Failed to generate authenticator setup",
        variant: "destructive"
      });
    }
  };

  const sendEmailCode = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('create_two_factor_code', {
        p_user_id: user.id,
        p_method: 'email'
      });

      if (error) throw error;

      // Send email with code via edge function
      await supabase.functions.invoke('send-2fa-code', {
        body: {
          email: user.email,
          code: data,
          userName: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()
        }
      });

      toast({
        title: "Code Sent",
        description: "Check your email for the verification code"
      });
    } catch (error) {
      console.error('Error sending email code:', error);
      toast({
        title: "Error",
        description: "Failed to send email code",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailCode = async () => {
    if (!user || !emailCode) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('verify_two_factor_code', {
        p_user_id: user.id,
        p_code: emailCode,
        p_method: 'email'
      });

      if (error) throw error;

      if (data) {
        await updateProfile({
          two_factor_enabled: true,
          two_factor_verified_at: new Date().toISOString()
        });

        toast({
          title: "2FA Enabled",
          description: "Email-based two-factor authentication is now active"
        });
      } else {
        toast({
          title: "Invalid Code",
          description: "The verification code is incorrect or expired",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error verifying email code:', error);
      toast({
        title: "Error",
        description: "Failed to verify code",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyTOTPCode = async () => {
    if (!user || !verificationCode || !secret) return;

    setLoading(true);
    try {
      // Verify TOTP code locally first
      const totp = new OTPAuth.TOTP({
        issuer: 'VillageMarket',
        label: user.email || 'User',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secret)
      });

      const token = totp.generate();
      const isValid = verificationCode === token;

      if (isValid) {
        // Generate backup codes
        const codes = Array.from({ length: 8 }, () => 
          Math.random().toString(36).substr(2, 8).toUpperCase()
        );
        setBackupCodes(codes);

        await updateProfile({
          two_factor_enabled: true,
          two_factor_secret: secret,
          two_factor_backup_codes: codes,
          two_factor_verified_at: new Date().toISOString()
        });

        toast({
          title: "2FA Enabled",
          description: "Authenticator app two-factor authentication is now active"
        });
      } else {
        toast({
          title: "Invalid Code",
          description: "The verification code is incorrect",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error verifying TOTP code:', error);
      toast({
        title: "Error",
        description: "Failed to verify code",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await updateProfile({
        two_factor_enabled: false,
        two_factor_secret: null,
        two_factor_backup_codes: null,
        two_factor_verified_at: null
      });

      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled"
      });
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast({
        title: "Error",
        description: "Failed to disable 2FA",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard"
    });
  };

  if (is2FAEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Two-factor authentication is currently enabled for your account.
            </AlertDescription>
          </Alert>

          {backupCodes.length > 0 && (
            <div className="space-y-2">
              <Label>Backup Codes (Save these securely)</Label>
              <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
                {backupCodes.map((code, index) => (
                  <div key={index} className="font-mono text-sm flex items-center justify-between">
                    <span>{code}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(code)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button variant="destructive" onClick={disable2FA} disabled={loading}>
            Disable 2FA
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Setup Two-Factor Authentication
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="totp" className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Authenticator App
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Email-based 2FA</h3>
              <p className="text-sm text-muted-foreground">
                Receive verification codes via email when logging in.
              </p>
            </div>

            <Button onClick={sendEmailCode} disabled={loading}>
              Send Verification Code
            </Button>

            <div className="space-y-2">
              <Label htmlFor="email-code">Enter verification code from email</Label>
              <Input
                id="email-code"
                value={emailCode}
                onChange={(e) => setEmailCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
              />
            </div>

            <Button onClick={verifyEmailCode} disabled={loading || !emailCode}>
              Enable Email 2FA
            </Button>
          </TabsContent>

          <TabsContent value="totp" className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Authenticator App 2FA</h3>
              <p className="text-sm text-muted-foreground">
                Use an authenticator app like Google Authenticator or Authy.
              </p>
            </div>

            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Manual setup: Enter the secret key in your authenticator app (Google Authenticator, Authy, etc.)
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Secret Key for Manual Entry</Label>
                <div className="flex items-center gap-2">
                  <Input value={secret} readOnly className="font-mono" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(secret)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Copy this key and add it manually in your authenticator app as a new account
                </p>
              </div>

              <div className="space-y-2">
                <Label>Enter verification code from your app</Label>
                <InputOTP
                  value={verificationCode}
                  onChange={setVerificationCode}
                  maxLength={6}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button 
                onClick={verifyTOTPCode} 
                disabled={loading || verificationCode.length !== 6}
              >
                Enable Authenticator 2FA
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}