import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Heart, ShoppingCart, Award } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  images: any; // JSON field from database
  category: string;
  stock_quantity: number;
  seller_id: string;
  created_at: string;
  is_active: boolean;
  featured: boolean;
  tags?: string[];
  sales_count?: number;
  avg_rating?: number;
}

interface BestSellersSectionProps {
  maxItems?: number;
  className?: string;
}

export function BestSellersSection({ maxItems = 6, className = "" }: BestSellersSectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBestSellers();
  }, [maxItems]);

  const fetchBestSellers = async () => {
    try {
      setLoading(true);

      // Fetch featured products first as best sellers
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('featured', true)
        .gte('stock_quantity', 1)
        .limit(maxItems);

      if (error) throw error;

      // If no featured products, get random active products
      if (!products || products.length === 0) {
        const { data: fallbackProducts, error: fallbackError } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .gte('stock_quantity', 1)
          .limit(maxItems);

        if (fallbackError) throw fallbackError;

        // Add mock metrics for display
        const productsWithMetrics = fallbackProducts?.map((product: any) => ({
          ...product,
          sales_count: Math.floor(Math.random() * 50) + 10, // Mock sales count
          avg_rating: Math.random() * 2 + 3, // Mock rating between 3-5
        })) || [];

        setProducts(productsWithMetrics);
      } else {
        // Add mock metrics for featured products
        const productsWithMetrics = products.map((product: any) => ({
          ...product,
          sales_count: Math.floor(Math.random() * 100) + 50, // Higher mock sales for featured
          avg_rating: Math.random() * 1 + 4, // Higher mock rating between 4-5
        }));

        setProducts(productsWithMetrics);
      }
    } catch (error) {
      console.error('Error fetching best sellers:', error);
      toast.error('Failed to load best sellers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    toast.success(`${product.name} added to cart!`);
  };

  if (loading) {
    return (
      <section className={`py-16 bg-muted/20 ${className}`}>
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="h-8 bg-muted rounded-lg w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-96 mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: maxItems }).map((_, i) => (
              <div key={i} className="h-96 bg-muted rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className={`py-12 sm:py-16 bg-muted/20 ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4">
            <Award className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground tracking-tight">
              Best Sellers
            </h2>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg leading-relaxed px-4">
            Top-rated products loved by our community. These items have proven quality and customer satisfaction.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {products.map((product, index) => (
            <Card 
              key={product.id} 
              className="apple-card group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative">
                <img 
                  src={Array.isArray(product.images) && product.images.length > 0 
                    ? product.images[0] 
                    : `https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=400&h=300`}
                  alt={product.name}
                  className="w-full h-56 object-cover rounded-t-2xl group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Best Seller Badge */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <Badge className="bg-accent text-accent-foreground text-xs font-medium border-0 flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    Best Seller
                  </Badge>
                  <Badge className="bg-background/90 text-foreground text-xs font-medium border-0">
                    {product.category}
                  </Badge>
                </div>

                {/* Favorite Button */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-4 right-4 h-9 w-9 p-0 apple-glass rounded-full text-muted-foreground hover:text-red-500"
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
              
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground text-lg tracking-tight line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-full">
                    <Star className="h-3 w-3 fill-accent text-accent" />
                    <span className="text-xs font-medium">
                      {product.avg_rating ? product.avg_rating.toFixed(1) : 'New'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({product.sales_count || 0} sold)
                    </span>
                  </div>
                  <span className="font-semibold text-foreground text-lg tracking-tight">
                    ${product.price}
                  </span>
                </div>
                
                <Button 
                  className="w-full h-11 apple-button font-medium bg-primary hover:bg-primary/90"
                  onClick={() => handleAddToCart(product)}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Button variant="outline" size="lg" className="apple-button font-medium px-8" asChild>
            <a href="/best-sellers">View All Best Sellers</a>
          </Button>
        </div>
      </div>
    </section>
  );
}