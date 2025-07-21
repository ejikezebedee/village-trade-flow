import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CacheConfig {
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean;
}

// High-traffic page cache configurations
export const CACHE_CONFIGS = {
  PRODUCTS: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },
  SEARCH_RESULTS: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },
  USER_DASHBOARD: {
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 3 * 60 * 1000, // 3 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: false,
  },
  STATIC_DATA: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  }
} as const;

// Cached product listings
export const useCachedProducts = (filters?: any) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true);
      
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.featured) {
        query = query.eq('featured', true);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    ...CACHE_CONFIGS.PRODUCTS,
  });
};

// Cached search results with local storage backup
export const useCachedSearch = (searchQuery: string, filters?: any) => {
  return useQuery({
    queryKey: ['search', searchQuery, filters],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .eq('is_active', true)
        .limit(50);
      
      if (error) throw error;
      
      // Cache in localStorage for offline access
      localStorage.setItem(`search_${searchQuery}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      
      return data;
    },
    ...CACHE_CONFIGS.SEARCH_RESULTS,
    enabled: !!searchQuery,
  });
};

// Cached user orders
export const useCachedUserOrders = (userId?: string) => {
  return useQuery({
    queryKey: ['user-orders', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    ...CACHE_CONFIGS.USER_DASHBOARD,
    enabled: !!userId,
  });
};

// Cached static data (FAQs, categories, etc.)
export const useCachedStaticData = <T>(
  key: string,
  queryFn: () => Promise<T>
) => {
  return useQuery({
    queryKey: [key],
    queryFn,
    ...CACHE_CONFIGS.STATIC_DATA,
  });
};