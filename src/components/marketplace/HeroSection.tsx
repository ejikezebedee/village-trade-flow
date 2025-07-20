import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QrCode, Shield, Truck, Users } from "lucide-react";
import heroImage from "@/assets/hero-marketplace.jpg";

export function HeroSection() {
  return (
    <section className="relative min-h-screen bg-gradient-hero flex items-center justify-center overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground leading-tight">
                Secure Village-to-Township
                <span className="text-accent-light"> Marketplace</span>
              </h1>
              <p className="text-xl text-primary-foreground/90 max-w-2xl">
                Connect villagers, farmers, and businesses through automated escrow payments, 
                QR code tracking, and multilingual support. Built for trust, designed for growth.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="xl" variant="hero" className="animate-scale-in">
                Get Started Today
              </Button>
              <Button size="xl" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Watch Demo
              </Button>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
              {[
                { icon: Shield, title: "Escrow Security", desc: "Automated payment protection" },
                { icon: QrCode, title: "QR Tracking", desc: "Full logistics transparency" },
                { icon: Users, title: "Multi-User", desc: "Buyers, sellers, drivers, agents" },
                { icon: Truck, title: "Smart Delivery", desc: "Bidding system for drivers" }
              ].map((feature, index) => (
                <Card key={feature.title} className="p-4 bg-card/20 backdrop-blur-sm border-primary-foreground/20 text-center hover:bg-card/30 transition-all duration-300" style={{ animationDelay: `${index * 0.1}s` }}>
                  <feature.icon className="h-8 w-8 mx-auto mb-2 text-accent-light" />
                  <h3 className="font-semibold text-sm text-primary-foreground">{feature.title}</h3>
                  <p className="text-xs text-primary-foreground/70">{feature.desc}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Image */}
          <div className="relative animate-slide-up">
            <div className="relative">
              <img 
                src={heroImage} 
                alt="Marketplace Platform" 
                className="rounded-2xl shadow-2xl w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent rounded-2xl"></div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-card p-4 rounded-xl shadow-lg animate-glow">
              <QrCode className="h-6 w-6 text-primary" />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-card p-4 rounded-xl shadow-lg animate-bounce">
              <Shield className="h-6 w-6 text-secondary" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}