import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Header } from "@/components/marketplace/Header";
// import { useAuthContext } from "@/contexts/AuthContext";
import { OrderTracking } from "@/components/orders/OrderTracking";
import { AutomatedOrderTracking } from "@/components/orders/AutomatedOrderTracking";
import { OrderActions } from "@/components/orders/OrderActions";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  MessageCircle, 
  Star,
  Package,
  CreditCard,
  Heart,
  MapPin,
  Bell
} from "lucide-react";

export default function BuyerDashboard() {
  const [user, setUser] = useState(null);
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const pending = data?.filter(o => ['pending', 'shipped'].includes(o.order_status)).length || 0;
      const completed = data?.filter(o => o.order_status === 'delivered').length || 0;
      
      setStats({ total, pending, completed });
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-500";
      case "shipped": return "bg-blue-500";
      case "pending": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "delivered": return "✅ Delivered";
      case "shipped": return "🚚 Shipped";
      case "pending": return "⏳ Pending";
      default: return status;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Please log in to view your dashboard</h2>
              <Button onClick={() => window.location.href = '/auth'}>
                Go to Login
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24">
        <div className="container mx-auto px-4 py-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src="https://images.unsplash.com/photo-1494790108755-2616b612b494?auto=format&fit=crop&w=100&h=100" />
                  <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    Welcome back! 👋
                  </h1>
                  <p className="text-muted-foreground">Ready to discover new products today?</p>
                </div>
              </div>
              <Button className="h-12 px-6" asChild>
                <a href="/notifications">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </a>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <a href="/orders/all" className="block transition-transform hover:scale-105">
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/20">
                <CardContent className="p-4 text-center">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                </CardContent>
              </Card>
            </a>
            <a href="/orders/pending" className="block transition-transform hover:scale-105">
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-yellow-500/20">
                <CardContent className="p-4 text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <div className="text-2xl font-bold text-foreground">{stats.pending}</div>
                  <p className="text-sm text-muted-foreground">Pending Orders</p>
                </CardContent>
              </Card>
            </a>
            <a href="/orders/completed" className="block transition-transform hover:scale-105">
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-green-500/20">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold text-foreground">{stats.completed}</div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </CardContent>
              </Card>
            </a>
            <a href="/favorites" className="block transition-transform hover:scale-105">
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-red-500/20">
                <CardContent className="p-4 text-center">
                  <Heart className="h-8 w-8 mx-auto mb-2 text-red-500" />
                  <div className="text-2xl font-bold text-foreground">-</div>
                  <p className="text-sm text-muted-foreground">Favorites</p>
                </CardContent>
              </Card>
            </a>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Orders */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    My Orders
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading orders...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                      <p className="text-muted-foreground mb-4">Start shopping to see your orders here</p>
                      <Button asChild>
                        <a href="/">Browse Products</a>
                      </Button>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div key={order.id} className="space-y-4">
                        <OrderActions 
                          order={order} 
                          userRole="buyer" 
                          onOrderUpdate={fetchOrders} 
                        />
                        <div className="bg-white p-6 rounded-lg shadow-sm border">
                          <div className="space-y-4">
                            <AutomatedOrderTracking orderId={order.id} />
                            <OrderTracking orderId={order.id} userRole="buyer" />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions & Favorites */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>🚀 Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start h-12" asChild>
                    <a href="/">
                      <ShoppingCart className="h-4 w-4 mr-3" />
                      Browse Products
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-12" asChild>
                    <a href="/messages">
                      <MessageCircle className="h-4 w-4 mr-3" />
                      Messages
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-12" asChild>
                    <a href="/payment-methods">
                      <CreditCard className="h-4 w-4 mr-3" />
                      Payment Methods
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-12" asChild>
                    <a href="/delivery-addresses">
                      <MapPin className="h-4 w-4 mr-3" />
                      Delivery Addresses
                    </a>
                  </Button>
                </CardContent>
              </Card>

              {/* Order Status Legend */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Status Guide</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-yellow-100 text-yellow-800">⏳ Pending</Badge>
                    <span className="text-sm text-muted-foreground">Payment secured, seller preparing</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-blue-100 text-blue-800">🚚 Shipped</Badge>
                    <span className="text-sm text-muted-foreground">On its way to you</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-green-100 text-green-800">✅ Delivered</Badge>
                    <span className="text-sm text-muted-foreground">Completed & payment released</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}