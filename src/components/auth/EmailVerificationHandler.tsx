import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export const EmailVerificationHandler: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<string>('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      verifyEmail(token);
    } else {
      setError('No verification token found');
      setVerifying(false);
    }
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const { data, error } = await supabase.rpc('verify_email_and_complete_registration', {
        p_token: token
      });

      if (error) {
        throw error;
      }

      const result = data as any;
      if (result?.success) {
        setVerified(true);
        setUserType(result.user_type);
        toast({
          title: "Email Verified!",
          description: `Welcome to VillageMarket! Your ${result.user_type} account is now active.`,
        });
        
        // Redirect to sign in page after 3 seconds
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      } else {
        throw new Error(result?.error || 'Verification failed');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
      toast({
        title: "Verification Failed",
        description: err.message || 'Please try again or contact support.',
        variant: "destructive"
      });
    } finally {
      setVerifying(false);
    }
  };

  const getDashboardMessage = (type: string) => {
    const messages = {
      buyer: 'You can now browse products, place orders, and track deliveries.',
      seller: 'You can now list products, manage inventory, and start selling.',
      driver: 'You can now accept delivery requests and start earning.',
      agent: 'You can now assist users and provide customer support.'
    };
    return messages[type as keyof typeof messages] || messages.buyer;
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
            <CardTitle>Verifying Your Email</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Please wait while we verify your email address...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-destructive/10 via-background to-destructive/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <CardTitle className="text-destructive">Verification Failed</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <div className="space-y-2">
              <Button onClick={() => navigate('/auth')} className="w-full">
                Try Again
              </Button>
              <Button variant="ghost" onClick={() => navigate('/')} className="w-full">
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-green-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
            <CardTitle className="text-green-800">Email Verified!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary text-primary-foreground">
              {userType.charAt(0).toUpperCase() + userType.slice(1)}
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">🎉 You're all set!</h3>
              <p className="text-green-700 text-sm">
                {getDashboardMessage(userType)}
              </p>
            </div>
            
            <div className="space-y-2">
              <Button onClick={() => navigate('/auth')} className="w-full">
                Sign In Now
              </Button>
              <Button variant="ghost" onClick={() => navigate('/')} className="w-full">
                Explore Homepage
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              You will be automatically redirected to sign in in 3 seconds.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};