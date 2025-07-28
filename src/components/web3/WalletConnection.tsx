import React, { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Wallet, Shield, Clock } from 'lucide-react';

export const WalletConnection: React.FC = () => {
  const { wallet, publicKey, connected, disconnect } = useWallet();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Save wallet connection to database when connected
    if (connected && publicKey && user) {
      saveWalletConnection();
    }
  }, [connected, publicKey, user]);

  const saveWalletConnection = async () => {
    if (!publicKey || !user) return;

    try {
      const { error } = await supabase
        .from('wallet_connections')
        .upsert({
          user_id: user.id,
          wallet_address: publicKey.toString(),
          wallet_type: wallet?.adapter.name.toLowerCase() || 'phantom',
          is_verified: true,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Wallet Connected Successfully! 🔗",
        description: `Your ${wallet?.adapter.name || 'wallet'} is now linked to your account`,
      });
    } catch (error) {
      console.error('Error saving wallet connection:', error);
      toast({
        title: "Connection Error",
        description: "Failed to save wallet connection. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Please login to connect your wallet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Solana Wallet Connection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {connected && publicKey ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Connected Wallet</p>
                <p className="text-sm text-muted-foreground">
                  {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
                </p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Shield className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={disconnect}
                className="flex-1"
              >
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Connect your Phantom wallet to earn $ZSHOP tokens
              </p>
            </div>
            
            <WalletMultiButton className="w-full !bg-primary !text-primary-foreground hover:!bg-primary/90" />
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Secure connection via Solana blockchain</p>
              <p>• Earn tokens for every purchase and sale</p>
              <p>• Participate in Web3 rewards program</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};