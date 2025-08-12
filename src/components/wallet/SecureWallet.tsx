import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Wallet, 
  CreditCard, 
  Send, 
  ArrowDownLeft, 
  ArrowUpRight,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle,
  DollarSign
} from 'lucide-react';
import { PayPalButton } from '@/components/payments/PayPalButton';

interface WalletData {
  id: string;
  user_id: string;
  escrow_balance: number;
  available_balance: number;
  total_earned: number;
  total_spent: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'escrow_hold' | 'escrow_release' | 'payment' | 'refund';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  reference: string;
  metadata: any;
  created_at: string;
}

interface EscrowTransaction {
  id: string;
  order_id: string;
  amount: number;
  status: 'pending' | 'held' | 'released' | 'refunded';
  auto_release_date: string;
  created_at: string;
  order: {
    order_number: string;
    product_name: string;
    seller_id: string;
    buyer_id: string;
  };
}

export const SecureWallet: React.FC = () => {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [escrowTransactions, setEscrowTransactions] = useState<EscrowTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [fundAmount, setFundAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        fetchWalletData();
      }
    });
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      
      if (!user) return;

      // Fetch wallet data
      let { data: walletData, error: walletError } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (walletError && walletError.code === 'PGRST116') {
        // Create wallet if it doesn't exist
        const { data: newWallet, error: createError } = await supabase
          .from('user_wallets')
          .insert([{ user_id: user.id }])
          .select()
          .single();

        if (createError) throw createError;
        walletData = newWallet;
      } else if (walletError) {
        throw walletError;
      }

      setWallet(walletData);

      // Fetch transaction history (mock data for now)
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          user_id: user.id,
          type: 'deposit',
          amount: 5000,
          currency: 'NGN',
          status: 'completed',
          description: 'PayPal deposit',
          reference: 'PAY123456',
          metadata: { payment_method: 'paypal' },
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          user_id: user.id,
          type: 'escrow_hold',
          amount: -1500,
          currency: 'NGN',
          status: 'completed',
          description: 'Order payment held in escrow',
          reference: 'ORD789',
          metadata: { order_id: 'order-123' },
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      setTransactions(mockTransactions);

      // Fetch escrow transactions (mock data for now)
      const mockEscrow: EscrowTransaction[] = [
        {
          id: '1',
          order_id: 'order-123',
          amount: 1500,
          status: 'held',
          auto_release_date: new Date(Date.now() + 7 * 86400000).toISOString(),
          created_at: new Date(Date.now() - 86400000).toISOString(),
          order: {
            order_number: 'ORD-789',
            product_name: 'Fresh Tomatoes',
            seller_id: 'seller-123',
            buyer_id: user.id
          }
        }
      ];
      setEscrowTransactions(mockEscrow);

    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast({
        title: "Error",
        description: "Failed to load wallet data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalSuccess = async (paymentData: any) => {
    try {
      // Update wallet balance after successful PayPal payment
      const amount = parseFloat(fundAmount);
      
      if (wallet) {
        const { error } = await supabase
          .from('user_wallets')
          .update({
            available_balance: wallet.available_balance + amount,
            total_earned: wallet.total_earned + amount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (error) throw error;

        toast({
          title: "Payment Successful",
          description: `₦${amount.toLocaleString()} has been added to your wallet.`,
        });

        setFundAmount('');
        fetchWalletData();
      }
    } catch (error) {
      console.error('Error updating wallet:', error);
      toast({
        title: "Error",
        description: "Failed to update wallet balance.",
        variant: "destructive"
      });
    }
  };

  const handleTransfer = async () => {
    try {
      const amount = parseFloat(transferAmount);
      
      if (!amount || amount <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid amount.",
          variant: "destructive"
        });
        return;
      }

      if (!wallet || amount > wallet.available_balance) {
        toast({
          title: "Insufficient Funds",
          description: "You don't have enough available balance.",
          variant: "destructive"
        });
        return;
      }

      // Here you would implement the actual transfer logic
      // For now, just show a success message
      toast({
        title: "Transfer Initiated",
        description: `Transfer of ₦${amount.toLocaleString()} has been initiated.`,
      });

      setTransferAmount('');
      setTransferRecipient('');
      
    } catch (error) {
      console.error('Error processing transfer:', error);
      toast({
        title: "Error",
        description: "Failed to process transfer.",
        variant: "destructive"
      });
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
      case 'withdrawal':
      case 'transfer':
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      case 'escrow_hold':
        return <Shield className="h-4 w-4 text-orange-600" />;
      case 'escrow_release':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'held':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="text-center py-8">
        <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Wallet not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wallet className="h-8 w-8 text-primary" />
            Secure Wallet
          </h1>
          <p className="text-muted-foreground">Manage your funds with escrow protection</p>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available Balance</p>
                <p className="text-2xl font-bold text-green-600">
                  ₦{wallet.available_balance.toLocaleString()}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Escrow Balance</p>
                <p className="text-2xl font-bold text-orange-600">
                  ₦{wallet.escrow_balance.toLocaleString()}
                </p>
              </div>
              <Shield className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Earned</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₦{wallet.total_earned.toLocaleString()}
                </p>
              </div>
              <ArrowDownLeft className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="fund" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fund">Fund Wallet</TabsTrigger>
          <TabsTrigger value="transfer">Transfer</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="escrow">Escrow</TabsTrigger>
        </TabsList>

        {/* Fund Wallet Tab */}
        <TabsContent value="fund" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Add Funds to Wallet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Amount (NGN)</label>
                <Input
                  type="number"
                  placeholder="Enter amount to add"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  min="100"
                  step="100"
                />
              </div>
              
              {fundAmount && parseFloat(fundAmount) >= 100 && (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-medium mb-2">Payment Summary</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span>₦{parseFloat(fundAmount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Processing Fee:</span>
                        <span>₦0</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Total:</span>
                        <span>₦{parseFloat(fundAmount).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Payment Method</h3>
                    <PayPalButton
                      amount={parseFloat(fundAmount)}
                      onSuccess={handlePayPalSuccess}
                      onError={(error) => {
                        console.error('PayPal error:', error);
                        toast({
                          title: "Payment Failed",
                          description: "PayPal payment failed. Please try again.",
                          variant: "destructive"
                        });
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transfer Tab */}
        <TabsContent value="transfer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Transfer Funds
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Recipient User ID</label>
                <Input
                  placeholder="Enter recipient's user ID"
                  value={transferRecipient}
                  onChange={(e) => setTransferRecipient(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Amount (NGN)</label>
                <Input
                  type="number"
                  placeholder="Enter amount to transfer"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  min="10"
                  step="10"
                />
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Transfer Notice</p>
                    <p className="text-yellow-700">
                      Transfers are currently processed manually and may take 1-2 business days.
                      A small processing fee may apply.
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleTransfer}
                disabled={!transferRecipient || !transferAmount || parseFloat(transferAmount) <= 0}
                className="w-full"
              >
                Initiate Transfer
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No transactions found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <h3 className="font-medium">{transaction.description}</h3>
                          <p className="text-sm text-muted-foreground">
                            {transaction.reference} • {new Date(transaction.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}₦{Math.abs(transaction.amount).toLocaleString()}
                        </div>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Escrow Tab */}
        <TabsContent value="escrow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Escrow Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {escrowTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No escrow transactions found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {escrowTransactions.map((escrow) => (
                    <Card key={escrow.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{escrow.order.product_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Order #{escrow.order.order_number}
                            </p>
                            <div className="mt-2">
                              <Badge className={getStatusColor(escrow.status)}>
                                {escrow.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-orange-600">
                              ₦{escrow.amount.toLocaleString()}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Auto-release: {new Date(escrow.auto_release_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        {escrow.status === 'held' && (
                          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="flex items-start gap-2">
                              <Clock className="h-4 w-4 text-orange-600 mt-0.5" />
                              <div className="text-sm">
                                <p className="font-medium text-orange-800">Funds Held in Escrow</p>
                                <p className="text-orange-700">
                                  Funds will be automatically released to the seller once the order is completed
                                  or on {new Date(escrow.auto_release_date).toLocaleDateString()}.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};