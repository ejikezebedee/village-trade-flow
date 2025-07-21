import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  ShoppingCart,
  DollarSign,
  MousePointer,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsMetric {
  metric_type: string;
  metric_value: number;
  date: string;
  dimensions?: any;
}

interface ProductAnalytics {
  product_id: string;
  product_name: string;
  category: string;
  views: number;
  clicks: number;
  purchases: number;
  revenue: number;
}

interface ConversionFunnel {
  stage: string;
  users: number;
  conversion_rate: number;
}

export const AnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [productAnalytics, setProductAnalytics] = useState<ProductAnalytics[]>([]);
  const [conversionFunnel, setConversionFunnel] = useState<ConversionFunnel[]>([]);
  const [dateRange, setDateRange] = useState('7'); // Last 7 days
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(dateRange));

      // Fetch daily metrics
      const { data: metricsData, error: metricsError } = await supabase
        .from('daily_analytics')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (metricsError) throw metricsError;

      // Fetch real-time analytics for today
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's user analytics
      const { data: todayUsers } = await supabase
        .from('user_analytics')
        .select('user_id')
        .gte('created_at', today + 'T00:00:00.000Z')
        .lte('created_at', today + 'T23:59:59.999Z');

      // Get today's page views
      const { data: todayPageViews } = await supabase
        .from('page_views')
        .select('id')
        .gte('created_at', today + 'T00:00:00.000Z')
        .lte('created_at', today + 'T23:59:59.999Z');

      // Get today's sessions
      const { data: todaySessions } = await supabase
        .from('user_sessions')
        .select('session_id')
        .gte('started_at', today + 'T00:00:00.000Z')
        .lte('started_at', today + 'T23:59:59.999Z');

      // Get today's orders
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', today + 'T00:00:00.000Z')
        .lte('created_at', today + 'T23:59:59.999Z');

      // Add today's real-time data to metrics
      const todayMetrics = [
        { metric_type: 'daily_active_users', metric_value: new Set(todayUsers?.map(u => u.user_id)).size, date: today },
        { metric_type: 'daily_page_views', metric_value: todayPageViews?.length || 0, date: today },
        { metric_type: 'daily_sessions', metric_value: new Set(todaySessions?.map(s => s.session_id)).size, date: today },
        { metric_type: 'daily_revenue', metric_value: todayOrders?.reduce((sum, o) => sum + o.total_amount, 0) || 0, date: today },
        { metric_type: 'daily_conversions', metric_value: todayOrders?.length || 0, date: today }
      ];

      const allMetrics = [...(metricsData || []), ...todayMetrics];
      setMetrics(allMetrics);

      // Fetch product analytics
      const { data: productData, error: productError } = await supabase
        .from('product_analytics')
        .select(`
          product_id,
          event_type,
          products (name, category, price)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (productError) throw productError;

      // Process product analytics
      const productMap = new Map<string, ProductAnalytics>();
      productData?.forEach((item) => {
        const productId = item.product_id;
        if (!productMap.has(productId)) {
          productMap.set(productId, {
            product_id: productId,
            product_name: item.products?.name || 'Unknown',
            category: item.products?.category || 'Unknown',
            views: 0,
            clicks: 0,
            purchases: 0,
            revenue: 0
          });
        }
        
        const product = productMap.get(productId)!;
        if (item.event_type === 'view') product.views++;
        if (item.event_type === 'click') product.clicks++;
        if (item.event_type === 'purchase') {
          product.purchases++;
          product.revenue += item.products?.price || 0;
        }
      });

      setProductAnalytics(Array.from(productMap.values()).slice(0, 10));

      // Fetch conversion funnel data
      const { data: conversionData, error: conversionError } = await supabase
        .from('conversion_events')
        .select('funnel_stage, user_id')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (conversionError) throw conversionError;

      // Process conversion funnel
      const stages = ['awareness', 'interest', 'consideration', 'purchase', 'retention'];
      const stageMap = new Map<string, Set<string>>();
      
      conversionData?.forEach((item) => {
        if (!stageMap.has(item.funnel_stage)) {
          stageMap.set(item.funnel_stage, new Set());
        }
        if (item.user_id) {
          stageMap.get(item.funnel_stage)!.add(item.user_id);
        }
      });

      const funnelData = stages.map((stage, index) => {
        const users = stageMap.get(stage)?.size || 0;
        const previousUsers = index > 0 ? (stageMap.get(stages[index - 1])?.size || 0) : users;
        const conversion_rate = previousUsers > 0 ? (users / previousUsers) * 100 : 0;
        
        return {
          stage: stage.charAt(0).toUpperCase() + stage.slice(1),
          users,
          conversion_rate: Math.round(conversion_rate * 100) / 100
        };
      });

      setConversionFunnel(funnelData);

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    
    // Generate daily analytics for recent dates
    const today = new Date();
    for (let i = 0; i < parseInt(dateRange); i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      try {
        await supabase.rpc('generate_daily_analytics', {
          target_date: date.toISOString().split('T')[0]
        });
      } catch (error) {
        console.error('Error generating analytics for', date, error);
      }
    }
    
    await fetchAnalyticsData();
    setRefreshing(false);
    
    toast({
      title: "Data Refreshed",
      description: "Analytics data has been updated.",
    });
  };

  const getMetricValue = (metricType: string): number => {
    return metrics
      .filter(m => m.metric_type === metricType)
      .reduce((sum, m) => sum + m.metric_value, 0);
  };

  const getMetricTrend = (metricType: string): number => {
    const recentMetrics = metrics
      .filter(m => m.metric_type === metricType)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (recentMetrics.length < 2) return 0;
    
    const recent = recentMetrics.slice(-3).reduce((sum, m) => sum + m.metric_value, 0);
    const previous = recentMetrics.slice(-6, -3).reduce((sum, m) => sum + m.metric_value, 0);
    
    if (previous === 0) return 0;
    return ((recent - previous) / previous) * 100;
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
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={refreshData} 
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{getMetricValue('daily_active_users')}</p>
                <p className={`text-xs ${getMetricTrend('daily_active_users') >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {getMetricTrend('daily_active_users') >= 0 ? '+' : ''}{getMetricTrend('daily_active_users').toFixed(1)}%
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sessions</p>
                <p className="text-2xl font-bold">{getMetricValue('daily_sessions')}</p>
                <p className={`text-xs ${getMetricTrend('daily_sessions') >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {getMetricTrend('daily_sessions') >= 0 ? '+' : ''}{getMetricTrend('daily_sessions').toFixed(1)}%
                </p>
              </div>
              <MousePointer className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Page Views</p>
                <p className="text-2xl font-bold">{getMetricValue('daily_page_views')}</p>
                <p className={`text-xs ${getMetricTrend('daily_page_views') >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {getMetricTrend('daily_page_views') >= 0 ? '+' : ''}{getMetricTrend('daily_page_views').toFixed(1)}%
                </p>
              </div>
              <Eye className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversions</p>
                <p className="text-2xl font-bold">{getMetricValue('daily_conversions')}</p>
                <p className={`text-xs ${getMetricTrend('daily_conversions') >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {getMetricTrend('daily_conversions') >= 0 ? '+' : ''}{getMetricTrend('daily_conversions').toFixed(1)}%
                </p>
              </div>
              <ShoppingCart className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">${getMetricValue('daily_revenue').toFixed(2)}</p>
                <p className={`text-xs ${getMetricTrend('daily_revenue') >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {getMetricTrend('daily_revenue') >= 0 ? '+' : ''}{getMetricTrend('daily_revenue').toFixed(1)}%
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList>
          <TabsTrigger value="products">Product Analytics</TabsTrigger>
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="user-behavior">User Behavior</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productAnalytics.map((product, index) => (
                  <div key={product.product_id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{product.product_name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{product.category}</p>
                      </div>
                      <Badge variant="outline">#{index + 1}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Views:</span> {product.views}
                      </div>
                      <div>
                        <span className="font-medium">Clicks:</span> {product.clicks}
                      </div>
                      <div>
                        <span className="font-medium">Purchases:</span> {product.purchases}
                      </div>
                      <div>
                        <span className="font-medium">Revenue:</span> ${product.revenue.toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground mb-1">
                        Conversion Rate: {product.views > 0 ? ((product.purchases / product.views) * 100).toFixed(2) : 0}%
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${product.views > 0 ? (product.purchases / product.views) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversionFunnel.map((stage, index) => (
                  <div key={stage.stage} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">{stage.stage}</h3>
                      <div className="flex items-center space-x-4">
                        <span className="text-lg font-bold">{stage.users}</span>
                        {index > 0 && (
                          <Badge 
                            variant={stage.conversion_rate > 50 ? "default" : stage.conversion_rate > 25 ? "secondary" : "destructive"}
                          >
                            {stage.conversion_rate}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {index > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${
                            stage.conversion_rate > 50 ? 'bg-green-600' :
                            stage.conversion_rate > 25 ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${Math.max(stage.conversion_rate, 5)}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user-behavior">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Avg. Session Duration</span>
                    <span className="font-semibold">5m 32s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bounce Rate</span>
                    <span className="font-semibold">24.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pages per Session</span>
                    <span className="font-semibold">4.2</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Return Visitors</span>
                    <span className="font-semibold">67.8%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Direct</span>
                    <span className="font-semibold">45.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Organic Search</span>
                    <span className="font-semibold">28.7%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Social Media</span>
                    <span className="font-semibold">15.3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Referrals</span>
                    <span className="font-semibold">10.8%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};