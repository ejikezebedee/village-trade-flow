import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, QrCode, Users, Truck, CheckCircle, Clock, Globe, Star } from "lucide-react";
import { Link } from "react-router-dom";

export function FeaturesPage() {
  const mainFeatures = [
    {
      icon: Shield,
      title: "💰 Money Protected",
      subtitle: "Your payment is safe until delivery",
      description: "We hold your payment securely until you confirm you've received your goods. No more worrying about losing money to dishonest sellers.",
      benefits: [
        "Payment held in secure escrow",
        "Money released only after delivery confirmation",
        "Full refund if order not delivered",
        "Dispute resolution support"
      ],
      color: "text-blue-500"
    },
    {
      icon: QrCode,
      title: "📱 Easy Tracking",
      subtitle: "Follow your order with QR codes",
      description: "Track your order every step of the way with our simple QR code system. From pickup to delivery, you'll always know where your goods are.",
      benefits: [
        "Real-time order tracking",
        "QR code scanning at each step",
        "SMS and app notifications",
        "Delivery confirmation system"
      ],
      color: "text-purple-500"
    },
    {
      icon: Users,
      title: "👥 For Everyone",
      subtitle: "Buyers, sellers, drivers welcome",
      description: "Our platform brings together the entire community. Whether you're buying, selling, or delivering, there's a place for you here.",
      benefits: [
        "Easy registration for all user types",
        "Fair commission structure",
        "Community-driven marketplace",
        "Support for local businesses"
      ],
      color: "text-green-500"
    },
    {
      icon: Truck,
      title: "🚚 Fast Delivery",
      subtitle: "Local drivers bring goods to you",
      description: "Connect with local drivers who know your area. Get your goods delivered quickly and safely by people from your own community.",
      benefits: [
        "Local driver network",
        "Same-day delivery options",
        "Flexible pickup times",
        "Direct communication with drivers"
      ],
      color: "text-orange-500"
    }
  ];

  const additionalFeatures = [
    { icon: CheckCircle, title: "Verified Users", desc: "All users go through verification" },
    { icon: Clock, title: "24/7 Support", desc: "Help available whenever you need it" },
    { icon: Globe, title: "Multi-Language", desc: "Available in your local language" },
    { icon: Star, title: "Quality Guaranteed", desc: "High standards for all transactions" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-hero py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6">
            Why Choose
            <span className="text-accent-light block">VillageMarket?</span>
          </h1>
          <p className="text-xl text-primary-foreground/90 max-w-3xl mx-auto mb-8">
            We've built the safest, easiest, and most reliable way to trade in your community. 
            Here's what makes us different.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button variant="outline" size="lg" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                ← Back to Home
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="xl" variant="hero" className="text-lg px-8 py-4">
                🚀 Start Trading Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            {mainFeatures.map((feature, index) => (
              <Card key={feature.title} className="p-8 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start space-x-6">
                  <div className={`p-4 rounded-xl bg-background ${feature.color}`}>
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-lg text-accent mb-4">{feature.subtitle}</p>
                    <p className="text-muted-foreground mb-6">{feature.description}</p>
                    
                    <div className="space-y-3">
                      {feature.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                          <span className="text-foreground">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Even More Reasons to Love Us
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We've thought of everything to make your trading experience smooth and secure.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {additionalFeatures.map((feature, index) => (
              <Card key={feature.title} className="p-6 text-center hover:shadow-lg transition-all duration-300">
                <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Ready to Experience Safe Trading?
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join thousands of community members who trust VillageMarket for their trading needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="xl" variant="hero" className="text-lg px-8 py-4">
                🚀 Get Started Today
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button size="xl" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground hover:text-primary text-lg px-8 py-4">
                📹 See How It Works
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}