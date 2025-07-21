import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Heart, ShoppingCart, MapPin, Verified } from "lucide-react";
import { useState } from "react";

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

  return (
    <Card className="group hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      <div className="relative">
        <img 
          src={product.image}
          alt={product.name}
          className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <Badge className="bg-primary text-primary-foreground text-xs font-medium">
            {product.category}
          </Badge>
          {product.featured && (
            <Badge className="bg-accent text-accent-foreground text-xs font-medium">
              ⭐ Featured
            </Badge>
          )}
          {!product.inStock && (
            <Badge variant="destructive" className="text-xs font-medium">
              Out of Stock
            </Badge>
          )}
        </div>

        {/* Favorite Button */}
        <Button
          size="sm"
          variant="ghost"
          className={`absolute top-3 right-3 h-8 w-8 p-0 bg-background/80 hover:bg-background ${
            isFavorited ? "text-red-500" : "text-muted-foreground"
          }`}
          onClick={() => setIsFavorited(!isFavorited)}
          aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
        </Button>
      </div>
      
      <CardContent className="p-4 space-y-4">
        {/* Product Info */}
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground text-lg leading-tight line-clamp-2">
            {product.name}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-2">
            {product.description}
          </p>
        </div>

        {/* Price and Rating */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-primary text-xl">{product.price}</span>
              {product.originalPrice && (
                <span className="text-muted-foreground text-sm line-through">
                  {product.originalPrice}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-accent text-accent" />
            <span className="text-sm font-medium text-foreground">{product.rating}</span>
            <span className="text-xs text-muted-foreground">({product.reviews})</span>
          </div>
        </div>

        {/* Seller Info */}
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
          <Avatar className="h-8 w-8">
            <AvatarImage src={product.seller.avatar} alt={product.seller.name} />
            <AvatarFallback>{product.seller.name.charAt(0)}</AvatarFallback>
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
          
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-accent text-accent" />
            <span className="text-xs font-medium">{product.seller.rating}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1 h-11"
            disabled={!product.inStock}
          >
            💬 Contact Seller
          </Button>
          <Button 
            className="flex-1 h-11 font-semibold"
            disabled={!product.inStock}
            onClick={() => onBuyNow?.(product, 1)}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {product.inStock ? "🛒 Buy Now" : "❌ Out of Stock"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}