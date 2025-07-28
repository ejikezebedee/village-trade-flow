import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Coins,
  Settings,
  Download,
  Calendar,
  BarChart3,
  Wallet,
  CreditCard,
  Star,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EarningsSummary {
  total_commissions: number;
  total_escrow_fees: number;
  total_premium_subscriptions: number;
  total_ad_revenue: number;
  total_earnings: number;
  token_rewards_distributed: number;
  active_premium_sellers: number;
  active_featured_ads: number;
}

export function MonetizationDashboard() {
  const [earnings, setEarnings] = useState<EarningsSummary>({
    total_commissions: 0,
    total_escrow_fees: 0,
    total_premium_subscriptions: 0,
    total_ad_revenue: 0,
    total_earnings: 0,
    token_rewards_distributed: 0,
    active_premium_sellers: 0,
    active_featured_ads: 0
  });
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [recentEarnings, setRecentEarnings] = useState([]);
  const [tokenRewards, setTokenRewards] = useState([]);
  const [monetizationConfig, setMonetizationConfig] = useState({
    transaction_commission: { percent: 5.0, enabled: true },
    escrow_processing_fee: { amount: 1.0, currency: 'USD', enabled: true },
    token_rewards: { buyer_rate: 0.01, seller_rate: 0.05, agent_rate: 0.10, enabled: true }
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchEarningsSummary();
    fetchRecentEarnings();
    fetchTokenRewards();
    fetchMonetizationConfig();
  }, [dateRange]);

  const fetchEarningsSummary = async () => {
    try {
      setLoading(true);
      
      // Get earnings directly from admin_earnings table
      const { data: earningsData, error } = await supabase
        .from('admin_earnings')
        .select('*')
        .gte('created_at', `${dateRange.start}T00:00:00`)
        .lte('created_at', `${dateRange.end}T23:59:59`);

      if (error) throw error;
      
      // Calculate summary manually
      if (earningsData) {
        const summary = earningsData.reduce((acc, earning) => {
          switch (earning.earnings_type) {
            case 'transaction_commission':
              acc.total_commissions += earning.amount;
              break;
            case 'escrow_fee':
              acc.total_escrow_fees += earning.amount;
              break;
            case 'premium_upgrade':
              acc.total_premium_subscriptions += earning.amount;
              break;
            case 'ad_spot':
              acc.total_ad_revenue += earning.amount;
              break;
          }
          acc.total_earnings += earning.amount;
          return acc;
        }, {
          total_commissions: 0,
          total_escrow_fees: 0,
          total_premium_subscriptions: 0,
          total_ad_revenue: 0,
          total_earnings: 0,
          token_rewards_distributed: 0,
          active_premium_sellers: 0,
          active_featured_ads: 0
        });

        // Get token rewards count
        const { data: tokenData } = await supabase
          .from('token_rewards')
          .select('amount')
          .gte('created_at', `${dateRange.start}T00:00:00`)
          .lte('created_at', `${dateRange.end}T23:59:59`);

        if (tokenData) {
          summary.token_rewards_distributed = tokenData.reduce((sum, reward) => sum + reward.amount, 0);
        }

        // Get active premium sellers count
        const { count: premiumCount } = await supabase
          .from('premium_subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Get active featured ads count
        const { count: adsCount } = await supabase
          .from('featured_ads')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .gt('expires_at', new Date().toISOString());

        summary.active_premium_sellers = premiumCount || 0;
        summary.active_featured_ads = adsCount || 0;

        setEarnings(summary);
      }
    } catch (error) {
      console.error('Error fetching earnings summary:', error);
      toast({
        title: "Error",
        description: "Failed to fetch earnings summary",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentEarnings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_earnings')
        .select(`
          *,
          orders(product_name, buyer_id, seller_id)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setRecentEarnings(data || []);
    } catch (error) {
      console.error('Error fetching recent earnings:', error);
    }
  };

  const fetchTokenRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('token_rewards')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTokenRewards(data || []);
    } catch (error) {
      console.error('Error fetching token rewards:', error);
    }
  };

  const fetchMonetizationConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('monetization_config')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      if (data) {
        const configMap = data.reduce((acc, item) => {
          acc[item.config_key] = item.config_value;
          return acc;
        }, {} as Record<string, any>);
        
        setMonetizationConfig(prev => ({ ...prev, ...configMap }));
      }
    } catch (error) {
      console.error('Error fetching monetization config:', error);
    }
  };

  const updateCommissionRate = async (newRate: number) => {
    try {
      const { error } = await supabase
        .from('monetization_config')
        .update({
          config_value: { ...monetizationConfig.transaction_commission, percent: newRate }
        })
        .eq('config_key', 'transaction_commission');

      if (error) throw error;

      toast({
        title: "Commission Rate Updated",
        description: `Platform commission set to ${newRate}%`,
      });

      fetchMonetizationConfig();
    } catch (error) {
      console.error('Error updating commission rate:', error);
      toast({
        title: "Error",
        description: "Failed to update commission rate",
        variant: "destructive"
      });
    }
  };

  const exportEarningsReport = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_earnings')
        .select('*')
        .gte('created_at', `${dateRange.start}T00:00:00`)
        .lte('created_at', `${dateRange.end}T23:59:59`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const csv = [
          ['Date', 'Type', 'Amount', 'Currency', 'Order ID', 'Status'].join(','),
          ...data.map(row => [
            new Date(row.created_at).toLocaleDateString(),
            row.earnings_type,
            row.amount,
            row.currency,
            row.order_id || 'N/A',
            row.payment_status
          ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `earnings-report-${dateRange.start}-to-${dateRange.end}.csv`;
        a.click();
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export earnings report",
        variant: "destructive"
      });
    }
  };

  const getEarningsTypeColor = (type: string) => {
    switch (type) {
      case 'transaction_commission': return 'bg-green-100 text-green-800';
      case 'escrow_fee': return 'bg-blue-100 text-blue-800';
      case 'premium_upgrade': return 'bg-purple-100 text-purple-800';
      case 'ad_spot': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            Monetization Dashboard
          </h2>
          <p className="text-muted-foreground">Platform revenue and commission tracking</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportEarningsReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={fetchEarningsSummary} disabled={loading}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <Label>Date Range:</Label>
            </div>
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-auto"
            />
            <span>to</span>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-auto"
            />
          </div>
        </CardContent>
      </Card>

      {/* Revenue Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">${earnings.total_earnings.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Transaction Commissions</p>
                <p className="text-2xl font-bold">${earnings.total_commissions.toFixed(2)}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Escrow Fees</p>
                <p className="text-2xl font-bold">${earnings.total_escrow_fees.toFixed(2)}</p>
              </div>
              <Wallet className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Premium & Ads</p>
                <p className="text-2xl font-bold">${(earnings.total_premium_subscriptions + earnings.total_ad_revenue).toFixed(2)}</p>
              </div>
              <Star className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Token Rewards Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">$ZSHOP Distributed</p>
                <p className="text-2xl font-bold">{earnings.token_rewards_distributed.toFixed(2)}</p>
              </div>
              <Coins className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Premium Sellers</p>
                <p className="text-2xl font-bold">{earnings.active_premium_sellers}</p>
              </div>
              <Users className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Ads</p>
                <p className="text-2xl font-bold">{earnings.active_featured_ads}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">Commission Settings</TabsTrigger>
          <TabsTrigger value="recent">Recent Earnings</TabsTrigger>
          <TabsTrigger value="tokens">Token Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Monetization Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Transaction Commission (%)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="50"
                      value={monetizationConfig.transaction_commission.percent}
                      onChange={(e) => setMonetizationConfig(prev => ({
                        ...prev,
                        transaction_commission: {
                          ...prev.transaction_commission,
                          percent: parseFloat(e.target.value)
                        }
                      }))}
                    />
                    <Button 
                      size="sm" 
                      onClick={() => updateCommissionRate(monetizationConfig.transaction_commission.percent)}
                    >
                      Update
                    </Button>
                  </div>
                  <Badge variant="secondary">
                    Current: {monetizationConfig.transaction_commission.percent}%
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label>Escrow Processing Fee</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={monetizationConfig.escrow_processing_fee.amount}
                      disabled
                    />
                    <Badge variant="outline">USD</Badge>
                  </div>
                  <Badge variant="secondary">
                    Current: ${monetizationConfig.escrow_processing_fee.amount}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4">Token Reward Rates (per $1)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Buyer Rewards</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={monetizationConfig.token_rewards.buyer_rate}
                      disabled
                    />
                    <Badge variant="secondary">
                      {monetizationConfig.token_rewards.buyer_rate} $ZSHOP
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Label>Seller Rewards</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={monetizationConfig.token_rewards.seller_rate}
                      disabled
                    />
                    <Badge variant="secondary">
                      {monetizationConfig.token_rewards.seller_rate} $ZSHOP
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Label>Agent Rewards</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={monetizationConfig.token_rewards.agent_rate}
                      disabled
                    />
                    <Badge variant="secondary">
                      {monetizationConfig.token_rewards.agent_rate} $ZSHOP
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentEarnings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No earnings data available</p>
                  </div>
                ) : (
                  recentEarnings.map((earning: any) => (
                    <div key={earning.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Badge className={getEarningsTypeColor(earning.earnings_type)}>
                          {earning.earnings_type.replace('_', ' ')}
                        </Badge>
                        <div>
                          <p className="font-medium">${earning.amount.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(earning.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={earning.payment_status === 'completed' ? 'default' : 'secondary'}>
                        {earning.payment_status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tokens">
          <Card>
            <CardHeader>
              <CardTitle>Token Rewards Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tokenRewards.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No token rewards data available</p>
                  </div>
                ) : (
                  tokenRewards.slice(0, 10).map((reward: any) => (
                    <div key={reward.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">
                          {reward.reward_type}
                        </Badge>
                        <div>
                          <p className="font-medium">{reward.amount.toFixed(4)} $ZSHOP</p>
                          <p className="text-sm text-muted-foreground">
                            From ${reward.source_amount.toFixed(2)} purchase
                          </p>
                        </div>
                      </div>
                      <Badge variant={reward.status === 'claimed' ? 'default' : 'secondary'}>
                        {reward.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}