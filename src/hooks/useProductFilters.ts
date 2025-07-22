import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FilterOptions {
  priceRange: {
    min: number;
    max: number;
  };
  categories: string[];
  brands: string[];
  minRating: number;
  inStockOnly: boolean;
}

export interface SortOption {
  value: string;
  label: string;
}

export const sortOptions: SortOption[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_low_high', label: 'Price: Low to High' },
  { value: 'price_high_low', label: 'Price: High to Low' },
  { value: 'rating_high_low', label: 'Highest Rated' },
  { value: 'rating_low_high', label: 'Lowest Rated' },
  { value: 'name_a_z', label: 'Name: A to Z' },
  { value: 'name_z_a', label: 'Name: Z to A' }
];

export interface UseProductFiltersProps {
  initialFilters?: Partial<FilterOptions>;
  initialSort?: string;
  productType?: 'all' | 'best_sellers' | 'new_products' | 'flash_sales' | 'auction';
}

export function useProductFilters({
  initialFilters = {},
  initialSort = 'newest',
  productType = 'all'
}: UseProductFiltersProps = {}) {
  const [filters, setFilters] = useState<FilterOptions>({
    priceRange: { min: 0, max: 10000 },
    categories: [],
    brands: [],
    minRating: 0,
    inStockOnly: true,
    ...initialFilters
  });
  
  const [sortBy, setSortBy] = useState(initialSort);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });

  // Fetch initial data for filter options
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  // Fetch products when filters or sort changes
  useEffect(() => {
    fetchFilteredProducts();
  }, [filters, sortBy, productType]);

  const fetchFilterOptions = async () => {
    try {
      // Get available categories
      const { data: categories } = await supabase
        .from('products')
        .select('category')
        .eq('is_active', true)
        .not('category', 'is', null);

      // Get available brands  
      const { data: brands } = await supabase
        .from('brands')
        .select('name')
        .eq('is_active', true);

      // Get price range
      const { data: priceData } = await supabase
        .from('products')
        .select('price')
        .eq('is_active', true)
        .order('price', { ascending: true });

      const uniqueCategories = [...new Set(categories?.map(p => p.category).filter(Boolean))];
      const uniqueBrands = brands?.map(b => b.name) || [];
      
      const minPrice = priceData?.[0]?.price || 0;
      const maxPrice = priceData?.[priceData.length - 1]?.price || 10000;

      setAvailableCategories(uniqueCategories);
      setAvailableBrands(uniqueBrands);
      setPriceRange({ min: minPrice, max: maxPrice });
      
      // Update filters with actual range
      setFilters(prev => ({
        ...prev,
        priceRange: { min: minPrice, max: maxPrice }
      }));
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const fetchFilteredProducts = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('products')
        .select(`
          *,
          brands!brands_id_fkey(name),
          orders!orders_seller_id_fkey(id, order_status),
          feedback!feedback_reviewee_id_fkey(rating)
        `)
        .eq('is_active', true);

      // Apply stock filter
      if (filters.inStockOnly) {
        query = query.gt('stock_quantity', 0);
      }

      // Apply price range filter
      query = query
        .gte('price', filters.priceRange.min)
        .lte('price', filters.priceRange.max);

      // Apply category filter
      if (filters.categories.length > 0) {
        query = query.in('category', filters.categories);
      }

      // Apply brand filter (need to join with brands table)
      if (filters.brands.length > 0) {
        // This would require a more complex query structure
        // For now, we'll filter on the client side
      }

      const { data: allProducts, error } = await query;
      
      if (error) throw error;

      let processedProducts = allProducts?.map((product: any) => {
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
          brand_name: product.brands?.name || '',
          best_seller_score: (completedOrders.length * 2) + (avgRating * 0.5)
        };
      }) || [];

      // Apply brand filter on processed data
      if (filters.brands.length > 0) {
        processedProducts = processedProducts.filter((product: any) =>
          filters.brands.includes(product.brand_name)
        );
      }

      // Apply rating filter
      if (filters.minRating > 0) {
        processedProducts = processedProducts.filter((product: any) =>
          product.avg_rating >= filters.minRating
        );
      }

      // Apply product type specific filters
      if (productType === 'best_sellers') {
        processedProducts = processedProducts.filter((p: any) => p.best_seller_score > 0);
      } else if (productType === 'new_products') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        processedProducts = processedProducts.filter((p: any) =>
          new Date(p.created_at) >= weekAgo
        );
      }

      // Apply sorting
      const sortedProducts = applySorting(processedProducts, sortBy);
      
      setProducts(sortedProducts);
    } catch (error) {
      console.error('Error fetching filtered products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const applySorting = (products: any[], sortOption: string) => {
    return [...products].sort((a, b) => {
      switch (sortOption) {
        case 'price_low_high':
          return a.price - b.price;
        case 'price_high_low':
          return b.price - a.price;
        case 'rating_high_low':
          return (b.avg_rating || 0) - (a.avg_rating || 0);
        case 'rating_low_high':
          return (a.avg_rating || 0) - (b.avg_rating || 0);
        case 'name_a_z':
          return a.name.localeCompare(b.name);
        case 'name_z_a':
          return b.name.localeCompare(a.name);
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  };

  const updateFilters = (newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters({
      priceRange,
      categories: [],
      brands: [],
      minRating: 0,
      inStockOnly: true
    });
    setSortBy('newest');
  };

  const filterStats = useMemo(() => {
    const activeFiltersCount = 
      (filters.categories.length > 0 ? 1 : 0) +
      (filters.brands.length > 0 ? 1 : 0) +
      (filters.minRating > 0 ? 1 : 0) +
      (filters.priceRange.min > priceRange.min || filters.priceRange.max < priceRange.max ? 1 : 0);
    
    return {
      activeFiltersCount,
      totalResults: products.length
    };
  }, [filters, products.length, priceRange]);

  return {
    filters,
    sortBy,
    products,
    loading,
    availableCategories,
    availableBrands,
    priceRange,
    filterStats,
    updateFilters,
    setSortBy,
    resetFilters,
    refetch: fetchFilteredProducts
  };
}