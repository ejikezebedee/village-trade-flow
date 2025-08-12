import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Package, 
  ShoppingCart, 
  Truck, 
  Store, 
  Star,
  MapPin,
  Users,
  Clock,
  DollarSign,
  Search,
  Filter,
  Plus
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  images: string[];
  seller_id: string;
  seller_name: string;
  location: any;
  state: string;
  lga: string;
  community: string;
  stock_quantity: number;
  average_rating: number;
  total_reviews: number;
  is_featured: boolean;
  created_at: string;
}

interface Order {
  id: string;
  order_number: string;
  product_name: string;
  quantity: number;
  total_amount: number;
  order_status: string;
  current_stage: string;
  buyer_id: string;
  seller_id: string;
  driver_id?: string;
  shop_id?: string;
  created_at: string;
  estimated_delivery_time?: string;
}

interface DeliveryBid {
  id: string;
  order_id: string;
  bidder_id: string;
  bidder_type: 'driver' | 'shop';
  bid_amount: number;
  estimated_time_minutes: number;
  message: string;
  status: string;
  created_at: string;
}

export const SecureMarketplace: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bids, setBids] = useState<DeliveryBid[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        fetchData();
      }
    });
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          profiles!products_seller_id_fkey(
            first_name,
            last_name,
            display_name
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      const processedProducts = productsData?.map(product => ({
        ...product,
        seller_name: product.profiles?.display_name || 
          `${product.profiles?.first_name || ''} ${product.profiles?.last_name || ''}`.trim() ||
          'Unknown Seller',
        images: Array.isArray(product.images) ? product.images : []
      })) || [];

      setProducts(processedProducts);

      // Fetch user's orders if authenticated
      if (user) {
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id},driver_id.eq.${user.id},shop_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;
        setOrders(ordersData || []);

        // Fetch delivery bids
        const { data: bidsData, error: bidsError } = await supabase
          .from('delivery_bids')
          .select('*')
          .order('created_at', { ascending: false });

        if (bidsError) throw bidsError;
        setBids(bidsData || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load marketplace data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (product: Product) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to place orders.",
        variant: "destructive"
      });
      return;
    }

    try {
      const orderData = {
        buyer_id: user.id,
        seller_id: product.seller_id,
        product_name: product.name,
        product_description: product.description,
        product_image_url: product.images[0] || null,
        quantity: 1,
        unit_price: product.price,
        total_amount: product.price,
        currency: product.currency,
        pickup_location: {
          state: product.state,
          lga: product.lga,
          community: product.community
        },
        delivery_location: {
          // This would be set based on user's delivery address
          state: 'Lagos',
          lga: 'Ikeja',
          community: 'Allen'
        }
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Order Created",
        description: `Order ${data.order_number} has been created successfully.`,
      });

      fetchData();
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "Failed to create order.",
        variant: "destructive"
      });
    }
  };

  const placeBid = async (orderId: string, bidAmount: number, bidderType: 'driver' | 'shop') => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to place bids.",
        variant: "destructive"
      });
      return;
    }

    try {
      const bidData = {
        order_id: orderId,
        bidder_id: user.id,
        bidder_type: bidderType,
        bid_amount: bidAmount,
        estimated_time_minutes: bidderType === 'driver' ? 60 : 30,
        message: `${bidderType === 'driver' ? 'Delivery' : 'Storage'} service available`
      };

      const { error } = await supabase
        .from('delivery_bids')
        .insert([bidData]);

      if (error) throw error;

      toast({
        title: "Bid Placed",
        description: `Your ${bidderType} bid has been placed successfully.`,
      });

      fetchData();
    } catch (error) {
      console.error('Error placing bid:', error);
      toast({
        title: "Error",
        description: "Failed to place bid.",
        variant: "destructive"
      });
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            VillageMarket
          </h1>
          <p className="text-muted-foreground">Secure P2P Logistics & Commerce Platform</p>
        </div>
        {user && (
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            List Product
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Products</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Bids</p>
                <p className="text-2xl font-bold">{bids.filter(b => b.status === 'pending').length}</p>
              </div>
              <Truck className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
              <Store className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="bids">Delivery Bids</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <CardTitle>Browse Products</CardTitle>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    <div className="aspect-video bg-muted relative">
                      {product.images[0] ? (
                        <img 
                          src={product.images[0]} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      {product.is_featured && (
                        <Badge className="absolute top-2 left-2" variant="secondary">
                          Featured
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold truncate">{product.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-bold text-primary">
                            ₦{product.price.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">
                              {product.average_rating.toFixed(1)} ({product.total_reviews})
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {product.community}, {product.lga}, {product.state}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>by {product.seller_name}</span>
                          <Badge variant="outline">
                            {product.stock_quantity} in stock
                          </Badge>
                        </div>
                        <Button 
                          className="w-full mt-4"
                          onClick={() => createOrder(product)}
                          disabled={product.stock_quantity === 0}
                        >
                          {product.stock_quantity === 0 ? 'Out of Stock' : 'Order Now'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No orders found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Card key={order.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{order.product_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Order #{order.order_number}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <Badge>{order.order_status}</Badge>
                              <Badge variant="outline">{order.current_stage}</Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              ₦{order.total_amount.toLocaleString()}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Qty: {order.quantity}
                            </p>
                          </div>
                        </div>
                        {order.current_stage === 'driver_bidding' && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm font-medium mb-2">Need delivery?</p>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => placeBid(order.id, 500, 'driver')}
                              >
                                Request Driver (₦500)
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => placeBid(order.id, 200, 'shop')}
                              >
                                Use Storage (₦200)
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bids Tab */}
        <TabsContent value="bids" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Bids</CardTitle>
            </CardHeader>
            <CardContent>
              {bids.length === 0 ? (
                <div className="text-center py-8">
                  <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No bids found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bids.map((bid) => (
                    <Card key={bid.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              {bid.bidder_type === 'driver' ? (
                                <Truck className="h-4 w-4" />
                              ) : (
                                <Store className="h-4 w-4" />
                              )}
                              <span className="font-semibold capitalize">
                                {bid.bidder_type} Bid
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {bid.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge>{bid.status}</Badge>
                              <span className="text-sm text-muted-foreground">
                                Est: {bid.estimated_time_minutes} min
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              ₦{bid.bid_amount.toLocaleString()}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(bid.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};