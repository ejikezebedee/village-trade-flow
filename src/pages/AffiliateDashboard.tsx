import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/marketplace/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Copy, Users, DollarSign, TrendingUp, Gift, Download, ExternalLink, CreditCard } from "lucide-react";

interface AffiliateData {
  id: string;
  referral_code: string;
  commission_tier: string;
  total_referrals: number;
  total_sales: number;
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  status: string;
}

interface ReferralData {
  id: string;
  referred_user_id: string;
  conversion_status: string;
  created_at: string;
  converted_at: string;
}

interface CommissionData {
  id: string;
  commission_amount: number;
  order_amount: number;
  commission_rate: number;
  status: string;
  created_at: string;
}

interface PayoutData {
  id: string;
  requested_amount: number;
  status: string;
  requested_at: string;
  processed_at: string;
}

const AffiliateDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [commissions, setCommissions] = useState<CommissionData[]>([]);
  const [payouts, setPayouts] = useState<PayoutData[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchAffiliateData();
  }, [user, navigate]);

  const fetchAffiliateData = async () => {
    try {
      setLoading(true);
      
      // Fetch affiliate profile
      const { data: affiliateData, error: affiliateError } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (affiliateError) {
        if (affiliateError.code === 'PGRST116') {
          navigate('/affiliate');
          return;
        }
        throw affiliateError;
      }

      setAffiliate(affiliateData);

      // Fetch referrals
      const { data: referralsData, error: referralsError } = await supabase
        .from('affiliate_referrals')
        .select('*')
        .eq('affiliate_id', affiliateData.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (referralsError) throw referralsError;
      setReferrals(referralsData || []);

      // Fetch commissions
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('affiliate_commissions')
        .select('*')
        .eq('affiliate_id', affiliateData.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (commissionsError) throw commissionsError;
      setCommissions(commissionsData || []);

      // Fetch payouts
      const { data: payoutsData, error: payoutsError } = await supabase
        .from('affiliate_payouts')
        .select('*')
        .eq('affiliate_id', affiliateData.id)
        .order('requested_at', { ascending: false });

      if (payoutsError) throw payoutsError;
      setPayouts(payoutsData || []);

    } catch (error: any) {
      console.error('Error fetching affiliate data:', error);
      toast({
        title: "Error",
        description: "Failed to load affiliate data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (!affiliate) return;
    
    const referralLink = `${window.location.origin}?ref=${affiliate.referral_code}`;
    navigator.clipboard.writeText(referralLink);
    
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    });
  };

  const requestPayout = async () => {
    if (!affiliate || !payoutAmount) return;

    const amount = parseFloat(payoutAmount);
    if (amount <= 0 || amount > affiliate.pending_earnings) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount within your pending earnings",
        variant: "destructive",
      });
      return;
    }

    setPayoutLoading(true);
    try {
      const { error } = await supabase
        .from('affiliate_payouts')
        .insert({
          affiliate_id: affiliate.id,
          requested_amount: amount,
          payment_method: 'bank_transfer',
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Payout Requested",
        description: "Your payout request has been submitted for review",
      });

      setPayoutAmount("");
      fetchAffiliateData();
    } catch (error: any) {
      console.error('Error requesting payout:', error);
      toast({
        title: "Error",
        description: "Failed to request payout",
        variant: "destructive",
      });
    } finally {
      setPayoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-16 flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading dashboard...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-16 flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <p className="mb-4">You are not enrolled in our affiliate program.</p>
            <Button onClick={() => navigate('/affiliate')}>
              Join Affiliate Program
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const referralLink = `${window.location.origin}?ref=${affiliate.referral_code}`;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Affiliate Dashboard</h1>
                <p className="text-muted-foreground">
                  Welcome back! Track your performance and earnings here.
                </p>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-2 capitalize">
                {affiliate.commission_tier} Tier
              </Badge>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{affiliate.total_referrals}</div>
                <p className="text-xs text-muted-foreground">
                  Lifetime referrals
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${affiliate.total_sales.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Revenue generated
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  ${affiliate.pending_earnings.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Available for payout
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${affiliate.total_earnings.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Lifetime earnings
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="referrals">Referrals</TabsTrigger>
              <TabsTrigger value="commissions">Commissions</TabsTrigger>
              <TabsTrigger value="payouts">Payouts</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Referral Link</CardTitle>
                    <CardDescription>
                      Share this link to earn commissions on sales
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input 
                        value={referralLink}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button onClick={copyReferralLink} size="icon">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Referral Code: <span className="font-mono font-bold">{affiliate.referral_code}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Request Payout</CardTitle>
                    <CardDescription>
                      Minimum payout amount: $50.00
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        max={affiliate.pending_earnings}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Available: ${affiliate.pending_earnings.toFixed(2)}
                      </p>
                    </div>
                    <Button 
                      onClick={requestPayout}
                      disabled={payoutLoading || parseFloat(payoutAmount) < 50}
                      className="w-full"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Request Payout
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="referrals" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Referrals</CardTitle>
                  <CardDescription>
                    Track your latest referrals and their conversion status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {referrals.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No referrals yet. Start sharing your link to see results here!
                      </p>
                    ) : (
                      referrals.map((referral) => (
                        <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">
                              Referral #{referral.id.slice(0, 8)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(referral.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge 
                            variant={referral.conversion_status === 'converted' ? 'default' : 'secondary'}
                          >
                            {referral.conversion_status}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="commissions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Commission History</CardTitle>
                  <CardDescription>
                    View all your commission earnings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {commissions.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No commissions earned yet. Keep sharing to start earning!
                      </p>
                    ) : (
                      commissions.map((commission) => (
                        <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">
                              ${commission.commission_amount.toFixed(2)} commission
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {Math.round(commission.commission_rate * 100)}% of ${commission.order_amount.toFixed(2)} • {new Date(commission.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge 
                            variant={commission.status === 'paid' ? 'default' : 'secondary'}
                          >
                            {commission.status}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payouts" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payout History</CardTitle>
                  <CardDescription>
                    Track your payout requests and payments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {payouts.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No payout requests yet.
                      </p>
                    ) : (
                      payouts.map((payout) => (
                        <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">
                              ${payout.requested_amount.toFixed(2)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Requested: {new Date(payout.requested_at).toLocaleDateString()}
                              {payout.processed_at && ` • Processed: ${new Date(payout.processed_at).toLocaleDateString()}`}
                            </p>
                          </div>
                          <Badge 
                            variant={
                              payout.status === 'completed' ? 'default' : 
                              payout.status === 'processing' ? 'secondary' : 'outline'
                            }
                          >
                            {payout.status}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tools" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Promotional Materials</CardTitle>
                    <CardDescription>
                      Download banners and marketing materials
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="w-4 h-4 mr-2" />
                      Download Banner Pack
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="w-4 h-4 mr-2" />
                      Social Media Kit
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Product Catalog
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>
                      Useful tools and shortcuts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => navigate('/affiliate-tiers')}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      View All Tiers
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Gift className="w-4 h-4 mr-2" />
                      Referral Tips
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Affiliate Guide
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AffiliateDashboard;