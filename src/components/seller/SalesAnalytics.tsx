import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Calendar,
  Download,
  BarChart3,
  PieChart,
  ShoppingCart
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';

interface SalesData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueChange: number;
  ordersChange: number;
  topProducts: Array<{
    name: string;
    revenue: number;
    orders: number;
    quantity: number;
  }>;
  customerDemographics: Array<{
    location: string;
    orders: number;
    revenue: number;
  }>;
  dailySales: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  monthlySales: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
}

interface SalesAnalyticsProps {
  onClose?: () => void;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export const SalesAnalytics: React.FC<SalesAnalyticsProps> = ({ onClose }) => {
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");
  const [reportType, setReportType] = useState("overview");
  const { toast } = useToast();

  useEffect(() => {
    fetchSalesData();
  }, [dateRange]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(dateRange));

      // Get seller's orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('seller_id', user.user.id)
        .eq('order_status', 'delivered')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (ordersError) throw ordersError;

      // Calculate metrics
      const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const totalOrders = orders?.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Get previous period data for comparison
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - parseInt(dateRange));
      const prevEndDate = new Date(startDate);

      const { data: prevOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('seller_id', user.user.id)
        .eq('order_status', 'delivered')
        .gte('created_at', prevStartDate.toISOString())
        .lte('created_at', prevEndDate.toISOString());

      const prevRevenue = prevOrders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const prevOrderCount = prevOrders?.length || 0;

      const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
      const ordersChange = prevOrderCount > 0 ? ((totalOrders - prevOrderCount) / prevOrderCount) * 100 : 0;

      // Group by product for top products
      const productMap = new Map();
      orders?.forEach(order => {
        const existing = productMap.get(order.product_name) || {
          name: order.product_name,
          revenue: 0,
          orders: 0,
          quantity: 0
        };
        existing.revenue += order.total_amount;
        existing.orders += 1;
        existing.quantity += order.quantity;
        productMap.set(order.product_name, existing);
      });

      const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Generate daily sales data
      const dailySales = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dayStr = d.toISOString().split('T')[0];
        const dayOrders = orders?.filter(order => 
          order.created_at.startsWith(dayStr)
        ) || [];
        
        dailySales.push({
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: dayOrders.reduce((sum, order) => sum + order.total_amount, 0),
          orders: dayOrders.length
        });
      }

      // Mock customer demographics (in real app, get from shipping_address)
      const customerDemographics = [
        { location: "Johannesburg", orders: Math.floor(totalOrders * 0.4), revenue: totalRevenue * 0.4 },
        { location: "Cape Town", orders: Math.floor(totalOrders * 0.3), revenue: totalRevenue * 0.3 },
        { location: "Durban", orders: Math.floor(totalOrders * 0.2), revenue: totalRevenue * 0.2 },
        { location: "Pretoria", orders: Math.floor(totalOrders * 0.1), revenue: totalRevenue * 0.1 }
      ].filter(demo => demo.orders > 0);

      setSalesData({
        totalRevenue,
        totalOrders,
        averageOrderValue,
        revenueChange,
        ordersChange,
        topProducts,
        customerDemographics,
        dailySales,
        monthlySales: [] // Add monthly data logic if needed
      });

    } catch (error) {
      console.error('Error fetching sales data:', error);
      toast({
        title: "Error",
        description: "Failed to load sales data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = (type: 'overview' | 'products' | 'customers') => {
    if (!salesData) return;

    let csvContent = "";
    let filename = "";

    switch (type) {
      case 'overview':
        csvContent = "Metric,Value,Change\n";
        csvContent += `Total Revenue,${salesData.totalRevenue.toFixed(2)},${salesData.revenueChange.toFixed(1)}%\n`;
        csvContent += `Total Orders,${salesData.totalOrders},${salesData.ordersChange.toFixed(1)}%\n`;
        csvContent += `Average Order Value,${salesData.averageOrderValue.toFixed(2)},\n\n`;
        csvContent += "Date,Revenue,Orders\n";
        salesData.dailySales.forEach(day => {
          csvContent += `${day.date},${day.revenue.toFixed(2)},${day.orders}\n`;
        });
        filename = `sales-overview-${dateRange}days.csv`;
        break;

      case 'products':
        csvContent = "Product Name,Revenue,Orders,Quantity Sold\n";
        salesData.topProducts.forEach(product => {
          csvContent += `${product.name},${product.revenue.toFixed(2)},${product.orders},${product.quantity}\n`;
        });
        filename = `top-products-${dateRange}days.csv`;
        break;

      case 'customers':
        csvContent = "Location,Orders,Revenue\n";
        salesData.customerDemographics.forEach(demo => {
          csvContent += `${demo.location},${demo.orders},${demo.revenue.toFixed(2)}\n`;
        });
        filename = `customer-demographics-${dateRange}days.csv`;
        break;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Report Downloaded",
      description: `${filename} has been downloaded successfully.`,
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Sales Analytics...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!salesData) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Sales Analytics
          </h2>
          <p className="text-muted-foreground">Track your performance and optimize your sales</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-foreground">${salesData.totalRevenue.toFixed(2)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {salesData.revenueChange >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs ${salesData.revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {salesData.revenueChange >= 0 ? '+' : ''}{salesData.revenueChange.toFixed(1)}%
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold text-foreground">{salesData.totalOrders}</p>
                <div className="flex items-center gap-1 mt-1">
                  {salesData.ordersChange >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs ${salesData.ordersChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {salesData.ordersChange >= 0 ? '+' : ''}{salesData.ordersChange.toFixed(1)}%
                  </span>
                </div>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold text-foreground">${salesData.averageOrderValue.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">Per order</p>
              </div>
              <Package className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Top Product</p>
                <p className="text-lg font-bold text-foreground truncate">
                  {salesData.topProducts[0]?.name || 'No sales yet'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {salesData.topProducts[0] ? `$${salesData.topProducts[0].revenue.toFixed(2)}` : ''}
                </p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Reports */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Top Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Revenue Trend</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => downloadCSV('overview')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesData.dailySales}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Orders Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData.dailySales}>
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

        <TabsContent value="products">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Top Selling Products</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => downloadCSV('products')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Quantity Sold</TableHead>
                    <TableHead>Avg Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesData.topProducts.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>${product.revenue.toFixed(2)}</TableCell>
                      <TableCell>{product.orders}</TableCell>
                      <TableCell>{product.quantity}</TableCell>
                      <TableCell>${(product.revenue / product.quantity).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Customer Demographics</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => downloadCSV('customers')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Location</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesData.customerDemographics.map((demo, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{demo.location}</TableCell>
                        <TableCell>{demo.orders}</TableCell>
                        <TableCell>${demo.revenue.toFixed(2)}</TableCell>
                        <TableCell>{((demo.revenue / salesData.totalRevenue) * 100).toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Location</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie 
                      data={salesData.customerDemographics}
                      cx="50%" 
                      cy="50%" 
                      outerRadius={80} 
                      dataKey="revenue"
                    >
                      {salesData.customerDemographics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value}`} />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-4">
                  {salesData.customerDemographics.map((demo, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      <div 
                        className="w-2 h-2 rounded-full mr-1"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      {demo.location}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};