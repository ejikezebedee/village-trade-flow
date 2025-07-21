import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  DollarSign, 
  Search,
  Eye,
  EyeOff,
  Shield,
  AlertTriangle,
  CreditCard,
  RefreshCw,
  Clock,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Payment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  escrow_status: string;
  held_at: string;
  released_at?: string;
  stripe_payment_intent_id?: string;
}

interface PaymentWithOrder extends Payment {
  order?: {
    id: string;
    product_name: string;
    buyer_id: string;
    seller_id: string;
    order_status: string;
  };
  buyer_name?: string;
  seller_name?: string;
}

interface Transaction {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  escrow_released_at?: string;
  created_at: string;
}

export const PaymentManagement: React.FC = () => {
  const [payments, setPayments] = useState<PaymentWithOrder[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showSensitiveData, setShowSensitiveData] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    try {
      // Fetch payments with order information
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          order:orders(id, product_name, buyer_id, seller_id, order_status)
        `)
        .order('held_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (transactionsError) throw transactionsError;

      // Enhance payments with user names
      const enhancedPayments = await Promise.all(
        (paymentsData || []).map(async (payment) => {
          let buyer_name = 'Unknown Buyer';
          let seller_name = 'Unknown Seller';

          if (payment.order) {
            // Get buyer profile
            const { data: buyerProfile } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('user_id', payment.order.buyer_id)
              .single();

            // Get seller profile  
            const { data: sellerProfile } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('user_id', payment.order.seller_id)
              .single();

            buyer_name = buyerProfile 
              ? `${buyerProfile.first_name || ''} ${buyerProfile.last_name || ''}`.trim()
              : 'Unknown Buyer';

            seller_name = sellerProfile 
              ? `${sellerProfile.first_name || ''} ${sellerProfile.last_name || ''}`.trim()
              : 'Unknown Seller';
          }

          return {
            ...payment,
            buyer_name,
            seller_name
          };
        })
      );

      setPayments(enhancedPayments);
      setTransactions(transactionsData || []);
    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast({
        title: "Error",
        description: "Failed to load payment data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseEscrow = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ 
          escrow_status: 'released',
          released_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: "Escrow Released",
        description: "Payment has been released to the seller.",
      });

      fetchPaymentData();
    } catch (error) {
      console.error('Error releasing escrow:', error);
      toast({
        title: "Error",
        description: "Failed to release escrow payment.",
        variant: "destructive"
      });
    }
  };

  const toggleSensitiveData = (paymentId: string) => {
    setShowSensitiveData(prev => ({
      ...prev,
      [paymentId]: !prev[paymentId]
    }));
  };

  const maskPaymentMethod = (method: string) => {
    if (method.includes('card')) {
      return `****-****-****-${method.slice(-4)}`;
    }
    return method;
  };

  const maskId = (id: string) => {
    return `${id.slice(0, 4)}****${id.slice(-4)}`;
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'held': return 'bg-orange-100 text-orange-800';
      case 'released': return 'bg-green-100 text-green-800';
      case 'refunded': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.order?.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.buyer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.seller_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.escrow_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalPayments: payments.length,
    escrowHeld: payments
      .filter(p => p.escrow_status === 'held')
      .reduce((sum, payment) => sum + payment.amount, 0),
    totalProcessed: payments
      .reduce((sum, payment) => sum + payment.amount, 0),
    pendingReleases: payments.filter(p => p.escrow_status === 'held').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Payments</p>
                <p className="text-2xl font-bold">{stats.totalPayments}</p>
              </div>
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Escrow Held</p>
                <p className="text-2xl font-bold">${stats.escrowHeld.toFixed(2)}</p>
              </div>
              <Shield className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Processed</p>
                <p className="text-2xl font-bold">${stats.totalProcessed.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Releases</p>
                <p className="text-2xl font-bold">{stats.pendingReleases}</p>
              </div>
              <Clock className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Payment Management</CardTitle>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Status</option>
                <option value="held">Held in Escrow</option>
                <option value="released">Released</option>
                <option value="refunded">Refunded</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPayments.map((payment) => (
              <div key={payment.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">
                      {payment.order?.product_name || 'Unknown Product'}
                    </h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        Payment ID: {showSensitiveData[payment.id] ? payment.id : maskId(payment.id)}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="ml-2 h-auto p-1"
                          onClick={() => toggleSensitiveData(payment.id)}
                        >
                          {showSensitiveData[payment.id] ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </Button>
                      </p>
                      {payment.order && (
                        <p>Order ID: {showSensitiveData[payment.id] ? payment.order.id : maskId(payment.order.id)}</p>
                      )}
                      {payment.stripe_payment_intent_id && (
                        <p>
                          Stripe ID: {showSensitiveData[payment.id] 
                            ? payment.stripe_payment_intent_id 
                            : maskId(payment.stripe_payment_intent_id)
                          }
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Badge className={getPaymentStatusColor(payment.escrow_status)}>
                      {payment.escrow_status}
                    </Badge>
                    {payment.order?.order_status && (
                      <Badge variant="outline">
                        {payment.order.order_status}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <span className="font-medium">Amount:</span> ${payment.amount.toFixed(2)} {payment.currency.toUpperCase()}
                  </div>
                  <div>
                    <span className="font-medium">Method:</span> {
                      showSensitiveData[payment.id] 
                        ? payment.payment_method 
                        : maskPaymentMethod(payment.payment_method)
                    }
                  </div>
                  <div>
                    <span className="font-medium">Buyer:</span> {
                      showSensitiveData[payment.id] 
                        ? payment.buyer_name 
                        : payment.buyer_name?.replace(/./g, '*').slice(0, 8) + '...'
                    }
                  </div>
                  <div>
                    <span className="font-medium">Seller:</span> {
                      showSensitiveData[payment.id] 
                        ? payment.seller_name 
                        : payment.seller_name?.replace(/./g, '*').slice(0, 8) + '...'
                    }
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="font-medium">Held Since:</span> {new Date(payment.held_at).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Released:</span> {
                      payment.released_at 
                        ? new Date(payment.released_at).toLocaleString()
                        : 'Not yet released'
                    }
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  {payment.escrow_status === 'held' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleReleaseEscrow(payment.id)}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Release Escrow
                    </Button>
                  )}
                  
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.slice(0, 10).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">${transaction.amount.toFixed(2)} {transaction.currency.toUpperCase()}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(transaction.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getPaymentStatusColor(transaction.status)}>
                    {transaction.status}
                  </Badge>
                  {transaction.status === 'completed' && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};