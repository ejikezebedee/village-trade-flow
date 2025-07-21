import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/marketplace/Header";
import { OrderActions } from "@/components/orders/OrderActions";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  ArrowLeft,
  Package,
  Star,
  Calendar,
  TrendingUp
} from "lucide-react";
import { Link } from "react-router-dom";

export default function CompletedOrdersPage() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
        .eq('order_status', 'delivered')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching completed orders:', error);
      toast({
        title: "Error",
        description: "Failed to load completed orders. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalSpent = () => {
    return orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  };

  const getAverageOrderValue = () => {
    return orders.length > 0 ? getTotalSpent() / orders.length : 0;
  };

  const getMostRecentOrder = () => {
    return orders.length > 0 ? orders[0] : null;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Please log in to view your orders</h2>
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
          {/* Header with Back Button */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Link to="/profile">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Completed Orders
              </h1>
            </div>
            <p className="text-muted-foreground">
              Review your successfully delivered orders and order history
            </p>
          </div>

          {/* Success Stats */}
          {orders.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold text-foreground">{orders.length}</div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <div className="text-2xl font-bold text-foreground">${getTotalSpent().toFixed(2)}</div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <div className="text-2xl font-bold text-foreground">${getAverageOrderValue().toFixed(2)}</div>
                  <p className="text-sm text-muted-foreground">Avg Order</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <div className="text-2xl font-bold text-foreground">
                    {getMostRecentOrder() ? new Date(getMostRecentOrder().created_at).toLocaleDateString() : '-'}
                  </div>
                  <p className="text-sm text-muted-foreground">Last Order</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Orders List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Completed Orders ({orders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading completed orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No completed orders yet</h3>
                  <p className="text-muted-foreground mb-4">Your delivered orders will appear here</p>
                  <Button asChild>
                    <Link to="/">Start Shopping</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-6 bg-green-50/50">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-medium text-lg">{order.product_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Order #{order.id.slice(0, 8)} • Delivered {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-green-500 text-white">
                            ✅ Delivered
                          </Badge>
                          <p className="text-lg font-bold mt-1">${order.total_amount?.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      {/* Success indicator */}
                      <div className="mb-4 p-3 bg-green-100 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-800 font-medium">
                            Successfully delivered • Payment released
                          </span>
                        </div>
                      </div>
                      
                      <OrderActions 
                        order={order} 
                        userRole="buyer" 
                        onOrderUpdate={fetchOrders} 
                      />
                      
                      {/* Quick actions for completed orders */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button variant="outline" size="sm">
                          <Star className="h-4 w-4 mr-2" />
                          Rate Product
                        </Button>
                        <Button variant="outline" size="sm">
                          <Package className="h-4 w-4 mr-2" />
                          Buy Again
                        </Button>
                        <Button variant="outline" size="sm">
                          View Receipt
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}