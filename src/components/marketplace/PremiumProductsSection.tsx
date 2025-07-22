import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Crown, ShoppingCart, Heart } from "lucide-react";
import { useState, useEffect } from "react";

interface PremiumProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  brand: string;
  premium_tier: 'gold' | 'platinum' | 'diamond';
  features: string[];
  isLimited?: boolean;
  stock?: number;
}

interface PremiumProductsSectionProps {
  maxItems?: number;
  showHeader?: boolean;
  className?: string;
}

export function PremiumProductsSection({ 
  maxItems = 8, 
  showHeader = true,
  className = ""
}: PremiumProductsSectionProps) {
  const [products, setProducts] = useState<PremiumProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock premium products data
  useEffect(() => {
    const mockProducts: PremiumProduct[] = [
      {
        id: "1",
        name: "Artisan Organic Honey Collection",
        price: 89.99,
        originalPrice: 120.00,
        image: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=400&h=300",
        rating: 4.9,
        reviews: 342,
        brand: "Golden Hive",
        premium_tier: 'diamond',
        features: ["Organic Certified", "Limited Edition", "Premium Packaging"],
        isLimited: true,
        stock: 12
      },
      {
        id: "2", 
        name: "Heritage Ceramic Coffee Set",
        price: 156.99,
        originalPrice: 220.00,
        image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=400&h=300",
        rating: 4.8,
        reviews: 189,
        brand: "CraftMaster",
        premium_tier: 'platinum',
        features: ["Handcrafted", "Premium Materials", "Gift Box Included"],
        isLimited: false,
        stock: 28
      },
      {
        id: "3",
        name: "Premium Leather Handbag",
        price: 299.99,
        originalPrice: 450.00,
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&h=300",
        rating: 4.9,
        reviews: 567,
        brand: "LuxeCraft",
        premium_tier: 'diamond',
        features: ["Genuine Leather", "Designer Quality", "Lifetime Warranty"],
        isLimited: true,
        stock: 8
      },
      {
        id: "4",
        name: "Smart Fitness Tracker Pro",
        price: 199.99,
        originalPrice: 299.99,
        image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=400&h=300",
        rating: 4.7,
        reviews: 1234,
        brand: "TechFit",
        premium_tier: 'gold',
        features: ["Health Monitoring", "7-Day Battery", "Waterproof"],
        isLimited: false,
        stock: 45
      }
    ];

    setTimeout(() => {
      setProducts(mockProducts.slice(0, maxItems));
      setLoading(false);
    }, 1000);
  }, [maxItems]);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'diamond': return 'bg-gradient-to-r from-cyan-400 to-blue-500';
      case 'platinum': return 'bg-gradient-to-r from-gray-400 to-gray-600';
      case 'gold': return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      default: return 'bg-primary';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'diamond': return '💎';
      case 'platinum': return '🏆';
      case 'gold': return '👑';
      default: return '⭐';
    }
  };

  if (loading) {
    return (
      <section className={`py-8 sm:py-12 ${className}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {showHeader && (
            <div className="text-center mb-8 sm:mb-12">
              <div className="h-8 bg-muted rounded-lg w-64 mx-auto mb-4 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-96 mx-auto animate-pulse"></div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: maxItems }).map((_, i) => (
              <div key={i} className="h-96 bg-muted rounded-2xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`py-8 sm:py-12 ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {showHeader && (
          <div className="text-center mb-8 sm:mb-12 animate-fade-in">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Premium Collection
              </h2>
              <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
              Discover our handpicked premium products with exceptional quality and exclusive features
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product, index) => (
            <Card 
              key={product.id} 
              className="group hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-b from-background to-background/50 backdrop-blur-sm overflow-hidden animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative">
                {/* Premium Tier Badge */}
                <div className={`absolute top-3 left-3 z-10 px-2 py-1 rounded-full text-white text-xs font-medium ${getTierColor(product.premium_tier)}`}>
                  {getTierIcon(product.premium_tier)} {product.premium_tier.toUpperCase()}
                </div>
                
                {/* Limited Badge */}
                {product.isLimited && (
                  <div className="absolute top-3 right-3 z-10 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    LIMITED
                  </div>
                )}

                {/* Product Image */}
                <div className="relative aspect-square overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Quick Actions */}
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                    <Button size="sm" variant="secondary" className="rounded-full h-8 w-8 p-0 bg-white/90 hover:bg-white">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6">
                  {/* Brand */}
                  <Badge variant="outline" className="mb-2 text-xs">
                    {product.brand}
                  </Badge>

                  {/* Title */}
                  <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>

                  {/* Features */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {product.features.slice(0, 2).map((feature, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs py-0 px-2 bg-primary/10 text-primary">
                        {feature}
                      </Badge>
                    ))}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium ml-1">{product.rating}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">({product.reviews} reviews)</span>
                  </div>

                  {/* Stock Status */}
                  {product.isLimited && product.stock && product.stock <= 10 && (
                    <div className="mb-3">
                      <Badge variant="destructive" className="text-xs">
                        Only {product.stock} left!
                      </Badge>
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg sm:text-xl font-bold text-foreground">
                        ${product.price}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          ${product.originalPrice}
                        </span>
                      )}
                    </div>
                    {product.originalPrice && (
                      <Badge variant="destructive" className="text-xs">
                        {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                      </Badge>
                    )}
                  </div>

                  {/* Add to Cart Button */}
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 group-hover:shadow-lg"
                    size="sm"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-8 sm:mt-12">
          <Button 
            variant="outline" 
            size="lg"
            className="px-8 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
          >
            View All Premium Products
          </Button>
        </div>
      </div>
    </section>
  );
}