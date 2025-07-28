import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Crown, 
  Star, 
  DollarSign, 
  Calendar, 
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PremiumSubscription {
  id: string;
  seller_id: string;
  subscription_type: string;
  amount: number;
  currency: string;
  billing_cycle: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  auto_renew: boolean;
  cancelled_at?: string;
  created_at: string;
}

interface FeaturedAd {
  id: string;
  product_id: string;
  seller_id: string;
  ad_type: string;
  amount_paid: number;
  currency: string;
  duration_days: number;
  status: string;
  starts_at: string;
  expires_at: string;
  created_at: string;
}

export function PremiumSellerManagement() {
  const [subscriptions, setSubscriptions] = useState<PremiumSubscription[]>([]);
  const [featuredAds, setFeaturedAds] = useState<FeaturedAd[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    active_premium_sellers: 0,
    total_premium_revenue: 0,
    active_featured_ads: 0,
    total_ad_revenue: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch premium subscriptions
      const { data: subscriptionsData, error: subError } = await supabase
        .from('premium_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (subError) throw subError;

      // Fetch featured ads
      const { data: adsData, error: adsError } = await supabase
        .from('featured_ads')
        .select('*')
        .order('created_at', { ascending: false });

      if (adsError) throw adsError;

      setSubscriptions(subscriptionsData || []);
      setFeaturedAds(adsData || []);

      // Calculate stats
      const activePremium = (subscriptionsData || []).filter(sub => sub.status === 'active').length;
      const totalPremiumRevenue = (subscriptionsData || []).reduce((sum, sub) => sum + sub.amount, 0);
      const activeAds = (adsData || []).filter(ad => ad.status === 'active' && new Date(ad.expires_at) > new Date()).length;
      const totalAdRevenue = (adsData || []).reduce((sum, ad) => sum + ad.amount_paid, 0);

      setStats({
        active_premium_sellers: activePremium,
        total_premium_revenue: totalPremiumRevenue,
        active_featured_ads: activeAds,
        total_ad_revenue: totalAdRevenue
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch premium seller data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createPremiumSubscription = async (sellerId: string, subscriptionType: string) => {
    try {
      const pricing = subscriptionType === 'monthly' ? 10.0 : 100.0;
      const periodEnd = subscriptionType === 'monthly' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      const { error } = await supabase
        .from('premium_subscriptions')
        .insert({
          seller_id: sellerId,
          subscription_type: 'premium_seller',
          amount: pricing,
          currency: 'USD',
          billing_cycle: subscriptionType,
          status: 'active',
          current_period_end: periodEnd.toISOString()
        });

      if (error) throw error;

      // Record admin earning
      await supabase
        .from('admin_earnings')
        .insert({
          earnings_type: 'premium_upgrade',
          amount: pricing,
          currency: 'USD',
          seller_id: sellerId,
          metadata: {
            subscription_type: subscriptionType,
            processed_at: new Date().toISOString()
          }
        });

      toast({
        title: "Premium Subscription Created",
        description: `Premium ${subscriptionType} subscription created for seller`,
      });

      fetchData();
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: "Error",
        description: "Failed to create premium subscription",
        variant: "destructive"
      });
    }
  };

  const createFeaturedAd = async (productId: string, sellerId: string, adType: string) => {
    try {
      const pricing = adType === 'homepage_featured' ? 4.0 : 2.0;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const { error } = await supabase
        .from('featured_ads')
        .insert({
          product_id: productId,
          seller_id: sellerId,
          ad_type: adType,
          amount_paid: pricing,
          currency: 'USD',
          duration_days: 7,
          status: 'active',
          expires_at: expiresAt.toISOString()
        });

      if (error) throw error;

      // Record admin earning
      await supabase
        .from('admin_earnings')
        .insert({
          earnings_type: 'ad_spot',
          amount: pricing,
          currency: 'USD',
          seller_id: sellerId,
          metadata: {
            ad_type: adType,
            product_id: productId,
            processed_at: new Date().toISOString()
          }
        });

      toast({
        title: "Featured Ad Created",
        description: `${adType} ad created for product`,
      });

      fetchData();
    } catch (error) {
      console.error('Error creating featured ad:', error);
      toast({
        title: "Error",
        description: "Failed to create featured ad",
        variant: "destructive"
      });
    }
  };

  const cancelSubscription = async (subscriptionId: string) => {
    try {
      const { error } = await supabase
        .from('premium_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      toast({
        title: "Subscription Cancelled",
        description: "Premium subscription has been cancelled",
      });

      fetchData();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="h-6 w-6 text-primary" />
            Premium Seller Management
          </h2>
          <p className="text-muted-foreground">Manage premium subscriptions and featured ads</p>
        </div>
        <Button onClick={fetchData} disabled={loading}>
          <TrendingUp className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Premium Sellers</p>
                <p className="text-2xl font-bold">{stats.active_premium_sellers}</p>
              </div>
              <Crown className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Premium Revenue</p>
                <p className="text-2xl font-bold">${stats.total_premium_revenue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Ads</p>
                <p className="text-2xl font-bold">{stats.active_featured_ads}</p>
              </div>
              <Star className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ad Revenue</p>
                <p className="text-2xl font-bold">${stats.total_ad_revenue.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subscriptions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subscriptions">Premium Subscriptions</TabsTrigger>
          <TabsTrigger value="ads">Featured Ads</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>Premium Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subscriptions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Crown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No premium subscriptions found</p>
                  </div>
                ) : (
                  subscriptions.map((subscription) => (
                    <div key={subscription.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4">
                          <Badge className={getStatusColor(subscription.status)}>
                            {subscription.status}
                          </Badge>
                          <div>
                            <p className="font-medium">{subscription.billing_cycle} Premium</p>
                            <p className="text-sm text-muted-foreground">
                              Seller ID: {subscription.seller_id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">${subscription.amount.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">
                            {subscription.currency}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Created:</span>{' '}
                          {new Date(subscription.created_at).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Expires:</span>{' '}
                          {new Date(subscription.current_period_end).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Auto Renew:</span>{' '}
                          {subscription.auto_renew ? 'Yes' : 'No'}
                        </div>
                        <div>
                          <span className="font-medium">Type:</span>{' '}
                          {subscription.subscription_type}
                        </div>
                      </div>

                      {subscription.status === 'active' && (
                        <div className="flex justify-end mt-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => cancelSubscription(subscription.id)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel Subscription
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ads">
          <Card>
            <CardHeader>
              <CardTitle>Featured Ads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {featuredAds.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No featured ads found</p>
                  </div>
                ) : (
                  featuredAds.map((ad) => (
                    <div key={ad.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4">
                          <Badge className={getStatusColor(ad.status)}>
                            {ad.status}
                          </Badge>
                          <div>
                            <p className="font-medium">{ad.ad_type.replace('_', ' ')}</p>
                            <p className="text-sm text-muted-foreground">
                              Product ID: {ad.product_id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">${ad.amount_paid.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">
                            {ad.duration_days} days
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Starts:</span>{' '}
                          {new Date(ad.starts_at).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Expires:</span>{' '}
                          {new Date(ad.expires_at).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Type:</span>{' '}
                          {ad.ad_type}
                        </div>
                        <div>
                          <span className="font-medium">Seller:</span>{' '}
                          {ad.seller_id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Create Premium Subscription
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Seller ID</Label>
                  <Input
                    id="seller-id"
                    placeholder="Enter seller UUID"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Billing Cycle</Label>
                  <select className="w-full px-3 py-2 border rounded-md">
                    <option value="monthly">Monthly ($10)</option>
                    <option value="yearly">Yearly ($100)</option>
                  </select>
                </div>
                <Button className="w-full">
                  <Crown className="h-4 w-4 mr-2" />
                  Create Premium Subscription
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Create Featured Ad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Product ID</Label>
                  <Input
                    id="product-id"
                    placeholder="Enter product UUID"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Seller ID</Label>
                  <Input
                    id="ad-seller-id"
                    placeholder="Enter seller UUID"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ad Type</Label>
                  <select className="w-full px-3 py-2 border rounded-md">
                    <option value="homepage_featured">Homepage Featured ($4)</option>
                    <option value="category_top">Category Top ($2)</option>
                  </select>
                </div>
                <Button className="w-full">
                  <Star className="h-4 w-4 mr-2" />
                  Create Featured Ad
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}