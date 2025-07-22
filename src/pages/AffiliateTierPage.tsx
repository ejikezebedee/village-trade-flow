import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/marketplace/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Trophy, Star, CheckCircle, Users, DollarSign, TrendingUp } from "lucide-react";

interface TierData {
  id: string;
  tier_name: string;
  commission_rate: number;
  min_referrals: number;
  min_sales: number;
  benefits: any;
  is_active: boolean;
}

const AffiliateTierPage = () => {
  const { tierName } = useParams<{ tierName: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tier, setTier] = useState<TierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAffiliate, setIsAffiliate] = useState(false);

  useEffect(() => {
    if (tierName) {
      fetchTierData();
    }
    if (user) {
      checkAffiliateStatus();
    }
  }, [tierName, user]);

  const fetchTierData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('affiliate_tiers')
        .select('*')
        .eq('tier_name', tierName?.toLowerCase())
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching tier:', error);
        navigate('/affiliate');
        return;
      }

      setTier(data);
    } catch (error) {
      console.error('Error:', error);
      navigate('/affiliate');
    } finally {
      setLoading(false);
    }
  };

  const checkAffiliateStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('affiliates')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      setIsAffiliate(!!data);
    } catch (error) {
      console.error('Error checking affiliate status:', error);
    }
  };

  const getTierIcon = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'bronze': return <Trophy className="w-16 h-16 text-amber-600" />;
      case 'silver': return <Trophy className="w-16 h-16 text-gray-400" />;
      case 'gold': return <Trophy className="w-16 h-16 text-yellow-500" />;
      case 'diamond': return <Star className="w-16 h-16 text-blue-500" />;
      default: return <Trophy className="w-16 h-16 text-primary" />;
    }
  };

  const getTierGradient = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'bronze': return 'bg-gradient-to-br from-amber-500 to-amber-700';
      case 'silver': return 'bg-gradient-to-br from-gray-400 to-gray-600';
      case 'gold': return 'bg-gradient-to-br from-yellow-400 to-yellow-600';
      case 'diamond': return 'bg-gradient-to-br from-blue-400 to-blue-600';
      default: return 'bg-gradient-to-br from-primary to-primary/80';
    }
  };

  const handleJoinAffiliate = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (isAffiliate) {
      navigate('/affiliate-dashboard');
    } else {
      navigate('/affiliate');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-16 flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading tier information...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!tier) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-16 flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <p className="mb-4">Tier not found</p>
            <Button onClick={() => navigate('/affiliate')}>
              Back to Affiliate Program
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        {/* Header Section */}
        <section className="py-8 px-4 border-b">
          <div className="container mx-auto">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/affiliate')}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Affiliate Program
            </Button>
            
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0">
                {getTierIcon(tier.tier_name)}
              </div>
              <div>
                <h1 className="text-4xl font-bold capitalize mb-2">
                  {tier.tier_name} Tier
                </h1>
                <p className="text-xl text-muted-foreground">
                  Earn {Math.round(tier.commission_rate * 100)}% commission on every sale
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Hero Section */}
        <section className={`py-16 px-4 ${getTierGradient(tier.tier_name)} text-white`}>
          <div className="container mx-auto text-center">
            <div className="max-w-4xl mx-auto">
              <div className="text-6xl font-bold mb-4">
                {Math.round(tier.commission_rate * 100)}%
              </div>
              <p className="text-xl mb-8 opacity-90">
                Commission Rate for {tier.tier_name.charAt(0).toUpperCase() + tier.tier_name.slice(1)} Members
              </p>
              
              <div className="grid md:grid-cols-3 gap-8 mt-12">
                <div className="text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-90" />
                  <div className="text-2xl font-bold">{tier.min_referrals}+</div>
                  <div className="opacity-90">Referrals Required</div>
                </div>
                <div className="text-center">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-90" />
                  <div className="text-2xl font-bold">${tier.min_sales.toLocaleString()}</div>
                  <div className="opacity-90">Sales Volume</div>
                </div>
                <div className="text-center">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-90" />
                  <div className="text-2xl font-bold">{Math.round(tier.commission_rate * 100)}%</div>
                  <div className="opacity-90">Commission Rate</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">
                {tier.tier_name.charAt(0).toUpperCase() + tier.tier_name.slice(1)} Tier Benefits
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Exclusive Benefits</CardTitle>
                    <CardDescription>
                      Everything included in your {tier.tier_name} membership
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Array.isArray(tier.benefits) && tier.benefits.map((benefit: string, index: number) => (
                        <div key={index} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>How to Qualify</CardTitle>
                    <CardDescription>
                      Requirements to reach {tier.tier_name} tier status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Referrals</span>
                          <Badge variant="outline">{tier.min_referrals}+ required</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Refer at least {tier.min_referrals} new customers to our platform
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Sales Volume</span>
                          <Badge variant="outline">${tier.min_sales.toLocaleString()}+ required</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Generate ${tier.min_sales.toLocaleString()} in total sales through your referrals
                        </div>
                      </div>

                      <div className="p-4 bg-primary/10 rounded-lg">
                        <p className="text-sm font-medium text-primary">
                          Tier Status Updates Automatically
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Your tier will be updated automatically when you meet the requirements
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="py-16 px-4 bg-gradient-to-br from-background to-primary/5">
          <div className="container mx-auto">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-8">Ready to Start Earning?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join our affiliate program and start earning commissions today. 
                You'll automatically advance through tiers as you grow your referrals.
              </p>
              
              <div className="flex justify-center gap-4">
                <Button 
                  size="lg" 
                  onClick={handleJoinAffiliate}
                  className="px-8"
                >
                  {isAffiliate ? 'Go to Dashboard' : 'Join Affiliate Program'}
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate('/affiliate')}
                  className="px-8"
                >
                  View All Tiers
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AffiliateTierPage;