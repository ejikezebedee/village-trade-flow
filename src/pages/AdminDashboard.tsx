import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Eye, 
  MessageCircle, 
  DollarSign, 
  Package, 
  Users, 
  AlertCircle,
  Shield,
  Search,
  Filter,
  UserCheck,
  Settings,
  Coins,
  Megaphone,
  BarChart3,
  Crown
} from 'lucide-react';
import AdminSecurityPanel from '@/components/admin/AdminSecurityPanel';
import AdminSecurityDashboard from '@/components/admin/AdminSecurityDashboard';
import SecurityHealthCheck from '@/components/admin/SecurityHealthCheck';
import SecurityAlertsManager from '@/components/admin/SecurityAlertsManager';
import { AutomatedMessageMonitoring } from '@/components/admin/AutomatedMessageMonitoring';
import { MessageMonitoring } from '@/components/admin/MessageMonitoring';
import { UserManagement } from '@/components/admin/UserManagement';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { ComprehensivePlatformDashboard } from '@/components/admin/ComprehensivePlatformDashboard';
import { ProductManagement } from '@/components/admin/ProductManagement';
import { PaymentManagement } from '@/components/admin/PaymentManagement';
import { TokenAdminPanel } from '@/components/admin/TokenAdminPanel';
import { EnhancedUserManagement } from '@/components/admin/EnhancedUserManagement';
import { ContentMarketingPanel } from '@/components/admin/ContentMarketingPanel';
import { EscrowTransactionPanel } from '@/components/admin/EscrowTransactionPanel';
import { SystemSettingsPanel } from '@/components/admin/SystemSettingsPanel';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  total_amount: number;
  shipping_address: any;
  order_status: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
}

interface Payment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  escrow_status: string;
  held_at: string;
  released_at?: string;
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('held_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      setOrders(ordersData || []);
      setPayments(paymentsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.order_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'held': return 'bg-orange-100 text-orange-800';
      case 'released': return 'bg-green-100 text-green-800';
      case 'refunded': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

      fetchData();
    } catch (error) {
      console.error('Error releasing escrow:', error);
      toast({
        title: "Error",
        description: "Failed to release escrow payment.",
        variant: "destructive"
      });
    }
  };

  const stats = {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + order.total_amount, 0),
    escrowHeld: payments
      .filter(p => p.escrow_status === 'held')
      .reduce((sum, payment) => sum + payment.amount, 0),
    activeDisputes: orders.filter(o => o.order_status === 'cancelled').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Comprehensive platform management and monitoring</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
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
                  <p className="text-sm font-medium text-muted-foreground">Active Disputes</p>
                  <p className="text-2xl font-bold">{stats.activeDisputes}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid grid-cols-6 lg:grid-cols-12 w-full gap-1">
            <TabsTrigger value="dashboard" className="text-xs">
              <Crown className="h-4 w-4 mr-1" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs">
              <Users className="h-4 w-4 mr-1" />
              Users
            </TabsTrigger>
            <TabsTrigger value="products" className="text-xs">
              <Package className="h-4 w-4 mr-1" />
              Products
            </TabsTrigger>
            <TabsTrigger value="tokens" className="text-xs">
              <Coins className="h-4 w-4 mr-1" />
              $ZSHOP
            </TabsTrigger>
            <TabsTrigger value="escrow" className="text-xs">
              <Shield className="h-4 w-4 mr-1" />
              Escrow
            </TabsTrigger>
            <TabsTrigger value="content" className="text-xs">
              <Megaphone className="h-4 w-4 mr-1" />
              Content
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs">
              <BarChart3 className="h-4 w-4 mr-1" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs">
              <AlertCircle className="h-4 w-4 mr-1" />
              Security
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="payments" className="text-xs">
              <DollarSign className="h-4 w-4 mr-1" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="messages" className="text-xs">
              <MessageCircle className="h-4 w-4 mr-1" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="health-check" className="text-xs">
              <Shield className="h-4 w-4 mr-1" />
              Health
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <ComprehensivePlatformDashboard />
          </TabsContent>

          <TabsContent value="users">
            <EnhancedUserManagement />
          </TabsContent>

          <TabsContent value="products">
            <ProductManagement />
          </TabsContent>

          <TabsContent value="tokens">
            <TokenAdminPanel />
          </TabsContent>

          <TabsContent value="escrow">
            <EscrowTransactionPanel />
          </TabsContent>

          <TabsContent value="content">
            <ContentMarketingPanel />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="security">
            <AdminSecurityPanel />
          </TabsContent>

          <TabsContent value="settings">
            <SystemSettingsPanel />
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Order Management</CardTitle>
                  <div className="flex space-x-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search orders..."
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
                      <option value="paid">Paid</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <div key={order.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{order.product_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Order ID: {order.id.slice(0, 8)}...
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Badge className={getStatusColor(order.order_status)}>
                            {order.order_status}
                          </Badge>
                          <Badge className={getPaymentStatusColor(order.payment_status)}>
                            {order.payment_status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Quantity:</span> {order.quantity}
                        </div>
                        <div>
                          <span className="font-medium">Total:</span> ${order.total_amount.toFixed(2)}
                        </div>
                        <div>
                          <span className="font-medium">Buyer:</span> {order.buyer_id.slice(0, 8)}...
                        </div>
                        <div>
                          <span className="font-medium">Date:</span> {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex justify-end mt-4 space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Contact Parties
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <PaymentManagement />
          </TabsContent>

          <TabsContent value="messages">
            <MessageMonitoring />
          </TabsContent>

          <TabsContent value="health-check">
            <SecurityHealthCheck />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}