import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TwoFactorSetup from '@/components/auth/TwoFactorSetup';
import { useAuth } from '@/contexts/AuthContext';

export default function TwoFactorSettings() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p>Please sign in to access 2FA settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Two-Factor Authentication
                </h1>
                <p className="text-muted-foreground">
                  Enhance your account security with 2FA
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <h3 className="font-semibold">Account Protection</h3>
                      <p className="text-sm text-muted-foreground">
                        Two-factor authentication adds an extra layer of security
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        Status: {profile.two_factor_enabled ? (
                          <span className="text-green-600">Enabled</span>
                        ) : (
                          <span className="text-yellow-600">Disabled</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>With 2FA enabled, you'll need to:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Provide your password</li>
                      <li>Enter a verification code from your chosen method</li>
                      <li>Complete both steps for transactions and sensitive actions</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <TwoFactorSetup />

            <Card>
              <CardHeader>
                <CardTitle>Security Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p>Save your backup codes in a secure location. You'll need them if you lose access to your primary 2FA method.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p>Email-based 2FA is convenient but authenticator apps provide better security.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p>Keep your authentication app updated and backed up to another device.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p>2FA is required for all transactions and sensitive account operations.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}