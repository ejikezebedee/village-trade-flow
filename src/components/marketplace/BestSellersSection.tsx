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

      // Fetch products with their order counts and ratings
      const { data: bestSellers, error } = await supabase
        .from('products')
        .select(`
          *,
          orders!orders_seller_id_fkey(id, order_status),
          feedback!feedback_reviewee_id_fkey(rating)
        `)
        .eq('is_active', true)
        .gte('stock_quantity', 1)
        .limit(maxItems * 2); // Fetch more to filter best sellers

      if (error) throw error;

      // Calculate sales metrics for each product
      const productsWithMetrics = bestSellers?.map((product: any) => {
        const completedOrders = product.orders?.filter((order: any) => 
          order.order_status === 'delivered'
        ) || [];
        
        const ratings = product.feedback?.map((f: any) => f.rating) || [];
        const avgRating = ratings.length > 0 
          ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length 
          : 0;

        return {
          ...product,
          sales_count: completedOrders.length,
          avg_rating: avgRating,
          // Calculate best seller score (combination of sales and rating)
          best_seller_score: (completedOrders.length * 2) + (avgRating * 0.5)
        };
      }) || [];

      // Sort by best seller score and take top items
      const topProducts = productsWithMetrics
        .filter((p: any) => p.best_seller_score > 0) // Only include products with sales or ratings
        .sort((a: any, b: any) => b.best_seller_score - a.best_seller_score)
        .slice(0, maxItems);

      setProducts(topProducts);
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
    <section className={`py-16 bg-muted/20 ${className}`}>
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Award className="h-8 w-8 text-accent" />
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight">
              Best Sellers
            </h2>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            Top-rated products loved by our community. These items have proven quality and customer satisfaction.
          </p>
        </div>
        
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
          <Button variant="outline" size="lg" className="apple-button font-medium px-8">
            View All Best Sellers
          </Button>
        </div>
      </div>
    </section>
  );
}