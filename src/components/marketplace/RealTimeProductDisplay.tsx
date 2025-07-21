import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProductDisplayProps {
  sellerId?: string;
  refreshTrigger?: number;
}

export const RealTimeProductDisplay: React.FC<ProductDisplayProps> = ({ 
  sellerId, 
  refreshTrigger 
}) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProducts = async () => {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          profiles:seller_id (
            first_name,
            last_name,
            user_id
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (sellerId) {
        query = query.eq('seller_id', sellerId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching products:', error);
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error in fetchProducts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [sellerId, refreshTrigger]);

  useEffect(() => {
    // Set up real-time subscription for products
    const channel = supabase
      .channel('product_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          console.log('Real-time product change detected:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newProduct = payload.new as any;
            setProducts(prev => [newProduct, ...prev]);
            
            toast({
              title: "🎉 New Product Added!",
              description: `${newProduct.name} is now available${newProduct.tags?.includes('new-arrival') ? ' (New Arrival)' : ''}`,
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedProduct = payload.new as any;
            setProducts(prev => prev.map(p => 
              p.id === updatedProduct.id ? updatedProduct : p
            ));
          } else if (payload.eventType === 'DELETE') {
            const deletedProductId = payload.old.id;
            setProducts(prev => prev.filter(p => p.id !== deletedProductId));
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  if (loading) {
    return <div className="text-center p-4">Loading products...</div>;
  }

  return (
    <div className="space-y-4">
      {products.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">
          No products found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold">{product.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                {product.description}
              </p>
              
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-lg">
                  ${product.price} {product.unit_type && `per ${product.unit_type}`}
                </span>
                <span className="text-sm text-muted-foreground">
                  Stock: {product.stock_quantity}
                </span>
              </div>

              <div className="flex flex-wrap gap-1 mb-2">
                <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                  {product.category}
                </span>
                {product.tags?.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-secondary/50 text-secondary-foreground rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {product.category_confidence && (
                <div className="text-xs text-muted-foreground">
                  Category confidence: {Math.round(product.category_confidence * 100)}%
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};