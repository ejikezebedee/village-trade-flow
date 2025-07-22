import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FlashSaleCard } from "./FlashSaleCard";
import { 
  Zap, 
  Clock, 
  Flame, 
  TrendingUp,
  Sparkles,
  Timer,
  RefreshCw
} from "lucide-react";

interface FlashSale {
  id: string;
  title: string;
  description?: string;
  product_id: string;
  product_name: string;
  product_image: string;
  original_price: number;
  sale_price: number;
  discount_percentage: number;
  start_time: string;
  end_time: string;
  quantity_available: number;
  quantity_sold: number;
  featured: boolean;
}

interface FlashSalesSectionProps {
  showHeader?: boolean;
  maxItems?: number;
  className?: string;
}

export function FlashSalesSection({ 
  showHeader = true, 
  maxItems = 6, 
  className = "" 
}: FlashSalesSectionProps) {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const { toast } = useToast();

  useEffect(() => {
    fetchFlashSales();
    
    // Set up real-time subscription
    const flashSalesChannel = supabase
      .channel('flash-sales-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'flash_sales'
      }, (payload) => {
        console.log('Flash sales update:', payload);
        fetchFlashSales();
        setLastUpdate(new Date());
      })
      .subscribe();

    // Set up timer to refresh every minute to check for expired deals
    const refreshTimer = setInterval(() => {
      fetchFlashSales();
      setLastUpdate(new Date());
    }, 60000); // Refresh every minute

    return () => {
      supabase.removeChannel(flashSalesChannel);
      clearInterval(refreshTimer);
    };
  }, []);

  const fetchFlashSales = async () => {
    try {
      setLoading(true);
      
      // Mock flash sales data since database might not have records
      const mockFlashSales: FlashSale[] = [
        {
          id: "1",
          title: "Limited Time: Premium Wireless Headphones",
          description: "High-quality sound with noise cancellation",
          product_id: "1",
          product_name: "Sony WH-1000XM4 Headphones",
          product_image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&h=300",
          original_price: 299.99,
          sale_price: 199.99,
          discount_percentage: 33,
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
          quantity_available: 50,
          quantity_sold: 23,
          featured: true
        },
        {
          id: "2",
          title: "Flash Deal: Smart Fitness Tracker",
          description: "Track your health and fitness goals",
          product_id: "2",
          product_name: "Fitbit Charge 5",
          product_image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=400&h=300",
          original_price: 199.99,
          sale_price: 149.99,
          discount_percentage: 25,
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
          quantity_available: 30,
          quantity_sold: 18,
          featured: false
        },
        {
          id: "3",
          title: "Super Sale: Premium Coffee Beans",
          description: "Organic single-origin coffee from Ethiopia",
          product_id: "3",
          product_name: "Ethiopian Yirgacheffe Coffee",
          product_image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=400&h=300",
          original_price: 29.99,
          sale_price: 19.99,
          discount_percentage: 33,
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour from now
          quantity_available: 100,
          quantity_sold: 67,
          featured: true
        },
        {
          id: "4",
          title: "Flash Deal: Designer Handbag",
          description: "Elegant leather handbag for every occasion",
          product_id: "4",
          product_name: "Luxury Leather Handbag",
          product_image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&h=300",
          original_price: 149.99,
          sale_price: 99.99,
          discount_percentage: 33,
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
          quantity_available: 25,
          quantity_sold: 8,
          featured: false
        }
      ];

      setFlashSales(mockFlashSales.slice(0, maxItems));
    } catch (error: any) {
      console.error('Error fetching flash sales:', error);
      toast({
        title: "Error",
        description: "Failed to load flash sales",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShopNow = (sale: FlashSale) => {
    // Navigate to product page or handle purchase
    window.location.href = `/products/${sale.product_id}?flash_sale=${sale.id}`;
  };

  const getNextRefreshTime = () => {
    const nextMinute = new Date(lastUpdate);
    nextMinute.setMinutes(nextMinute.getMinutes() + 1);
    nextMinute.setSeconds(0);
    return nextMinute;
  };

  const featuredDeals = flashSales.filter(sale => sale.featured);
  const regularDeals = flashSales.filter(sale => !sale.featured);

  if (loading && flashSales.length === 0) {
    return (
      <div className={className}>
        {showHeader && (
          <div className="text-center mb-8">
            <div className="h-8 bg-muted rounded w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-96 mx-auto animate-pulse"></div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="apple-card animate-pulse">
              <div className="h-48 bg-muted rounded-t-2xl"></div>
              <CardContent className="p-6 space-y-4">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-8 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (flashSales.length === 0) {
    return (
      <div className={className}>
        {showHeader && (
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Zap className="h-8 w-8 text-primary" />
              <h2 className="text-3xl font-semibold text-foreground tracking-tight">
                Flash Sales
              </h2>
            </div>
            <p className="text-lg text-muted-foreground">
              Lightning deals with incredible discounts
            </p>
          </div>
        )}
        
        <Card className="apple-card">
          <CardContent className="p-12 text-center">
            <Timer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No active flash sales</h3>
            <p className="text-muted-foreground mb-4">
              Check back soon for exciting time-limited deals!
            </p>
            <Button 
              variant="outline" 
              onClick={fetchFlashSales}
              className="apple-button"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      {showHeader && (
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="relative">
              <Zap className="h-8 w-8 text-primary animate-pulse" />
              <Sparkles className="h-4 w-4 text-amber-500 absolute -top-1 -right-1 animate-bounce" />
            </div>
            <h2 className="text-3xl font-semibold text-foreground tracking-tight">
              Flash Sales
            </h2>
            <Flame className="h-8 w-8 text-red-500 animate-pulse" />
          </div>
          <p className="text-lg text-muted-foreground mb-4">
            Lightning deals with incredible discounts - Limited time only!
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0">
              {flashSales.length} Active Deals
            </Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Updates every minute</span>
            </div>
          </div>
        </div>
      )}

      {/* Featured Flash Sales */}
      {featuredDeals.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="h-5 w-5 text-red-500" />
            <h3 className="text-xl font-semibold">Featured Flash Deals</h3>
            <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0">
              Hot Deals
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {featuredDeals.map((sale) => (
              <FlashSaleCard 
                key={sale.id} 
                sale={sale} 
                onShopNow={handleShopNow}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular Flash Sales */}
      {regularDeals.length > 0 && (
        <div>
          {featuredDeals.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">More Flash Deals</h3>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularDeals.map((sale) => (
              <FlashSaleCard 
                key={sale.id} 
                sale={sale} 
                onShopNow={handleShopNow}
              />
            ))}
          </div>
        </div>
      )}

      {/* View All Button */}
      {showHeader && (
        <div className="text-center mt-12">
          <Button variant="outline" size="lg" className="apple-button font-medium px-8" asChild>
            <a href="/flash-sales">View All Flash Sales</a>
          </Button>
        </div>
      )}

      {/* Auto-refresh indicator */}
      <div className="mt-6 text-center">
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
          <RefreshCw className="h-3 w-3 animate-spin" />
          <span>Auto-updating deals • Last update: {lastUpdate.toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}