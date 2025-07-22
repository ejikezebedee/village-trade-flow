import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/marketplace/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Users, TrendingUp, Gift, Zap, DollarSign, Trophy, Star, CheckCircle } from "lucide-react";

interface AffiliateTier {
  id: string;
  tier_name: string;
  commission_rate: number;
  min_referrals: number;
  min_sales: number;
  benefits: any;
  is_active: boolean;
}

const AffiliatePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [tiers, setTiers] = useState<AffiliateTier[]>([]);
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTiers();
    if (user) {
      checkAffiliateStatus();
    }
  }, [user]);

  const fetchTiers = async () => {
    try {
      const { data, error } = await supabase
        .from('affiliate_tiers')
        .select('*')
        .eq('is_active', true)
        .order('commission_rate', { ascending: true });

      if (error) throw error;
      setTiers(data || []);
    } catch (error) {
      console.error('Error fetching tiers:', error);
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

  const handleJoinAffiliate = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (isAffiliate) {
      navigate('/affiliate-dashboard');
      return;
    }

    setLoading(true);
    try {
      // Generate referral code
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_referral_code');

      if (codeError) throw codeError;

      // Create affiliate profile
      const { error: affiliateError } = await supabase
        .from('affiliates')
        .insert({
          user_id: user.id,
          referral_code: codeData,
          commission_tier: 'bronze',
          status: 'active'
        });

      if (affiliateError) throw affiliateError;

      toast({
        title: "Welcome to our Affiliate Program!",
        description: "Your affiliate account has been created successfully.",
      });

      navigate('/affiliate-dashboard');
    } catch (error: any) {
      console.error('Error joining affiliate program:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to join affiliate program",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTierIcon = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'bronze': return <Trophy className="w-8 h-8 text-amber-600" />;
      case 'silver': return <Trophy className="w-8 h-8 text-gray-400" />;
      case 'gold': return <Trophy className="w-8 h-8 text-yellow-500" />;
      case 'diamond': return <Star className="w-8 h-8 text-blue-500" />;
      default: return <Trophy className="w-8 h-8 text-primary" />;
    }
  };

  const getTierColor = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'bronze': return 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200';
      case 'silver': return 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200';
      case 'gold': return 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200';
      case 'diamond': return 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200';
      default: return 'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-16 px-4 bg-gradient-to-br from-primary/10 via-background to-primary/5">
          <div className="container mx-auto text-center max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Join Our Affiliate Program
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Turn your passion for great products into profit. Earn up to 15% commission
              on every sale you generate.
            </p>
            <Button 
              size="lg" 
              onClick={handleJoinAffiliate}
              disabled={loading}
              className="px-8 py-6 text-lg"
            >
              <Zap className="w-5 h-5 mr-2" />
              {isAffiliate ? 'Go to Dashboard' : 'Start Earning Today'}
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Join 10,000+ affiliates already earning with VillageMarket
            </p>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              <Card className="text-center p-6 border-none shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
                <DollarSign className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Earn Up To 15%</h3>
                <p className="text-muted-foreground">Commission on every sale</p>
              </Card>
              <Card className="text-center p-6 border-none shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
                <Users className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Limits</h3>
                <p className="text-muted-foreground">Unlimited referrals</p>
              </Card>
              <Card className="text-center p-6 border-none shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
                <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Real-time Tracking</h3>
                <p className="text-muted-foreground">Monitor your performance</p>
              </Card>
              <Card className="text-center p-6 border-none shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
                <Gift className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Bonus Rewards</h3>
                <p className="text-muted-foreground">Extra incentives for top performers</p>
              </Card>
            </div>
          </div>
        </section>

        {/* Commission Tiers */}
        <section className="py-16 px-4 bg-gradient-to-br from-background to-primary/5">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Commission Tiers</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Unlock higher commission rates as you grow your referrals and sales
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {tiers.map((tier) => (
                <Card 
                  key={tier.id} 
                  className={`relative overflow-hidden transition-all hover:scale-105 hover:shadow-xl ${getTierColor(tier.tier_name)}`}
                >
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                      {getTierIcon(tier.tier_name)}
                    </div>
                    <CardTitle className="text-2xl font-bold capitalize mb-2">
                      {tier.tier_name}
                    </CardTitle>
                    <div className="text-4xl font-bold text-primary mb-2">
                      {Math.round(tier.commission_rate * 100)}%
                    </div>
                    <CardDescription>
                      {tier.min_referrals}+ referrals
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {tier.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{benefit}</span>
                        </div>
                      ))}
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full mt-6"
                      onClick={() => navigate(`/affiliate-tiers/${tier.tier_name}`)}
                    >
                      Learn More
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-4">Sign Up</h3>
                <p className="text-muted-foreground">
                  Join our affiliate program and get your unique referral link
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-4">Share</h3>
                <p className="text-muted-foreground">
                  Share products you love on social media, blogs, or with friends
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-4">Earn</h3>
                <p className="text-muted-foreground">
                  Get paid commission for every sale made through your link
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 bg-gradient-to-r from-primary to-primary/80 text-white">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Start Earning?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of successful affiliates who are already earning with our program
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={handleJoinAffiliate}
              disabled={loading}
              className="px-8 py-6 text-lg"
            >
              <Zap className="w-5 h-5 mr-2" />
              {isAffiliate ? 'Go to Dashboard' : 'Join Now - It\'s Free'}
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AffiliatePage;