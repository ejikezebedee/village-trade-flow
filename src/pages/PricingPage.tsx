import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Globe, CreditCard, Truck, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';

const PricingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Globe,
      title: "Global Reach",
      description: "Connect buyers and sellers across Nigeria and beyond"
    },
    {
      icon: CreditCard,
      title: "Secure Payments",
      description: "PayPal integration with regional payment options coming soon"
    },
    {
      icon: Truck,
      title: "Delivery Network",
      description: "Community-driven delivery with driver bidding system"
    },
    {
      icon: Shield,
      title: "Escrow Protection",
      description: "Funds held safely until OTP-confirmed delivery"
    }
  ];

  const pricingTiers = [
    {
      name: "Buyer",
      price: "Free",
      description: "Perfect for individuals looking to purchase from local sellers",
      features: [
        "Browse unlimited listings",
        "Secure escrow payments",
        "OTP delivery confirmation",
        "Basic customer support",
        "Mobile-friendly interface"
      ],
      popular: false,
      cta: "Start Shopping"
    },
    {
      name: "Seller",
      price: "5%",
      priceNote: "per successful transaction",
      description: "Ideal for individuals and small businesses selling products",
      features: [
        "Unlimited product listings",
        "Photo uploads (up to 5 per product)",
        "Inventory management",
        "Sales analytics",
        "Customer messaging",
        "Automatic escrow release"
      ],
      popular: true,
      cta: "Start Selling"
    },
    {
      name: "Driver",
      price: "3%",
      priceNote: "per delivery completed",
      description: "Perfect for delivery professionals and part-time drivers",
      features: [
        "Bid on delivery requests",
        "Route optimization suggestions",
        "Earnings tracking",
        "Rating system",
        "Flexible schedule"
      ],
      popular: false,
      cta: "Start Delivering"
    }
  ];

  const regionalFeatures = [
    {
      region: "Nigeria",
      features: [
        "Naira (NGN) currency support",
        "State/LGA/Community location system",
        "Local language support (Hausa, Yoruba, Igbo)",
        "Paystack & Flutterwave integration (coming soon)",
        "Mobile money support (coming soon)"
      ],
      status: "Active"
    },
    {
      region: "Global",
      features: [
        "PayPal international payments",
        "Multi-currency support",
        "English language interface",
        "International shipping options"
      ],
      status: "Active"
    }
  ];

  return (
    <>
      <SEOHead 
        title="Pricing - VillageMarket"
        description="Transparent pricing for buyers, sellers, and drivers. Start with our free buyer account or grow your business with our seller platform."
        keywords={["pricing", "fees", "cost", "seller fees", "buyer free", "delivery pricing", "marketplace pricing"]}
      />
      
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              No hidden fees, no monthly subscriptions. Pay only when you succeed.
              Built for Nigeria's growing digital economy.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 bg-card/50 rounded-full px-4 py-2">
                  <feature.icon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{feature.title}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Tiers */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Choose Your Role</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Whether you're buying, selling, or delivering, we have a plan that works for you.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {pricingTiers.map((tier, index) => (
                <Card key={index} className={`relative ${tier.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
                  {tier.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl mb-2">{tier.name}</CardTitle>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-primary">{tier.price}</span>
                      {tier.priceNote && (
                        <p className="text-sm text-muted-foreground mt-1">{tier.priceNote}</p>
                      )}
                    </div>
                    <p className="text-muted-foreground">{tier.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {tier.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full" 
                      variant={tier.popular ? "default" : "outline"}
                      onClick={() => navigate('/auth')}
                    >
                      {tier.cta}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Regional Support */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Regional Support</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Tailored features for local markets with global accessibility.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {regionalFeatures.map((region, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{region.region}</CardTitle>
                      <Badge variant={region.status === 'Active' ? 'default' : 'secondary'}>
                        {region.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {region.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            </div>

            <div className="max-w-3xl mx-auto space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">When are fees charged?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Fees are only charged when transactions are successfully completed. 
                    For sellers, this is when the buyer confirms delivery with OTP. 
                    For drivers, this is when delivery is confirmed.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How does escrow work?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    When a buyer makes a purchase, funds are held securely in escrow. 
                    The seller only receives payment after the buyer confirms delivery 
                    using a one-time password (OTP) sent to their verified contact information.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Are there any hidden fees?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    No. Our pricing is completely transparent. The percentages shown 
                    are the only fees charged. Payment processing fees (like PayPal fees) 
                    are clearly disclosed before checkout.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Can I use multiple roles?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Yes! You can be a buyer, seller, and driver all with the same account. 
                    Each role has its own dashboard and fee structure applies only 
                    when you're acting in that capacity.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of users already trading on VillageMarket
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="secondary" onClick={() => navigate('/auth')}>
                Create Account
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/how-it-works')}>
                Learn More
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default PricingPage;