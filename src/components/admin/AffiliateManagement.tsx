import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, DollarSign, TrendingUp, CreditCard, Search, Filter, Check, X } from "lucide-react";

interface AffiliateStats {
  totalAffiliates: number;
  totalEarnings: number;
  pendingPayouts: number;
  totalSales: number;
}

interface Affiliate {
  id: string;
  user_id: string;
  referral_code: string;
  commission_tier: string;
  total_referrals: number;
  total_sales: number;
  total_earnings: number;
  pending_earnings: number;
  status: string;
  created_at: string;
  profiles?: any;
}

interface PayoutRequest {
  id: string;
  affiliate_id: string;
  requested_amount: number;
  status: string;
  requested_at: string;
  affiliates: {
    referral_code: string;
    profiles: any;
  };
}

interface TierSettings {
  id: string;
  tier_name: string;
  commission_rate: number;
  min_referrals: number;
  min_sales: number;
  is_active: boolean;
}

const AffiliateManagement = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<AffiliateStats>({
    totalAffiliates: 0,
    totalEarnings: 0,
    pendingPayouts: 0,
    totalSales: 0
  });
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [tiers, setTiers] = useState<TierSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchAffiliates(),
        fetchPayouts(),
        fetchTiers()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load affiliate data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const { data: affiliateData } = await supabase
      .from('affiliates')
      .select('total_earnings, pending_earnings, total_sales');

    if (affiliateData) {
      const totalAffiliates = affiliateData.length;
      const totalEarnings = affiliateData.reduce((sum, a) => sum + a.total_earnings, 0);
      const pendingPayouts = affiliateData.reduce((sum, a) => sum + a.pending_earnings, 0);
      const totalSales = affiliateData.reduce((sum, a) => sum + a.total_sales, 0);

      setStats({
        totalAffiliates,
        totalEarnings,
        pendingPayouts,
        totalSales
      });
    }
  };

  const fetchAffiliates = async () => {
    const { data, error } = await supabase
      .from('affiliates')
      .select(`
        *,
        profiles:user_id (
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setAffiliates(data || []);
  };

  const fetchPayouts = async () => {
    const { data, error } = await supabase
      .from('affiliate_payouts')
      .select(`
        *,
        affiliates (
          referral_code,
          profiles:user_id (
            first_name,
            last_name
          )
        )
      `)
      .order('requested_at', { ascending: false });

    if (error) throw error;
    setPayouts(data || []);
  };

  const fetchTiers = async () => {
    const { data, error } = await supabase
      .from('affiliate_tiers')
      .select('*')
      .order('commission_rate', { ascending: true });

    if (error) throw error;
    setTiers(data || []);
  };

  const updatePayoutStatus = async (payoutId: string, status: string, adminNotes?: string) => {
    try {
      const { error } = await supabase
        .from('affiliate_payouts')
        .update({
          status,
          admin_notes: adminNotes,
          processed_at: status === 'completed' ? new Date().toISOString() : null,
          processed_by: status === 'completed' ? (await supabase.auth.getUser()).data.user?.id : null
        })
        .eq('id', payoutId);

      if (error) throw error;

      // If completing payout, update affiliate earnings
      if (status === 'completed') {
        const payout = payouts.find(p => p.id === payoutId);
        if (payout) {
          // Get current affiliate data
          const { data: currentAffiliate } = await supabase
            .from('affiliates')
            .select('paid_earnings')
            .eq('id', payout.affiliate_id)
            .single();

          const { error: affiliateError } = await supabase
            .from('affiliates')
            .update({
              pending_earnings: 0,
              paid_earnings: (currentAffiliate?.paid_earnings || 0) + payout.requested_amount
            })
            .eq('id', payout.affiliate_id);

          if (affiliateError) throw affiliateError;
        }
      }

      toast({
        title: "Success",
        description: `Payout ${status === 'completed' ? 'approved' : 'rejected'} successfully`,
      });

      fetchData();
    } catch (error: any) {
      console.error('Error updating payout:', error);
      toast({
        title: "Error",
        description: "Failed to update payout status",
        variant: "destructive",
      });
    }
  };

  const updateTierSettings = async (tierId: string, updates: Partial<TierSettings>) => {
    try {
      const { error } = await supabase
        .from('affiliate_tiers')
        .update(updates)
        .eq('id', tierId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tier settings updated successfully",
      });

      fetchTiers();
    } catch (error: any) {
      console.error('Error updating tier:', error);
      toast({
        title: "Error",
        description: "Failed to update tier settings",
        variant: "destructive",
      });
    }
  };

  const filteredAffiliates = affiliates.filter(affiliate => {
    const name = `${affiliate.profiles?.first_name || ''} ${affiliate.profiles?.last_name || ''}`.toLowerCase();
    const code = affiliate.referral_code.toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || code.includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading affiliate data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Affiliate Management</h2>
        <p className="text-muted-foreground">
          Manage affiliates, process payouts, and configure commission tiers
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Affiliates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAffiliates}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ${stats.pendingPayouts.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalSales.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="affiliates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="tiers">Tier Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="affiliates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Affiliate List</CardTitle>
                  <CardDescription>Manage all affiliate accounts</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search affiliates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Affiliate</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Referrals</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead>Earnings</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAffiliates.map((affiliate) => (
                    <TableRow key={affiliate.id}>
                      <TableCell>
                        {affiliate.profiles?.first_name} {affiliate.profiles?.last_name}
                      </TableCell>
                      <TableCell className="font-mono">
                        {affiliate.referral_code}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {affiliate.commission_tier}
                        </Badge>
                      </TableCell>
                      <TableCell>{affiliate.total_referrals}</TableCell>
                      <TableCell>${affiliate.total_sales.toFixed(2)}</TableCell>
                      <TableCell>${affiliate.total_earnings.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={affiliate.status === 'active' ? 'default' : 'secondary'}>
                          {affiliate.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payout Requests</CardTitle>
              <CardDescription>Review and process affiliate payout requests</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Affiliate</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {payout.affiliates.profiles?.first_name} {payout.affiliates.profiles?.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {payout.affiliates.referral_code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${payout.requested_amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {new Date(payout.requested_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            payout.status === 'completed' ? 'default' : 
                            payout.status === 'processing' ? 'secondary' : 'outline'
                          }
                        >
                          {payout.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payout.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => updatePayoutStatus(payout.id, 'completed')}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updatePayoutStatus(payout.id, 'rejected', 'Rejected by admin')}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tiers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Commission Tier Settings</CardTitle>
              <CardDescription>Configure commission rates and requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tiers.map((tier) => (
                  <div key={tier.id} className="border rounded-lg p-4">
                    <div className="grid md:grid-cols-5 gap-4">
                      <div>
                        <Label>Tier Name</Label>
                        <Input 
                          value={tier.tier_name}
                          onChange={(e) => {
                            const updatedTiers = tiers.map(t => 
                              t.id === tier.id ? { ...t, tier_name: e.target.value } : t
                            );
                            setTiers(updatedTiers);
                          }}
                          className="capitalize"
                        />
                      </div>
                      <div>
                        <Label>Commission Rate (%)</Label>
                        <Input 
                          type="number"
                          value={tier.commission_rate * 100}
                          onChange={(e) => {
                            const updatedTiers = tiers.map(t => 
                              t.id === tier.id ? { ...t, commission_rate: parseFloat(e.target.value) / 100 } : t
                            );
                            setTiers(updatedTiers);
                          }}
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <Label>Min Referrals</Label>
                        <Input 
                          type="number"
                          value={tier.min_referrals}
                          onChange={(e) => {
                            const updatedTiers = tiers.map(t => 
                              t.id === tier.id ? { ...t, min_referrals: parseInt(e.target.value) } : t
                            );
                            setTiers(updatedTiers);
                          }}
                          min="0"
                        />
                      </div>
                      <div>
                        <Label>Min Sales ($)</Label>
                        <Input 
                          type="number"
                          value={tier.min_sales}
                          onChange={(e) => {
                            const updatedTiers = tiers.map(t => 
                              t.id === tier.id ? { ...t, min_sales: parseFloat(e.target.value) } : t
                            );
                            setTiers(updatedTiers);
                          }}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          onClick={() => updateTierSettings(tier.id, tier)}
                          className="w-full"
                        >
                          Update
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AffiliateManagement;