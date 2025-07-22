import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, DollarSign, TrendingUp, Share2, Gift, Award, Target, Zap } from "lucide-react";
import { useState, useEffect } from "react";

interface AffiliateStats {
  totalEarnings: number;
  monthlyEarnings: number;
  referrals: number;
  conversionRate: number;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
}

interface AffiliateSectionProps {
  className?: string;
  variant?: 'dashboard' | 'landing' | 'compact';
}

export function AffiliateSection({ 
  className = "",
  variant = 'landing'
}: AffiliateSectionProps) {
  const [stats, setStats] = useState<AffiliateStats>({
    totalEarnings: 0,
    monthlyEarnings: 0,
    referrals: 0,
    conversionRate: 0,
    tier: 'bronze'
  });
  const [isLoading, setIsLoading] = useState(true);

  // Mock affiliate data
  useEffect(() => {
    setTimeout(() => {
      setStats({
        totalEarnings: 2847.50,
        monthlyEarnings: 582.30,
        referrals: 127,
        conversionRate: 12.5,
        tier: 'gold'
      });
      setIsLoading(false);
    }, 1000);
  }, []);

  const tiers = [
    { name: 'Bronze', min: 0, commission: '5%', color: 'text-orange-600', bg: 'bg-orange-100' },
    { name: 'Silver', min: 50, commission: '8%', color: 'text-gray-600', bg: 'bg-gray-100' },
    { name: 'Gold', min: 100, commission: '12%', color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { name: 'Diamond', min: 200, commission: '15%', color: 'text-blue-600', bg: 'bg-blue-100' }
  ];

  const benefits = [
    { icon: DollarSign, title: "Earn Up to 15%", description: "Commission on every sale" },
    { icon: Users, title: "No Limits", description: "Unlimited referrals" },
    { icon: TrendingUp, title: "Real-time Tracking", description: "Monitor your performance" },
    { icon: Gift, title: "Bonus Rewards", description: "Extra incentives for top performers" }
  ];

  if (variant === 'compact') {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Affiliate Program
          </h3>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            Earn 15%
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Share products you love and earn commission on every sale
        </p>
        <Button className="w-full">Join Now</Button>
      </Card>
    );
  }

  if (variant === 'dashboard') {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold text-green-600">
                  ${isLoading ? "0.00" : stats.totalEarnings.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${isLoading ? "0.00" : stats.monthlyEarnings.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Referrals</p>
                <p className="text-2xl font-bold text-purple-600">
                  {isLoading ? "0" : stats.referrals}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold text-orange-600">
                  {isLoading ? "0" : stats.conversionRate}%
                </p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </Card>
        </div>

        {/* Tier Progress */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Affiliate Tier: {stats.tier.charAt(0).toUpperCase() + stats.tier.slice(1)}
          </h3>
          <div className="space-y-4">
            {tiers.map((tier, index) => {
              const isCurrentTier = tier.name.toLowerCase() === stats.tier;
              const isCompleted = stats.referrals >= tier.min;
              
              return (
                <div key={tier.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isCompleted ? tier.bg : 'bg-gray-200'}`} />
                    <span className={`font-medium ${isCurrentTier ? tier.color : 'text-muted-foreground'}`}>
                      {tier.name} ({tier.min}+ referrals)
                    </span>
                  </div>
                  <Badge variant={isCurrentTier ? 'default' : 'secondary'}>
                    {tier.commission}
                  </Badge>
                </div>
              );
            })}
          </div>
          <Progress 
            value={(stats.referrals / 200) * 100} 
            className="mt-4" 
          />
          <p className="text-sm text-muted-foreground mt-2">
            {200 - stats.referrals > 0 
              ? `${200 - stats.referrals} more referrals to reach Diamond tier`
              : "You've reached the highest tier! 🎉"
            }
          </p>
        </Card>
      </div>
    );
  }

  return (
    <section className={`py-16 sm:py-20 ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Share2 className="h-8 w-8 text-primary" />
              <Badge variant="secondary" className="px-3 py-1">
                Earn While You Share
              </Badge>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Join Our Affiliate Program
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Turn your passion for great products into profit. Earn up to 15% commission on every sale you generate.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {benefits.map((benefit, index) => (
              <Card 
                key={index}
                className="p-6 text-center hover:shadow-lg transition-all duration-300 animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <benefit.icon className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </Card>
            ))}
          </div>

          {/* Tier System */}
          <Card className="p-8 mb-12 bg-gradient-to-br from-primary/5 to-secondary/5">
            <h3 className="text-2xl font-bold text-center mb-8">Commission Tiers</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {tiers.map((tier, index) => (
                <div 
                  key={tier.name}
                  className="text-center p-6 rounded-xl bg-background hover:shadow-lg transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className={`w-12 h-12 rounded-full ${tier.bg} ${tier.color} flex items-center justify-center mx-auto mb-4`}>
                    <Award className="h-6 w-6" />
                  </div>
                  <h4 className="font-semibold mb-2">{tier.name}</h4>
                  <p className="text-2xl font-bold text-primary mb-2">{tier.commission}</p>
                  <p className="text-sm text-muted-foreground">
                    {tier.min}+ referrals
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* How It Works */}
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold mb-8">How It Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h4 className="font-semibold mb-2">Sign Up</h4>
                <p className="text-sm text-muted-foreground">
                  Join our affiliate program and get your unique referral link
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h4 className="font-semibold mb-2">Share</h4>
                <p className="text-sm text-muted-foreground">
                  Share products you love on social media, blogs, or with friends
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h4 className="font-semibold mb-2">Earn</h4>
                <p className="text-sm text-muted-foreground">
                  Get paid commission for every sale made through your link
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button 
              size="lg"
              className="px-12 py-6 text-lg bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300"
            >
              <Zap className="h-5 w-5 mr-2" />
              Start Earning Today
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Join 10,000+ affiliates already earning with VillageMarket
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}