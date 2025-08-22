import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Shield, Mail, Smartphone, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as OTPAuth from 'otpauth';

interface TwoFactorVerificationProps {
  userId: string;
  userEmail: string;
  onVerificationComplete: () => void;
  onCancel: () => void;
}

export default function TwoFactorVerification({
  userId,
  userEmail,
  onVerificationComplete,
  onCancel
}: TwoFactorVerificationProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [activeTab, setActiveTab] = useState('totp');
  const [emailCodeSent, setEmailCodeSent] = useState(false);

  const sendEmailCode = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('create_two_factor_code', {
        p_user_id: userId,
        p_method: 'email'
      });

      if (error) throw error;

      // Send email with code via edge function
      await supabase.functions.invoke('send-2fa-code', {
        body: {
          email: userEmail,
          code: data,
          userName: userEmail.split('@')[0]
        }
      });

      setEmailCodeSent(true);
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
    if (!emailCode) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('verify_two_factor_code', {
        p_user_id: userId,
        p_code: emailCode,
        p_method: 'email'
      });

      if (error) throw error;

      if (data) {
        toast({
          title: "Verified",
          description: "Email verification successful"
        });
        onVerificationComplete();
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
    if (!verificationCode || !userId) return;

    setLoading(true);
    try {
      // Use the enhanced 2FA verification function that blocks demo codes
      const { data: isValid, error } = await supabase.rpc('verify_two_factor_code', {
        p_user_id: userId,
        p_code: verificationCode,
        p_method: 'totp'
      });

      if (error) {
        console.error('2FA verification error:', error);
        toast({
          title: "Error",
          description: "Failed to verify code",
          variant: "destructive"
        });
        return;
      }

      if (isValid) {
        // Update last verified timestamp
        await supabase
          .from('profiles')
          .update({ two_factor_last_verified_at: new Date().toISOString() })
          .eq('user_id', userId);

        toast({
          title: "Verified",
          description: "Two-factor authentication verified"
        });
        onVerificationComplete();
      } else {
        toast({
          title: "Invalid Code",
          description: "Invalid or expired verification code",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('TOTP verification error:', error);
      toast({
        title: "Error",
        description: "Failed to verify code",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyBackupCode = async () => {
    if (!backupCode) return;

    setLoading(true);
    try {
      // Get user's backup codes
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('two_factor_backup_codes')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;

      const backupCodes = profile?.two_factor_backup_codes || [];
      
      if (backupCodes.includes(backupCode.toUpperCase())) {
        // Remove used backup code
        const updatedCodes = backupCodes.filter(code => code !== backupCode.toUpperCase());
        
        await supabase
          .from('profiles')
          .update({ two_factor_backup_codes: updatedCodes })
          .eq('user_id', userId);

        toast({
          title: "Verified",
          description: "Backup code verification successful"
        });
        onVerificationComplete();
      } else {
        toast({
          title: "Invalid Code",
          description: "The backup code is incorrect or already used",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error verifying backup code:', error);
      toast({
        title: "Error",
        description: "Failed to verify backup code",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-center">
            <Shield className="w-5 h-5" />
            Two-Factor Authentication Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please verify your identity to continue accessing your account.
            </AlertDescription>
          </Alert>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="totp" className="flex items-center gap-1">
                <Smartphone className="w-3 h-3" />
                App
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                Email
              </TabsTrigger>
              <TabsTrigger value="backup">Backup</TabsTrigger>
            </TabsList>

            <TabsContent value="totp" className="space-y-4">
              <div className="space-y-2">
                <Label>Enter code from your authenticator app</Label>
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
                className="w-full"
              >
                Verify
              </Button>
            </TabsContent>

            <TabsContent value="email" className="space-y-4">
              {!emailCodeSent ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    We'll send a verification code to {userEmail}
                  </p>
                  <Button onClick={sendEmailCode} disabled={loading} className="w-full">
                    Send Email Code
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Enter code from email</Label>
                    <Input
                      value={emailCode}
                      onChange={(e) => setEmailCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                    />
                  </div>

                  <Button 
                    onClick={verifyEmailCode} 
                    disabled={loading || !emailCode}
                    className="w-full"
                  >
                    Verify
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="backup" className="space-y-4">
              <div className="space-y-2">
                <Label>Enter backup code</Label>
                <Input
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                  placeholder="Enter backup code"
                  className="font-mono"
                />
              </div>

              <Button 
                onClick={verifyBackupCode} 
                disabled={loading || !backupCode}
                className="w-full"
              >
                Verify
              </Button>
            </TabsContent>
          </Tabs>

          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" onClick={onCancel} className="w-full">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}