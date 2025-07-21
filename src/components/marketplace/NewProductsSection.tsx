import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Heart, ShoppingCart, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

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
}

interface NewProductsSectionProps {
  maxItems?: number;
  className?: string;
  showHeader?: boolean;
  daysThreshold?: number; // How many days to consider "new"
}

export function NewProductsSection({ 
  maxItems = 6, 
  className = "", 
  showHeader = true,
  daysThreshold = 7 
}: NewProductsSectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNewProducts();
  }, [maxItems, daysThreshold]);

  const fetchNewProducts = async () => {
    try {
      setLoading(true);

      // Calculate the date threshold
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

      const { data: newProducts, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .gte('stock_quantity', 1)
        .gte('created_at', thresholdDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(maxItems);

      if (error) throw error;

      setProducts(newProducts || []);
    } catch (error) {
      console.error('Error fetching new products:', error);
      toast.error('Failed to load new products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    toast.success(`${product.name} added to cart!`);
  };

  const getTimeSinceAdded = (createdAt: string) => {
    return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  };

  if (loading) {
    return (
      <section className={`py-16 bg-background ${className}`}>
        <div className="container mx-auto px-6 lg:px-8">
          {showHeader && (
            <div className="text-center mb-12">
              <div className="h-8 bg-muted rounded-lg w-64 mx-auto mb-4 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-96 mx-auto animate-pulse"></div>
            </div>
          )}
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
    <section className={`py-16 bg-background ${className}`}>
      <div className="container mx-auto px-6 lg:px-8">
        {showHeader && (
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
              <h2 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight">
                New Arrivals
              </h2>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
              Fresh products just added to our marketplace. Be the first to discover these amazing new offerings.
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                
                {/* New Badge */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <Badge className="bg-primary text-primary-foreground text-xs font-medium border-0 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    New
                  </Badge>
                  <Badge className="bg-background/90 text-foreground text-xs font-medium border-0">
                    {product.category}
                  </Badge>
                  <Badge variant="outline" className="bg-background/90 text-xs font-medium">
                    Added {getTimeSinceAdded(product.created_at)}
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
                    <span className="text-xs font-medium">New</span>
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
        
        {showHeader && (
          <div className="text-center mt-12">
            <Button variant="outline" size="lg" className="apple-button font-medium px-8">
              View All New Products
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}