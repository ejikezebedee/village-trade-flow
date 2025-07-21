import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/marketplace/Header";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, Send, ArrowUpDown, Eye, EyeOff, Plus, History, Shield, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WalletInfo {
  balance: number;
  escrow_balance: number;
  total_received: number;
  total_sent: number;
  currency: string;
}

interface TransferRecord {
  id: string;
  amount: number;
  transaction_fee: number;
  status: string;
  reference_number: string;
  message?: string | null;
  created_at: string;
  completed_at?: string | null;
  sender_profile?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
  recipient_profile?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
  is_sender: boolean;
}

export default function WalletPage() {
  const { user, hasRole, isVerified } = useAuth();
  const navigate = useNavigate();
  
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [recentTransfers, setRecentTransfers] = useState<TransferRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWalletData();
      fetchRecentTransfers();
    }
  }, [user]);

  const fetchWalletData = async () => {
    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setWalletInfo(data);
      } else {
        // Initialize wallet if it doesn't exist and user is verified
        if (isVerified()) {
          await supabase.rpc('initialize_user_wallet', { p_user_id: user?.id });
          setWalletInfo({ 
            balance: 0, 
            escrow_balance: 0, 
            total_received: 0, 
            total_sent: 0, 
            currency: 'USD' 
          });
        }
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentTransfers = async () => {
    try {
      // First get the transfers
      const { data: transfers, error } = await supabase
        .from('wallet_transfers')
        .select(`
          id,
          amount,
          transaction_fee,
          status,
          reference_number,
          message,
          created_at,
          completed_at,
          sender_id,
          recipient_id
        `)
        .or(`sender_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (!transfers || transfers.length === 0) {
        setRecentTransfers([]);
        return;
      }

      // Get unique user IDs for profile lookup
      const userIds = [...new Set([
        ...transfers.map(t => t.sender_id),
        ...transfers.map(t => t.recipient_id)
      ])];

      // Fetch profiles for all involved users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      const profileMap = new Map(
        profiles?.map(p => [p.user_id, { first_name: p.first_name, last_name: p.last_name }]) || []
      );

      const transfersWithType: TransferRecord[] = transfers.map(transfer => ({
        id: transfer.id,
        amount: transfer.amount,
        transaction_fee: transfer.transaction_fee,
        status: transfer.status,
        reference_number: transfer.reference_number,
        message: transfer.message,
        created_at: transfer.created_at,
        completed_at: transfer.completed_at,
        sender_profile: profileMap.get(transfer.sender_id) || null,
        recipient_profile: profileMap.get(transfer.recipient_id) || null,
        is_sender: transfer.sender_id === user?.id
      }));

      setRecentTransfers(transfersWithType);
    } catch (error) {
      console.error('Error fetching transfers:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'pending_2fa':
        return <Badge variant="outline">Awaiting 2FA</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please log in to access your wallet.
              </AlertDescription>
            </Alert>
          </div>
        </main>
      </div>
    );
  }

  if (!isVerified()) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Wallet access is only available to verified users. Please complete your KYC verification to access wallet features.
              </AlertDescription>
            </Alert>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                  <Wallet className="h-8 w-8" />
                  My Wallet
                </h1>
                <p className="text-muted-foreground">
                  Manage your funds and transfer money securely
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowBalance(!showBalance)}
                  size="sm"
                >
                  {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Wallet Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Available Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {showBalance 
                      ? `$${walletInfo?.escrow_balance?.toFixed(2) || '0.00'}`
                      : '••••••'
                    }
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {walletInfo?.currency || 'USD'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Received
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {showBalance 
                      ? `$${walletInfo?.total_received?.toFixed(2) || '0.00'}`
                      : '••••••'
                    }
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    All time
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Sent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {showBalance 
                      ? `$${walletInfo?.total_sent?.toFixed(2) || '0.00'}`
                      : '••••••'
                    }
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    All time
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    onClick={() => navigate('/wallet/transfer')}
                    className="w-full" 
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Money
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="sm"
                    onClick={() => navigate('/wallet/history')}
                  >
                    <History className="h-4 w-4 mr-2" />
                    View History
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpDown className="h-5 w-5" />
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentTransfers.length === 0 ? (
                  <div className="text-center py-8">
                    <ArrowUpDown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No transactions yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Start by sending money to other verified users
                    </p>
                    <Button onClick={() => navigate('/wallet/transfer')}>
                      <Send className="h-4 w-4 mr-2" />
                      Send Money
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentTransfers.map((transfer) => (
                      <div
                        key={transfer.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${
                            transfer.is_sender 
                              ? 'bg-orange-100 text-orange-600' 
                              : 'bg-green-100 text-green-600'
                          }`}>
                            {transfer.is_sender ? (
                              <ArrowUpDown className="h-4 w-4 rotate-90" />
                            ) : (
                              <ArrowUpDown className="h-4 w-4 -rotate-90" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">
                              {transfer.is_sender ? 'Sent to' : 'Received from'}{' '}
                              {transfer.is_sender 
                                ? `${transfer.recipient_profile?.first_name} ${transfer.recipient_profile?.last_name}`
                                : `${transfer.sender_profile?.first_name} ${transfer.sender_profile?.last_name}`
                              }
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(transfer.created_at)} • {transfer.reference_number}
                            </div>
                            {transfer.message && (
                              <div className="text-sm text-muted-foreground italic mt-1">
                                "{transfer.message}"
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-medium ${
                            transfer.is_sender ? 'text-orange-600' : 'text-green-600'
                          }`}>
                            {transfer.is_sender ? '-' : '+'}${transfer.amount.toFixed(2)}
                          </div>
                          {transfer.is_sender && transfer.transaction_fee > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Fee: ${transfer.transaction_fee.toFixed(2)}
                            </div>
                          )}
                          <div className="mt-1">
                            {getStatusBadge(transfer.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {recentTransfers.length >= 10 && (
                      <div className="text-center pt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => navigate('/wallet/history')}
                        >
                          View All Transactions
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}