import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Heart, ShoppingCart, MapPin, Verified } from "lucide-react";
import { useState } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    price: string;
    originalPrice?: string;
    description: string;
    image: string;
    category: string;
    rating: number;
    reviews: number;
    seller: {
      name: string;
      avatar: string;
      verified: boolean;
      location: string;
      rating: number;
    };
    inStock: boolean;
    featured?: boolean;
  };
  onBuyNow?: (product: any, quantity: number) => void;
}

export function ProductCard({ product, onBuyNow }: ProductCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  
  // Simplified analytics - no automatic tracking on mount
  const handleProductView = () => {
    try {
      // Only track if useAnalytics is available
      const { trackProductEvent } = useAnalytics();
      trackProductEvent(product.id.toString(), 'view', {
        name: product.name,
        category: product.category,
        price: parseFloat(product.price.replace('$', '')),
        seller: product.seller.name
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  };

  const handleProductClick = () => {
    try {
      const { trackProductEvent } = useAnalytics();
      trackProductEvent(product.id.toString(), 'click', {
        name: product.name,
        category: product.category,
        price: parseFloat(product.price.replace('$', '')),
        seller: product.seller.name
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorited(!isFavorited);
    try {
      const { trackProductEvent, trackEvent } = useAnalytics();
      trackProductEvent(product.id.toString(), 'favorite', {
        name: product.name,
        category: product.category,
        favorited: !isFavorited
      });
      trackEvent('engagement', 'product_favorited', {
        product_id: product.id,
        product_name: product.name,
        action: !isFavorited ? 'add' : 'remove'
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { trackProductEvent, trackEvent } = useAnalytics();
      trackProductEvent(product.id.toString(), 'add_to_cart', {
        name: product.name,
        category: product.category,
        price: parseFloat(product.price.replace('$', '')),
        seller: product.seller.name
      });
      trackEvent('ecommerce', 'add_to_cart', {
        product_id: product.id,
        product_name: product.name,
        value: parseFloat(product.price.replace('$', ''))
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
    if (onBuyNow) {
      onBuyNow(product, 1);
    }
  };

  // REMOVED: Automatic analytics tracking on mount to prevent delays

  return (
    <Card 
      className="apple-card group overflow-hidden cursor-pointer"
      onClick={handleProductClick}
    >
      <div className="relative">
        <img 
          src={product.image}
          alt={product.name}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <Badge className="bg-background/90 text-foreground text-xs font-medium border-0">
            {product.category}
          </Badge>
          {product.featured && (
            <Badge className="bg-primary text-primary-foreground text-xs font-medium border-0">
              Featured
            </Badge>
          )}
          {!product.inStock && (
            <Badge variant="destructive" className="text-xs font-medium border-0">
              Out of Stock
            </Badge>
          )}
        </div>

        {/* Favorite Button */}
        <Button
          size="sm"
          variant="ghost"
          className={`absolute top-4 right-4 h-9 w-9 p-0 apple-glass rounded-full ${
            isFavorited ? "text-red-500" : "text-muted-foreground"
          }`}
          onClick={handleFavorite}
          aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
        </Button>
      </div>
      
      <CardContent className="p-6 space-y-4">
        {/* Product Info */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground text-lg leading-tight tracking-tight">
            {product.name}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
            {product.description}
          </p>
        </div>

        {/* Price and Rating */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-foreground text-xl tracking-tight">{product.price}</span>
              {product.originalPrice && (
                <span className="text-muted-foreground text-sm line-through">
                  {product.originalPrice}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-full">
            <Star className="h-3 w-3 fill-accent text-accent" />
            <span className="text-xs font-medium text-foreground">{product.rating}</span>
            <span className="text-xs text-muted-foreground">({product.reviews})</span>
          </div>
        </div>

        {/* Seller Info */}
        <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl">
          <Avatar className="h-8 w-8">
            <AvatarImage src={product.seller.avatar} alt={product.seller.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {product.seller.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-sm font-medium text-foreground truncate">
                {product.seller.name}
              </p>
              {product.seller.verified && (
                <Verified className="h-3 w-3 text-primary flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <p className="text-xs text-muted-foreground truncate">
                {product.seller.location}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 bg-accent/10 px-2 py-1 rounded-full">
            <Star className="h-3 w-3 fill-accent text-accent" />
            <span className="text-xs font-medium">{product.seller.rating}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button 
            variant="outline" 
            className="flex-1 h-11 apple-button font-medium"
            disabled={!product.inStock}
          >
            Contact Seller
          </Button>
          <Button 
            className="flex-1 h-11 apple-button font-medium bg-primary hover:bg-primary/90"
            disabled={!product.inStock}
            onClick={handleBuyNow}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {product.inStock ? "Buy Now" : "Out of Stock"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}