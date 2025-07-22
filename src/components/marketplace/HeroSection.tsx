import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QrCode, Shield, Truck, Users } from "lucide-react";


export function HeroSection() {
  return (
    <section className="relative min-h-screen bg-gradient-subtle flex items-center justify-center overflow-hidden pt-16">
      <div className="container mx-auto px-6 lg:px-8 py-24 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-12 animate-fade-in">
          {/* Apple-style minimalist heading */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold text-foreground leading-tight tracking-tighter">
              Simple & Safe
              <span className="text-primary block"> Village Trading</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Buy and sell with confidence. We protect your money until you receive your goods. 
              Easy to use, safe for everyone.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="apple-button text-base px-8 py-3 bg-primary hover:bg-primary/90">
              Start Trading Now
            </Button>
            <Button size="lg" variant="outline" className="apple-button text-base px-8 py-3 border-border hover:bg-muted/50">
              See How It Works
            </Button>
          </div>

          {/* Apple-style feature grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            {[
              { icon: Shield, title: "Money Protected", desc: "Your payment is safe until delivery" },
              { icon: QrCode, title: "Easy Tracking", desc: "Follow your order with QR codes" },
              { icon: Users, title: "For Everyone", desc: "Buyers, sellers, drivers welcome" },
              { icon: Truck, title: "Fast Delivery", desc: "Local drivers bring goods to you" }
            ].map((feature, index) => (
              <div 
                key={feature.title} 
                className="apple-card p-6 text-center group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <feature.icon className="h-8 w-8 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-sm text-foreground mb-2">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}