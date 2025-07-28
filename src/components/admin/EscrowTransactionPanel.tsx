import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Shield, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  Search,
  Eye,
  Download,
  AlertTriangle,
  Truck,
  QrCode
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EscrowTransaction {
  id: string;
  order_id: string;
  amount_held: number;
  escrow_status: string;
  created_at: string;
  auto_release_date: string;
  order: {
    product_name: string;
    buyer_id: string;
    seller_id: string;
    order_status: string;
  };
}

export function EscrowTransactionPanel() {
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('escrow_transactions')
        .select(`
          *,
          orders(product_name, buyer_id, seller_id, order_status)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load escrow transactions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const releaseEscrow = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from('escrow_transactions')
        .update({ 
          escrow_status: 'released',
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (error) throw error;

      toast({
        title: "Escrow Released",
        description: "Funds have been released to the seller",
      });

      fetchTransactions();
    } catch (error) {
      console.error('Error releasing escrow:', error);
      toast({
        title: "Error",
        description: "Failed to release escrow",
        variant: "destructive"
      });
    }
  };

  const refundEscrow = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from('escrow_transactions')
        .update({ 
          escrow_status: 'refunded',
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (error) throw error;

      toast({
        title: "Escrow Refunded",
        description: "Funds have been refunded to the buyer",
      });

      fetchTransactions();
    } catch (error) {
      console.error('Error refunding escrow:', error);
      toast({
        title: "Error",
        description: "Failed to refund escrow",
        variant: "destructive"
      });
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.order?.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || transaction.escrow_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'held': return 'bg-orange-100 text-orange-800';
      case 'released': return 'bg-green-100 text-green-800';
      case 'refunded': return 'bg-blue-100 text-blue-800';
      case 'disputed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'held': return <Shield className="h-4 w-4" />;
      case 'released': return <CheckCircle className="h-4 w-4" />;
      case 'refunded': return <XCircle className="h-4 w-4" />;
      case 'disputed': return <AlertTriangle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const stats = {
    totalHeld: transactions
      .filter(t => t.escrow_status === 'held')
      .reduce((sum, t) => sum + t.amount_held, 0),
    totalReleased: transactions
      .filter(t => t.escrow_status === 'released')
      .reduce((sum, t) => sum + t.amount_held, 0),
    totalRefunded: transactions
      .filter(t => t.escrow_status === 'refunded')
      .reduce((sum, t) => sum + t.amount_held, 0),
    pendingCount: transactions.filter(t => t.escrow_status === 'held').length
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Escrow & Transaction Management
          </h2>
          <p className="text-muted-foreground">Monitor and manage escrow transactions</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Held</p>
                <p className="text-2xl font-bold">${stats.totalHeld.toFixed(2)}</p>
              </div>
              <Shield className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Released</p>
                <p className="text-2xl font-bold">${stats.totalReleased.toFixed(2)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Refunded</p>
                <p className="text-2xl font-bold">${stats.totalRefunded.toFixed(2)}</p>
              </div>
              <XCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Actions</p>
                <p className="text-2xl font-bold">{stats.pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">All Transactions</TabsTrigger>
          <TabsTrigger value="pending">Pending Actions</TabsTrigger>
          <TabsTrigger value="delivery">QR Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Escrow Transactions</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions..."
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
                    <option value="pending">Pending</option>
                    <option value="held">Held</option>
                    <option value="released">Released</option>
                    <option value="refunded">Refunded</option>
                    <option value="disputed">Disputed</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Order Status</TableHead>
                    <TableHead>Auto Release</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="font-medium">{transaction.id.slice(0, 8)}...</div>
                        <div className="text-sm text-muted-foreground">
                          Order: {transaction.order_id.slice(0, 8)}...
                        </div>
                      </TableCell>
                      <TableCell>{transaction.order?.product_name || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="font-medium">${transaction.amount_held.toFixed(2)}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(transaction.escrow_status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(transaction.escrow_status)}
                            {transaction.escrow_status}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {transaction.order?.order_status || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {transaction.auto_release_date ? 
                          new Date(transaction.auto_release_date).toLocaleDateString() : 
                          'Manual'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {transaction.escrow_status === 'held' && (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => releaseEscrow(transaction.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Release
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => refundEscrow(transaction.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Refund
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Actions Required</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTransactions
                  .filter(t => t.escrow_status === 'held')
                  .map((transaction) => (
                    <div key={transaction.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{transaction.order?.product_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Amount: ${transaction.amount_held.toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Held since: {new Date(transaction.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => releaseEscrow(transaction.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Release Funds
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => refundEscrow(transaction.id)}
                          >
                            Refund
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code Delivery Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>QR tracking integration coming soon</p>
                <p className="text-sm">Track delivery confirmations and QR scans</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}