import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  Zap, 
  ShoppingCart, 
  Flame,
  Tag,
  TrendingUp
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

interface FlashSaleCardProps {
  sale: FlashSale;
  onShopNow?: (sale: FlashSale) => void;
}

export function FlashSaleCard({ sale, onShopNow }: FlashSaleCardProps) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const endTime = new Date(sale.end_time).getTime();
      const startTime = new Date(sale.start_time).getTime();
      const difference = endTime - now;

      if (difference <= 0) {
        setTimeLeft("EXPIRED");
        setIsExpired(true);
        return;
      }

      // Calculate progress (how much time has passed)
      const totalDuration = endTime - startTime;
      const elapsed = now - startTime;
      const progressPercentage = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
      setProgress(progressPercentage);

      // Format time remaining
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [sale.end_time, sale.start_time]);

  const soldPercentage = sale.quantity_available > 0 
    ? (sale.quantity_sold / sale.quantity_available) * 100 
    : 0;

  const remainingQuantity = sale.quantity_available - sale.quantity_sold;
  const isSoldOut = remainingQuantity <= 0;
  const isLowStock = remainingQuantity <= 5 && remainingQuantity > 0;

  const handleShopNow = () => {
    if (onShopNow && !isExpired && !isSoldOut) {
      onShopNow(sale);
    }
  };

  const getUrgencyColor = () => {
    if (isExpired || isSoldOut) return "text-muted-foreground";
    if (progress > 80 || isLowStock) return "text-red-500";
    if (progress > 60) return "text-amber-500";
    return "text-secondary";
  };

  const getUrgencyBg = () => {
    if (isExpired || isSoldOut) return "bg-muted";
    if (progress > 80 || isLowStock) return "bg-red-500/10 border-red-500/20";
    if (progress > 60) return "bg-amber-500/10 border-amber-500/20";
    return "bg-secondary/10 border-secondary/20";
  };

  return (
    <Card className={`apple-card group overflow-hidden transition-all duration-300 hover:shadow-lg ${getUrgencyBg()}`}>
      {/* Flash Sale Badge */}
      {sale.featured && (
        <div className="absolute top-4 left-4 z-10">
          <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 flex items-center gap-1">
            <Flame className="h-3 w-3" />
            Featured
          </Badge>
        </div>
      )}

      {/* Discount Badge */}
      <div className="absolute top-4 right-4 z-10">
        <Badge className="bg-primary text-primary-foreground font-bold text-lg px-3 py-1">
          -{sale.discount_percentage}%
        </Badge>
      </div>

      {/* Product Image */}
      <div className="relative">
        <img 
          src={sale.product_image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"}
          alt={sale.product_name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500";
          }}
        />
        
        {/* Status Overlay */}
        {(isExpired || isSoldOut) && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="destructive" className="text-lg font-bold">
              {isExpired ? "EXPIRED" : "SOLD OUT"}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-6 space-y-4">
        {/* Title and Description */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg leading-tight tracking-tight line-clamp-1">
            {sale.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {sale.product_name}
          </p>
          {sale.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {sale.description}
            </p>
          )}
        </div>

        {/* Pricing */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-primary">
              ${sale.sale_price.toFixed(2)}
            </span>
            <span className="text-lg text-muted-foreground line-through">
              ${sale.original_price.toFixed(2)}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Tag className="h-3 w-3 text-secondary" />
            <span className="font-medium text-secondary">
              Save ${(sale.original_price - sale.sale_price).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className={`p-3 rounded-lg border ${getUrgencyBg()}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className={`h-4 w-4 ${getUrgencyColor()}`} />
              <span className="text-sm font-medium">Time Remaining</span>
            </div>
            <span className={`font-mono font-bold ${getUrgencyColor()}`}>
              {timeLeft}
            </span>
          </div>
          
          {!isExpired && (
            <Progress 
              value={100 - progress} 
              className="h-2"
            />
          )}
        </div>

        {/* Stock Progress */}
        {sale.quantity_available > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Stock</span>
              <span className={`font-medium ${isLowStock ? "text-red-500" : ""}`}>
                {remainingQuantity} left
              </span>
            </div>
            <Progress 
              value={soldPercentage} 
              className="h-2"
            />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>{sale.quantity_sold} sold</span>
            </div>
          </div>
        )}

        {/* Urgency Messages */}
        {!isExpired && !isSoldOut && (
          <div className="space-y-2">
            {isLowStock && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-950/20 p-2 rounded-lg">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">Only {remainingQuantity} left!</span>
              </div>
            )}
            
            {progress > 80 && (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-2 rounded-lg">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Hurry! Deal ending soon</span>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <Button 
          className="w-full apple-button bg-primary hover:bg-primary/90 font-semibold"
          disabled={isExpired || isSoldOut}
          onClick={handleShopNow}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {isExpired ? "Deal Expired" : isSoldOut ? "Sold Out" : "Shop Now"}
        </Button>
      </CardContent>
    </Card>
  );
}