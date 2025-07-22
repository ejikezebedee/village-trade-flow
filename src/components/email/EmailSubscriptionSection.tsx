import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Mail, Gift, Zap, Star, Shield, Bell } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface EmailSubscriptionSectionProps {
  className?: string;
  variant?: 'hero' | 'footer' | 'sidebar';
}

export function EmailSubscriptionSection({ 
  className = "",
  variant = 'hero'
}: EmailSubscriptionSectionProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Successfully Subscribed! 🎉",
        description: "Welcome to VillageMarket! Check your email for a special welcome offer.",
      });
      setEmail("");
      setIsLoading(false);
    }, 1500);
  };

  const benefits = [
    { icon: Gift, text: "Exclusive deals & early access", color: "text-purple-500" },
    { icon: Zap, text: "Flash sale notifications", color: "text-yellow-500" },
    { icon: Star, text: "Premium product previews", color: "text-blue-500" },
    { icon: Shield, text: "No spam, unsubscribe anytime", color: "text-green-500" }
  ];

  if (variant === 'footer') {
    return (
      <div className={`bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-xl ${className}`}>
        <div className="text-center mb-4">
          <Mail className="h-8 w-8 text-primary mx-auto mb-2" />
          <h3 className="text-lg font-semibold mb-1">Stay in the Loop</h3>
          <p className="text-sm text-muted-foreground">Get the best deals delivered to your inbox</p>
        </div>
        <form onSubmit={handleSubscribe} className="space-y-3">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full"
          />
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? "Subscribing..." : "Subscribe"}
          </Button>
        </form>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <Bell className="h-5 w-5 text-primary" />
          <h4 className="font-medium">Email Updates</h4>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Never miss a deal or new product launch
        </p>
        <form onSubmit={handleSubscribe} className="space-y-2">
          <Input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button 
            type="submit" 
            size="sm" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? "..." : "Subscribe"}
          </Button>
        </form>
      </Card>
    );
  }

  return (
    <section className={`py-16 sm:py-20 ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-primary/20">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full -translate-y-16 translate-x-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-secondary/10 to-transparent rounded-full translate-y-12 -translate-x-12" />
            
            <div className="relative p-8 sm:p-12 text-center">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Mail className="h-8 w-8 text-primary" />
                  <Badge variant="secondary" className="px-3 py-1">
                    Join 50,000+ Subscribers
                  </Badge>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Never Miss a Deal Again
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Get exclusive access to flash sales, premium products, and member-only discounts delivered straight to your inbox.
                </p>
              </div>

              {/* Benefits Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {benefits.map((benefit, index) => (
                  <div 
                    key={index}
                    className="flex flex-col items-center text-center p-4 rounded-lg bg-background/50 hover:bg-background/80 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <benefit.icon className={`h-6 w-6 mb-2 ${benefit.color}`} />
                    <span className="text-sm font-medium">{benefit.text}</span>
                  </div>
                ))}
              </div>

              {/* Subscription Form */}
              <form onSubmit={handleSubscribe} className="max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 h-12 text-center sm:text-left bg-background/80 border-primary/20 focus:border-primary"
                    required
                  />
                  <Button 
                    type="submit" 
                    className="h-12 px-8 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Subscribing...
                      </div>
                    ) : (
                      "Subscribe Free"
                    )}
                  </Button>
                </div>
              </form>

              {/* Trust indicators */}
              <div className="mt-6 text-xs text-muted-foreground">
                <p>✓ Free to join ✓ No spam ✓ Unsubscribe anytime ✓ Privacy protected</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}