import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Header } from "@/components/marketplace/Header";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Send, ArrowLeft, DollarSign, Users, Shield, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UserProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  verification_status: string;
  kyc_status: string;
}

interface WalletInfo {
  balance: number;
  escrow_balance: number;
  currency: string;
}

interface TransferLimits {
  daily_limit: number;
  monthly_limit: number;
  single_transaction_limit: number;
  daily_spent: number;
  monthly_spent: number;
}

export default function WalletTransferPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [verifiedUsers, setVerifiedUsers] = useState<UserProfile[]>([]);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [transferLimits, setTransferLimits] = useState<TransferLimits | null>(null);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calculatedFee, setCalculatedFee] = useState(0);

  useEffect(() => {
    if (user) {
      fetchVerifiedUsers();
      fetchWalletInfo();
      fetchTransferLimits();
    }
  }, [user]);

  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      calculateFee();
    } else {
      setCalculatedFee(0);
    }
  }, [amount]);

  const fetchVerifiedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, verification_status, kyc_status')
        .eq('verification_status', 'verified')
        .eq('kyc_status', 'verified')
        .neq('user_id', user?.id);

      if (error) throw error;
      setVerifiedUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load verified users",
        variant: "destructive",
      });
    }
  };

  const fetchWalletInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('balance, escrow_balance, currency')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setWalletInfo(data);
      } else {
        // Initialize wallet if it doesn't exist
        await supabase.rpc('initialize_user_wallet', { p_user_id: user?.id });
        setWalletInfo({ balance: 0, escrow_balance: 0, currency: 'USD' });
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
      toast({
        title: "Error",
        description: "Failed to load wallet information",
        variant: "destructive",
      });
    }
  };

  const fetchTransferLimits = async () => {
    try {
      const { data, error } = await supabase
        .from('transfer_limits')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setTransferLimits(data);
    } catch (error) {
      console.error('Error fetching limits:', error);
    }
  };

  const calculateFee = async () => {
    try {
      const { data, error } = await supabase
        .rpc('calculate_transaction_fee', {
          p_amount: parseFloat(amount),
          p_transaction_type: 'wallet_transfer'
        });

      if (error) throw error;
      setCalculatedFee(data || 0);
    } catch (error) {
      console.error('Error calculating fee:', error);
      setCalculatedFee(0);
    }
  };

  const handleTransfer = async () => {
    if (!selectedRecipient || !amount || parseFloat(amount) <= 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('process-wallet-transfer', {
        body: {
          recipient_id: selectedRecipient,
          amount: parseFloat(amount),
          message: message.trim(),
          requires_2fa: requires2FA
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });

        // Reset form
        setSelectedRecipient('');
        setAmount('');
        setMessage('');
        setRequires2FA(false);
        
        // Refresh wallet info
        fetchWalletInfo();
        fetchTransferLimits();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Transfer error:', error);
      toast({
        title: "Transfer Failed",
        description: error.message || "Failed to process transfer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTotalAmount = () => {
    const baseAmount = parseFloat(amount) || 0;
    return baseAmount + calculatedFee;
  };

  const canAfford = () => {
    if (!walletInfo || !amount) return true;
    return walletInfo.escrow_balance >= getTotalAmount();
  };

  const isWithinLimits = () => {
    if (!transferLimits || !amount) return true;
    const transferAmount = parseFloat(amount);
    
    return (
      transferAmount <= transferLimits.single_transaction_limit &&
      (transferLimits.daily_spent + transferAmount) <= transferLimits.daily_limit &&
      (transferLimits.monthly_spent + transferAmount) <= transferLimits.monthly_limit
    );
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
                Please log in to access wallet transfers.
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
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Send Money
                </h1>
                <p className="text-muted-foreground">
                  Transfer money securely to other verified users
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Wallet Info */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Wallet Balance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Available Balance</Label>
                    <div className="text-2xl font-bold text-primary">
                      ${walletInfo?.escrow_balance?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  
                  {transferLimits && (
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Transfer Limits</Label>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Daily:</span>
                          <span>${transferLimits.daily_spent.toFixed(2)} / ${transferLimits.daily_limit.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Monthly:</span>
                          <span>${transferLimits.monthly_spent.toFixed(2)} / ${transferLimits.monthly_limit.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Single Transaction:</span>
                          <span>${transferLimits.single_transaction_limit.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Transfer Form */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Transfer Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Recipient Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Recipient *</Label>
                    <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a verified user" />
                      </SelectTrigger>
                      <SelectContent>
                        {verifiedUsers.map((user) => (
                          <SelectItem key={user.user_id} value={user.user_id}>
                            <div className="flex items-center gap-2">
                              <span>{user.first_name} {user.last_name}</span>
                              <Badge variant="secondary" className="text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {verifiedUsers.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No verified users available for transfer
                      </p>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount ({walletInfo?.currency || 'USD'}) *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    {amount && (
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Transfer Amount:</span>
                          <span>${parseFloat(amount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Transaction Fee:</span>
                          <span>${calculatedFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-semibold border-t pt-1">
                          <span>Total:</span>
                          <span>${getTotalAmount().toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message">Message (Optional)</Label>
                    <Textarea
                      id="message"
                      placeholder="Add a note for the recipient..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Security Options */}
                  <div className="space-y-2">
                    <Label>Security Options</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="require2fa"
                        checked={requires2FA}
                        onChange={(e) => setRequires2FA(e.target.checked)}
                        className="h-4 w-4"
                      />
                      <label htmlFor="require2fa" className="text-sm">
                        Require two-factor authentication for this transfer
                      </label>
                    </div>
                  </div>

                  {/* Validation Alerts */}
                  {amount && !canAfford() && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Insufficient balance. You need ${getTotalAmount().toFixed(2)} but only have ${walletInfo?.escrow_balance?.toFixed(2) || '0.00'} available.
                      </AlertDescription>
                    </Alert>
                  )}

                  {amount && !isWithinLimits() && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Transfer amount exceeds your limits. Please check your daily, monthly, or single transaction limits.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Transfer Button */}
                  <Button
                    onClick={handleTransfer}
                    disabled={loading || !selectedRecipient || !amount || !canAfford() || !isWithinLimits()}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      "Processing..."
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {requires2FA ? "Initiate Transfer (2FA Required)" : "Send Money"}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}