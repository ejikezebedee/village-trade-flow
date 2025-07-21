import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Header } from "@/components/marketplace/Header";
import { StockAlerts } from "@/components/marketplace/StockAlerts";
import { EnhancedAddProduct } from "@/components/marketplace/EnhancedAddProduct";
import { RealTimeProductDisplay } from "@/components/marketplace/RealTimeProductDisplay";
import { SalesAnalytics } from "@/components/seller/SalesAnalytics";
import { OrderActions } from "@/components/orders/OrderActions";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Store, 
  Package, 
  TrendingUp, 
  DollarSign,
  Plus,
  Edit,
  Eye,
  MessageCircle,
  Star,
  BarChart3,
  Sparkles,
  AlertTriangle
} from "lucide-react";

const currentProducts = [
  {
    id: 1,
    name: "Fresh Organic Tomatoes",
    price: "$2.50/kg",
    stock: 25,
    sold: 124,
    status: "active",
    image: "https://images.unsplash.com/photo-1592921870789-04563d55041c?auto=format&fit=crop&w=100&h=100",
    rating: 4.8,
    views: 1240
  },
  {
    id: 2,
    name: "Pure Wild Honey",
    price: "$8.00/jar", 
    stock: 0,
    sold: 203,
    status: "out_of_stock",
    image: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=100&h=100",
    rating: 4.7,
    views: 856
  },
  {
    id: 3,
    name: "Handwoven Baskets",
    price: "$15.00",
    stock: 8,
    sold: 87,
    status: "active",
    image: "https://images.unsplash.com/photo-1556909114-4be3c6d10115?auto=format&fit=crop&w=100&h=100",
    rating: 4.9,
    views: 632
  }
];

const recentSales = [
  {
    id: "SALE001",
    product: "Fresh Organic Tomatoes",
    buyer: "Sarah M.",
    amount: "$5.00",
    date: "2024-01-15",
    status: "completed"
  },
  {
    id: "SALE002",
    product: "Handwoven Baskets", 
    buyer: "John D.",
    amount: "$15.00",
    date: "2024-01-14",
    status: "processing"
  },
  {
    id: "SALE003",
    product: "Pure Wild Honey",
    buyer: "Emily R.",
    amount: "$8.00", 
    date: "2024-01-13",
    status: "shipped"
  }
];

export default function SellerDashboard() {
  const [user, setUser] = useState(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [products, setProducts] = useState(currentProducts);
  const [stockAlertCount, setStockAlertCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchStockAlertCount();
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setIsLoadingOrders(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('seller_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchStockAlertCount = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!profile) return;

      const { count, error } = await supabase
        .from('stock_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', profile.id)
        .eq('is_read', false);

      if (error) throw error;
      setStockAlertCount(count || 0);
    } catch (error) {
      console.error('Error fetching stock alert count:', error);
    }
  };

  const handleProductAdded = () => {
    toast({
      title: "🎉 Product Added Successfully!",
      description: "Your product is now live and visible to buyers with smart categorization and auto-tags.",
    });
    setRefreshTrigger(prev => prev + 1);
    setShowAddProduct(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "out_of_stock": return "bg-red-500";
      case "draft": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return "✅ Active";
      case "out_of_stock": return "❌ Out of Stock";
      case "draft": return "📝 Draft";
      default: return status;
    }
  };


  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        <div className="container mx-auto px-4 py-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100" />
                  <AvatarFallback>MF</AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    Welcome back, Mike! 🌾
                  </h1>
                  <p className="text-muted-foreground">Village Farm Co-op • Verified Seller</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={() => setShowAddProduct(!showAddProduct)}
                  className="h-12 px-6"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                  <Badge variant="secondary" className="ml-2">
                    <Sparkles className="h-3 w-3 mr-1" />
                    🤖 AI Auto-categorization
                  </Badge>
                </Button>
                {stockAlertCount > 0 && (
                  <Button variant="outline" className="h-12 px-4">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    {stockAlertCount} Alerts
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <Store className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold text-foreground">24</div>
                <p className="text-sm text-muted-foreground">Active Products</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold text-foreground">$1,247</div>
                <p className="text-sm text-muted-foreground">This Month</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Package className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold text-foreground">156</div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <div className="text-2xl font-bold text-foreground">4.8</div>
                <p className="text-sm text-muted-foreground">Rating</p>
              </CardContent>
            </Card>
          </div>

          {/* Add Product Form */}
          {showAddProduct && (
            <EnhancedAddProduct 
              onClose={() => setShowAddProduct(false)}
              onProductAdded={handleProductAdded}
            />
          )}

          {/* Sales Analytics */}
          {showAnalytics && (
            <div className="mb-8">
              <SalesAnalytics onClose={() => setShowAnalytics(false)} />
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Current Products */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stock Alerts */}
              <StockAlerts />
              
              {/* Real-Time Product Display */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📦 My Products
                    <Badge variant="secondary">Real-time Updates</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RealTimeProductDisplay 
                    refreshTrigger={refreshTrigger}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions & Recent Sales */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>🚀 Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start h-12"
                    onClick={() => setShowAddProduct(!showAddProduct)}
                  >
                    <Plus className="h-4 w-4 mr-3" />
                    Add New Product
                    <Badge variant="secondary" className="ml-auto">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Auto
                    </Badge>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-12"
                    onClick={() => setShowAnalytics(!showAnalytics)}
                  >
                    <BarChart3 className="h-4 w-4 mr-3" />
                    View Analytics
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-12">
                    <MessageCircle className="h-4 w-4 mr-3" />
                    Messages (5)
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-12"
                    onClick={() => setShowAnalytics(!showAnalytics)}
                  >
                    <TrendingUp className="h-4 w-4 mr-3" />
                    Sales Reports
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-500" />
                    Orders to Fulfill
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isLoadingOrders ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Loading orders...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-4">
                      <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No orders yet</p>
                    </div>
                  ) : (
                    orders.slice(0, 3).map((order) => (
                      <OrderActions 
                        key={order.id}
                        order={order} 
                        userRole="seller" 
                        onOrderUpdate={fetchOrders} 
                      />
                    ))
                  )}
                  {orders.length > 3 && (
                    <Button variant="outline" className="w-full">
                      View All Orders ({orders.length})
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}