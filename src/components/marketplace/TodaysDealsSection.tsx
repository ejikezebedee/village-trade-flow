import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Flame, ShoppingCart, Eye } from "lucide-react";
import { useState, useEffect } from "react";

interface TodaysDeal {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  discount: number;
  timeLeft: string;
  claimed: number;
  totalAvailable: number;
  isHotDeal?: boolean;
  category: string;
}

interface TodaysDealsSectionProps {
  maxItems?: number;
  showHeader?: boolean;
  className?: string;
}

export function TodaysDealsSection({ 
  maxItems = 6, 
  showHeader = true,
  className = ""
}: TodaysDealsSectionProps) {
  const [deals, setDeals] = useState<TodaysDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState("23:59:45");

  // Countdown timer for daily reset
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Mock deals data
  useEffect(() => {
    const mockDeals: TodaysDeal[] = [
      {
        id: "1",
        name: "Wireless Bluetooth Headphones",
        price: 49.99,
        originalPrice: 99.99,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&h=300",
        discount: 50,
        timeLeft: "23:59:45",
        claimed: 847,
        totalAvailable: 1000,
        isHotDeal: true,
        category: "Electronics"
      },
      {
        id: "2",
        name: "Organic Cotton T-Shirt Set",
        price: 29.99,
        originalPrice: 59.99,
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&h=300",
        discount: 50,
        timeLeft: "23:59:45",
        claimed: 234,
        totalAvailable: 500,
        isHotDeal: false,
        category: "Fashion"
      },
      {
        id: "3",
        name: "Premium Coffee Bean Collection",
        price: 24.99,
        originalPrice: 44.99,
        image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=400&h=300",
        discount: 44,
        timeLeft: "23:59:45",
        claimed: 156,
        totalAvailable: 200,
        isHotDeal: true,
        category: "Food & Beverages"
      },
      {
        id: "4",
        name: "Smart Fitness Watch",
        price: 89.99,
        originalPrice: 179.99,
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&h=300",
        discount: 50,
        timeLeft: "23:59:45",
        claimed: 423,
        totalAvailable: 600,
        isHotDeal: false,
        category: "Electronics"
      },
      {
        id: "5",
        name: "Artisan Handmade Soap Set",
        price: 19.99,
        originalPrice: 34.99,
        image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=400&h=300",
        discount: 43,
        timeLeft: "23:59:45",
        claimed: 89,
        totalAvailable: 150,
        isHotDeal: false,
        category: "Beauty & Care"
      },
      {
        id: "6",
        name: "LED Desk Lamp with USB Charging",
        price: 34.99,
        originalPrice: 69.99,
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=300",
        discount: 50,
        timeLeft: "23:59:45",
        claimed: 312,
        totalAvailable: 400,
        isHotDeal: true,
        category: "Home & Office"
      }
    ];

    setTimeout(() => {
      setDeals(mockDeals.slice(0, maxItems));
      setLoading(false);
    }, 800);
  }, [maxItems]);

  const getProgressPercentage = (claimed: number, total: number) => {
    return Math.min((claimed / total) * 100, 100);
  };

  if (loading) {
    return (
      <section className={`py-8 sm:py-12 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 ${className}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {showHeader && (
            <div className="text-center mb-8 sm:mb-12">
              <div className="h-8 bg-muted rounded-lg w-64 mx-auto mb-4 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-96 mx-auto animate-pulse"></div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: maxItems }).map((_, i) => (
              <div key={i} className="h-80 bg-muted rounded-2xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`py-8 sm:py-12 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {showHeader && (
          <div className="text-center mb-8 sm:mb-12 animate-fade-in">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Flame className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 animate-pulse" />
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">
                Today's Hot Deals
              </h2>
              <Flame className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 animate-pulse" />
            </div>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto mb-4">
              Limited time offers that reset every 24 hours. Don't miss out!
            </p>
            
            {/* Countdown Timer */}
            <div className="flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-full max-w-fit mx-auto">
              <Clock className="h-5 w-5" />
              <span className="font-mono text-lg font-bold">{timeLeft}</span>
              <span className="text-sm">until reset</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {deals.map((deal, index) => {
            const progressPercentage = getProgressPercentage(deal.claimed, deal.totalAvailable);
            const isAlmostSoldOut = progressPercentage > 90;
            
            return (
              <Card 
                key={deal.id} 
                className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm overflow-hidden animate-scale-in relative"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Hot Deal Badge */}
                {deal.isHotDeal && (
                  <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium animate-pulse">
                    🔥 HOT DEAL
                  </div>
                )}
                
                {/* Discount Badge */}
                <div className="absolute top-3 right-3 z-10 bg-red-600 text-white text-sm px-3 py-1 rounded-full font-bold">
                  -{deal.discount}%
                </div>

                {/* Product Image */}
                <div className="relative aspect-square overflow-hidden">
                  <img 
                    src={deal.image} 
                    alt={deal.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Quick View */}
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                    <Button size="sm" variant="secondary" className="rounded-full h-8 w-8 p-0 bg-white/90 hover:bg-white">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6">
                  {/* Category */}
                  <Badge variant="outline" className="mb-2 text-xs">
                    {deal.category}
                  </Badge>

                  {/* Title */}
                  <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
                    {deal.name}
                  </h3>

                  {/* Price */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl font-bold text-red-600">
                      ${deal.price}
                    </span>
                    <span className="text-sm text-muted-foreground line-through">
                      ${deal.originalPrice}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{deal.claimed} claimed</span>
                      <span>{deal.totalAvailable} available</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isAlmostSoldOut 
                            ? 'bg-gradient-to-r from-red-500 to-red-600' 
                            : 'bg-gradient-to-r from-orange-400 to-red-500'
                        }`}
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    {isAlmostSoldOut && (
                      <Badge variant="destructive" className="text-xs mt-2">
                        Almost Sold Out! 🔥
                      </Badge>
                    )}
                  </div>

                  {/* Add to Cart Button */}
                  <Button 
                    className="w-full bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 transition-all duration-300 group-hover:shadow-lg text-white"
                    size="sm"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Claim Deal Now
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* View All Button */}
        <div className="text-center mt-8 sm:mt-12">
          <Button 
            variant="outline" 
            size="lg"
            className="px-8 hover:bg-red-600 hover:text-white transition-all duration-300 border-red-600 text-red-600"
          >
            View All Today's Deals
          </Button>
        </div>
      </div>
    </section>
  );
}