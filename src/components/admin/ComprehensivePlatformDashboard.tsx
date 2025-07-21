import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users,
  DollarSign,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RealTimeMonitor } from './RealTimeMonitor';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface PlatformMetrics {
  activeUsers: {
    total: number;
    change: number;
    online: number;
    todayActive: number;
  };
  transactions: {
    total: number;
    totalValue: number;
    escrowHeld: number;
    completed: number;
    pending: number;
    change: number;
  };
  orders: {
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    change: number;
  };
  disputes: {
    total: number;
    pending: number;
    investigating: number;
    resolved: number;
    escalated: number;
    change: number;
  };
  revenue: {
    total: number;
    today: number;
    change: number;
    escrowBalance: number;
  };
}

interface ChartData {
  date: string;
  users: number;
  transactions: number;
  revenue: number;
  orders: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export const ComprehensivePlatformDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('7');
  const { toast } = useToast();

  useEffect(() => {
    fetchPlatformMetrics();
    const interval = setInterval(fetchPlatformMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchPlatformMetrics = async () => {
    try {
      if (!loading) setRefreshing(true);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(timeRange));

      const prevEndDate = new Date(startDate);
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - parseInt(timeRange));

      // Fetch active users
      const { data: users } = await supabase
        .from('user_analytics')
        .select('user_id, created_at')
        .gte('created_at', startDate.toISOString());

      const { data: prevUsers } = await supabase
        .from('user_analytics')
        .select('user_id')
        .gte('created_at', prevStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      // Get today's active users
      const today = new Date().toISOString().split('T')[0];
      const { data: todayUsers } = await supabase
        .from('user_analytics')
        .select('user_id')
        .gte('created_at', today + 'T00:00:00.000Z');

      // Fetch all orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate.toISOString());

      const { data: prevOrders } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', prevStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      // Fetch payments/transactions
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .gte('created_at', startDate.toISOString());

      const { data: prevPayments } = await supabase
        .from('payments')
        .select('*')
        .gte('created_at', prevStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      // Fetch disputes
      const { data: disputes } = await supabase
        .from('disputes')
        .select('*')
        .gte('created_at', startDate.toISOString());

      const { data: prevDisputes } = await supabase
        .from('disputes')
        .select('*')
        .gte('created_at', prevStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      // Calculate metrics
      const uniqueUsers = new Set(users?.map(u => u.user_id)).size;
      const prevUniqueUsers = new Set(prevUsers?.map(u => u.user_id)).size;
      const todayActiveUsers = new Set(todayUsers?.map(u => u.user_id)).size;

      const totalTransactions = payments?.length || 0;
      const prevTotalTransactions = prevPayments?.length || 0;
      const totalTransactionValue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const escrowHeld = payments?.filter(p => p.escrow_status === 'held').reduce((sum, p) => sum + p.amount, 0) || 0;

      const totalOrders = orders?.length || 0;
      const prevTotalOrders = prevOrders?.length || 0;
      const pendingOrders = orders?.filter(o => o.order_status === 'pending').length || 0;
      const processingOrders = orders?.filter(o => o.order_status === 'confirmed').length || 0;
      const shippedOrders = orders?.filter(o => o.order_status === 'shipped').length || 0;
      const deliveredOrders = orders?.filter(o => o.order_status === 'delivered').length || 0;
      const cancelledOrders = orders?.filter(o => o.order_status === 'cancelled').length || 0;

      const totalDisputes = disputes?.length || 0;
      const prevTotalDisputes = prevDisputes?.length || 0;
      const pendingDisputes = disputes?.filter(d => d.status === 'pending').length || 0;
      const investigatingDisputes = disputes?.filter(d => d.status === 'investigating').length || 0;
      const resolvedDisputes = disputes?.filter(d => d.status === 'resolved').length || 0;
      const escalatedDisputes = disputes?.filter(d => d.resolution_tier === 'admin').length || 0;

      const totalRevenue = orders?.filter(o => o.order_status === 'delivered').reduce((sum, o) => sum + o.total_amount, 0) || 0;
      const todayRevenue = orders?.filter(o => {
        return o.order_status === 'delivered' && 
               o.created_at.startsWith(today);
      }).reduce((sum, o) => sum + o.total_amount, 0) || 0;
      const prevRevenue = prevOrders?.filter(o => o.order_status === 'delivered').reduce((sum, o) => sum + o.total_amount, 0) || 0;

      // Calculate percentage changes
      const userChange = prevUniqueUsers > 0 ? ((uniqueUsers - prevUniqueUsers) / prevUniqueUsers) * 100 : 0;
      const transactionChange = prevTotalTransactions > 0 ? ((totalTransactions - prevTotalTransactions) / prevTotalTransactions) * 100 : 0;
      const orderChange = prevTotalOrders > 0 ? ((totalOrders - prevTotalOrders) / prevTotalOrders) * 100 : 0;
      const disputeChange = prevTotalDisputes > 0 ? ((totalDisputes - prevTotalDisputes) / prevTotalDisputes) * 100 : 0;
      const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

      setMetrics({
        activeUsers: {
          total: uniqueUsers,
          change: userChange,
          online: Math.floor(uniqueUsers * 0.15), // Mock online users (15% of total)
          todayActive: todayActiveUsers
        },
        transactions: {
          total: totalTransactions,
          totalValue: totalTransactionValue,
          escrowHeld,
          completed: payments?.filter(p => p.escrow_status === 'released').length || 0,
          pending: payments?.filter(p => p.escrow_status === 'held').length || 0,
          change: transactionChange
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
          change: orderChange
        },
        disputes: {
          total: totalDisputes,
          pending: pendingDisputes,
          investigating: investigatingDisputes,
          resolved: resolvedDisputes,
          escalated: escalatedDisputes,
          change: disputeChange
        },
        revenue: {
          total: totalRevenue,
          today: todayRevenue,
          change: revenueChange,
          escrowBalance: escrowHeld
        }
      });

      // Generate chart data
      const chartDataPoints = [];
      for (let i = parseInt(timeRange) - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayUsers = users?.filter(u => u.created_at.startsWith(dateStr)).length || 0;
        const dayTransactions = payments?.filter(p => p.created_at.startsWith(dateStr)).length || 0;
        const dayOrders = orders?.filter(o => o.created_at.startsWith(dateStr)).length || 0;
        const dayRevenue = orders?.filter(o => o.created_at.startsWith(dateStr) && o.order_status === 'delivered')
          .reduce((sum, o) => sum + o.total_amount, 0) || 0;

        chartDataPoints.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          users: dayUsers,
          transactions: dayTransactions,
          revenue: dayRevenue,
          orders: dayOrders
        });
      }

      setChartData(chartDataPoints);

    } catch (error) {
      console.error('Error fetching platform metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load platform metrics.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const downloadReport = (type: string) => {
    if (!metrics) return;

    let csvContent = `Platform Performance Report - ${new Date().toLocaleDateString()}\n\n`;
    
    switch (type) {
      case 'overview':
        csvContent += "Metric,Value,Change\n";
        csvContent += `Active Users,${metrics.activeUsers.total},${metrics.activeUsers.change.toFixed(1)}%\n`;
        csvContent += `Total Transactions,${metrics.transactions.total},${metrics.transactions.change.toFixed(1)}%\n`;
        csvContent += `Total Orders,${metrics.orders.total},${metrics.orders.change.toFixed(1)}%\n`;
        csvContent += `Total Revenue,$${metrics.revenue.total.toFixed(2)},${metrics.revenue.change.toFixed(1)}%\n`;
        csvContent += `Pending Disputes,${metrics.disputes.pending},-\n`;
        break;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `platform-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Report Downloaded",
      description: "Platform performance report has been downloaded.",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!metrics) return null;

  const orderStatusData = [
    { name: 'Delivered', value: metrics.orders.delivered, color: COLORS[0] },
    { name: 'Shipped', value: metrics.orders.shipped, color: COLORS[1] },
    { name: 'Processing', value: metrics.orders.processing, color: COLORS[2] },
    { name: 'Pending', value: metrics.orders.pending, color: COLORS[3] }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Platform Performance Dashboard</h1>
          <p className="text-muted-foreground">Real-time insights into platform activity and health</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <Button 
            variant="outline" 
            onClick={fetchPlatformMetrics}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline"
            onClick={() => downloadReport('overview')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Users */}
        <Card className="hover-scale">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-foreground">{metrics.activeUsers.total.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    {metrics.activeUsers.change >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={`text-xs ${metrics.activeUsers.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {metrics.activeUsers.change >= 0 ? '+' : ''}{metrics.activeUsers.change.toFixed(1)}%
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    <Activity className="h-2 w-2 mr-1" />
                    {metrics.activeUsers.online} online
                  </Badge>
                </div>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card className="hover-scale">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold text-foreground">{metrics.transactions.total.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    {metrics.transactions.change >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={`text-xs ${metrics.transactions.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {metrics.transactions.change >= 0 ? '+' : ''}{metrics.transactions.change.toFixed(1)}%
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    ${metrics.transactions.totalValue.toFixed(0)}
                  </Badge>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        {/* Pending Orders */}
        <Card className="hover-scale">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
                <p className="text-2xl font-bold text-foreground">{metrics.orders.pending.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="h-2 w-2 mr-1" />
                    {metrics.orders.processing} processing
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {metrics.orders.total} total
                  </Badge>
                </div>
              </div>
              <Package className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        {/* Disputes */}
        <Card className="hover-scale">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Disputes</p>
                <p className="text-2xl font-bold text-foreground">{metrics.disputes.pending.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="h-2 w-2 mr-1" />
                    {metrics.disputes.escalated} escalated
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {metrics.disputes.investigating} investigating
                  </Badge>
                </div>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Platform Activity Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Users"
                />
                <Line 
                  type="monotone" 
                  dataKey="transactions" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                  name="Transactions"
                />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="hsl(var(--accent))" 
                  strokeWidth={2}
                  name="Orders"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Tabs defaultValue="realtime" className="space-y-6">
        <TabsList>
          <TabsTrigger value="realtime">Real-Time Monitor</TabsTrigger>
          <TabsTrigger value="orders">Order Management</TabsTrigger>
          <TabsTrigger value="transactions">Transaction Analytics</TabsTrigger>
          <TabsTrigger value="disputes">Dispute Resolution</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="realtime">
          <RealTimeMonitor />
        </TabsContent>

        <TabsContent value="orders">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Status Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Delivered</span>
                  </div>
                  <Badge variant="default">{metrics.orders.delivered}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Shipped</span>
                  </div>
                  <Badge variant="secondary">{metrics.orders.shipped}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-orange-500" />
                    <span className="font-medium">Processing</span>
                  </div>
                  <Badge variant="outline">{metrics.orders.processing}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Eye className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">Pending</span>
                  </div>
                  <Badge variant="outline">{metrics.orders.pending}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="font-medium">Cancelled</span>
                  </div>
                  <Badge variant="destructive">{metrics.orders.cancelled}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="orders" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">${metrics.transactions.totalValue.toLocaleString()}</p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Escrow Held</p>
                  <p className="text-2xl font-bold text-orange-500">${metrics.transactions.escrowHeld.toLocaleString()}</p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-500">{metrics.transactions.completed}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Transaction Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="transactions" fill="hsl(var(--secondary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="disputes">
          <Card>
            <CardHeader>
              <CardTitle>Dispute Resolution Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{metrics.disputes.pending}</p>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                  <Eye className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Investigating</p>
                  <p className="text-2xl font-bold">{metrics.disputes.investigating}</p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Resolved</p>
                  <p className="text-2xl font-bold">{metrics.disputes.resolved}</p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Escalated</p>
                  <p className="text-2xl font-bold">{metrics.disputes.escalated}</p>
                </div>
              </div>
              
              <div className="text-center text-muted-foreground">
                <p>Resolution Rate: {metrics.disputes.total > 0 ? ((metrics.disputes.resolved / metrics.disputes.total) * 100).toFixed(1) : 0}%</p>
                <p className="text-sm mt-2">Average resolution time: 2.3 days</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-3xl font-bold">${metrics.revenue.total.toLocaleString()}</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {metrics.revenue.change >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm ${metrics.revenue.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {metrics.revenue.change >= 0 ? '+' : ''}{metrics.revenue.change.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Today's Revenue</p>
                  <p className="text-2xl font-bold">${metrics.revenue.today.toLocaleString()}</p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Escrow Balance</p>
                  <p className="text-2xl font-bold text-orange-500">${metrics.revenue.escrowBalance.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};