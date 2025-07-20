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
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            👥 How Do You Want to Join?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Choose what you want to do. We'll guide you step by step.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {dashboards.map((dashboard) => (
            <Card key={dashboard.role} className="group hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
              {dashboard.badge && (
                <Badge className="absolute top-4 right-4 z-10 bg-accent text-accent-foreground text-xs">
                  {dashboard.badge}
                </Badge>
              )}
              
              <div className={`h-20 md:h-24 ${dashboard.color} relative overflow-hidden`}>
                <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                <div className="absolute bottom-3 left-4">
                  <dashboard.icon className="h-7 w-7 md:h-8 md:w-8 text-white" />
                </div>
              </div>
              
              <CardContent className="p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">
                  {dashboard.title}
                </h3>
                <p className="text-muted-foreground text-sm md:text-base mb-4">
                  {dashboard.description}
                </p>
                
                <div className="space-y-2 mb-6">
                  {dashboard.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                      <span className="text-sm md:text-base text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Button className="w-full h-12 text-base font-semibold group-hover:gap-3 transition-all duration-300">
                  Start as {dashboard.role}
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Simplified benefits section */}
        <div className="mt-12 bg-card rounded-2xl p-6 md:p-8 shadow-card">
          <h3 className="text-xl md:text-2xl font-bold text-center text-foreground mb-6">
            🌟 Why People Love VillageMarket
          </h3>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 text-center">
            <div className="space-y-3">
              <div className="text-4xl mb-2">💰</div>
              <h4 className="font-semibold text-foreground text-lg">Money Always Safe</h4>
              <p className="text-sm md:text-base text-muted-foreground">We hold your payment until you get your goods</p>
            </div>
            
            <div className="space-y-3">
              <div className="text-4xl mb-2">📱</div>
              <h4 className="font-semibold text-foreground text-lg">Easy to Use</h4>
              <p className="text-sm md:text-base text-muted-foreground">Simple app that anyone can understand</p>
            </div>
            
            <div className="space-y-3">
              <div className="text-4xl mb-2">🤝</div>
              <h4 className="font-semibold text-foreground text-lg">Help Always Available</h4>
              <p className="text-sm md:text-base text-muted-foreground">Community agents ready to help you</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}