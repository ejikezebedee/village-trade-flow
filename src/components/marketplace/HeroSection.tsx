import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QrCode, Shield, Truck, Users } from "lucide-react";
import heroImage from "@/assets/hero-marketplace.jpg";

export function HeroSection() {
  return (
    <section className="relative min-h-screen bg-gradient-hero flex items-center justify-center overflow-hidden pt-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="container mx-auto px-4 py-8 md:py-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content - Simplified for mobile */}
          <div className="space-y-6 md:space-y-8 animate-fade-in text-center lg:text-left">
            <div className="space-y-4">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight">
                Simple & Safe
                <span className="text-accent-light block"> Village Trading</span>
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto lg:mx-0">
                Buy and sell with confidence. We protect your money until you receive your goods. 
                Easy to use, safe for everyone.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="xl" variant="hero" className="animate-scale-in text-lg px-8 py-4">
                🚀 Start Trading Now
              </Button>
              <Button size="xl" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground hover:text-primary text-lg px-8 py-4">
                📹 See How It Works
              </Button>
            </div>

            {/* Feature Cards - Simplified for mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 md:mt-12">
              {[
                { icon: Shield, title: "💰 Money Protected", desc: "Your payment is safe until delivery", emoji: "🛡️" },
                { icon: QrCode, title: "📱 Easy Tracking", desc: "Follow your order with QR codes", emoji: "📍" },
                { icon: Users, title: "👥 For Everyone", desc: "Buyers, sellers, drivers welcome", emoji: "🤝" },
                { icon: Truck, title: "🚚 Fast Delivery", desc: "Local drivers bring goods to you", emoji: "⚡" }
              ].map((feature, index) => (
                <Card key={feature.title} className="p-4 md:p-6 bg-card/20 backdrop-blur-sm border-primary-foreground/20 text-center hover:bg-card/30 transition-all duration-300" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="text-2xl mb-2">{feature.emoji}</div>
                  <h3 className="font-semibold text-sm md:text-base text-primary-foreground mb-1">{feature.title}</h3>
                  <p className="text-xs md:text-sm text-primary-foreground/70">{feature.desc}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Image - Hidden on small mobile for simplicity */}
          <div className="relative animate-slide-up hidden md:block">
            <div className="relative">
              <img 
                src={heroImage} 
                alt="Village marketplace connecting communities" 
                className="rounded-2xl shadow-2xl w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent rounded-2xl"></div>
            </div>
            
            {/* Floating Elements - Simplified */}
            <div className="absolute -top-4 -right-4 bg-card p-4 rounded-xl shadow-lg">
              <QrCode className="h-6 w-6 text-primary" />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-card p-4 rounded-xl shadow-lg">
              <Shield className="h-6 w-6 text-secondary" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}