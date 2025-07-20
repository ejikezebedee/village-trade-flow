import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingBag, 
  Store, 
  Truck, 
  Users, 
  ArrowRight,
  TrendingUp,
  Shield,
  Zap
} from "lucide-react";

const dashboards = [
  {
    role: "Buyer",
    title: "Start Shopping",
    description: "Browse products, make secure purchases, and track your orders from rural communities.",
    icon: ShoppingBag,
    features: ["Browse Products", "Secure Payments", "Order Tracking"],
    color: "bg-gradient-primary",
    badge: "Most Popular"
  },
  {
    role: "Seller",
    title: "Sell Your Products",
    description: "List your products, manage sales, and reach customers in townships with automated tools.",
    icon: Store,
    features: ["Product Listing", "Sales Management", "Analytics"],
    color: "bg-gradient-success",
    badge: "Earn Income"
  },
  {
    role: "Driver",
    title: "Delivery Partner",
    description: "Bid on delivery jobs, manage routes, and earn money connecting rural areas to towns.",
    icon: Truck,
    features: ["Job Bidding", "Route Management", "Earnings Tracker"],
    color: "bg-gradient-to-br from-accent to-accent-light",
    badge: "Flexible Work"
  },
  {
    role: "Agent",
    title: "Community Agent",
    description: "Help others with transactions, provide support, and earn commission for your assistance.",
    icon: Users,
    features: ["User Support", "Commission Earnings", "Community Building"],
    color: "bg-gradient-to-br from-muted-foreground to-foreground",
    badge: "Community Leader"
  }
];

export function DashboardNavigation() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Choose Your Role
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join our marketplace as a buyer, seller, driver, or agent. Each role is designed to create value and build stronger communities.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboards.map((dashboard) => (
            <Card key={dashboard.role} className="group hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 relative overflow-hidden">
              {dashboard.badge && (
                <Badge className="absolute top-4 right-4 z-10 bg-accent text-accent-foreground">
                  {dashboard.badge}
                </Badge>
              )}
              
              <div className={`h-24 ${dashboard.color} relative overflow-hidden`}>
                <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                <div className="absolute bottom-4 left-4">
                  <dashboard.icon className="h-8 w-8 text-white" />
                </div>
              </div>
              
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {dashboard.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {dashboard.description}
                </p>
                
                <div className="space-y-2 mb-6">
                  {dashboard.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Button className="w-full group-hover:gap-3 transition-all duration-300">
                  Get Started as {dashboard.role}
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-12 bg-card rounded-2xl p-8 shadow-card">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-2">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground">Growing Economy</h4>
              <p className="text-sm text-muted-foreground">Join thousands building sustainable rural economies</p>
            </div>
            
            <div className="space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-secondary/10 rounded-lg mb-2">
                <Shield className="h-6 w-6 text-secondary" />
              </div>
              <h4 className="font-semibold text-foreground">Secure Platform</h4>
              <p className="text-sm text-muted-foreground">Automated escrow ensures safe transactions</p>
            </div>
            
            <div className="space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-accent/10 rounded-lg mb-2">
                <Zap className="h-6 w-6 text-accent" />
              </div>
              <h4 className="font-semibold text-foreground">Fully Automated</h4>
              <p className="text-sm text-muted-foreground">QR codes and smart systems handle logistics</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}