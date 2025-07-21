import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/marketplace/Header";
import { OrderActions } from "@/components/orders/OrderActions";
import { AutomatedOrderTracking } from "@/components/orders/AutomatedOrderTracking";
import { OrderTracking } from "@/components/orders/OrderTracking";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  ArrowLeft,
  Package,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";

export default function PendingOrdersPage() {
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
        .in('order_status', ['pending', 'shipped', 'confirmed'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      toast({
        title: "Error",
        description: "Failed to load pending orders. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "shipped": return "bg-blue-500";
      case "pending": return "bg-yellow-500";
      case "confirmed": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "shipped": return "🚚 Shipped";
      case "pending": return "⏳ Pending";
      case "confirmed": return "✓ Confirmed";
      default: return status;
    }
  };

  const getStatusPriority = (status: string) => {
    switch (status) {
      case "pending": return "high";
      case "confirmed": return "medium"; 
      case "shipped": return "normal";
      default: return "normal";
    }
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
                Pending Orders
              </h1>
            </div>
            <p className="text-muted-foreground">
              Track your orders that are currently being processed or shipped
            </p>
          </div>

          {/* Alert for pending orders */}
          {orders.length > 0 && (
            <Card className="mb-6 border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Active Orders</h4>
                    <p className="text-sm text-yellow-700">
                      You have {orders.length} order{orders.length > 1 ? 's' : ''} in progress. 
                      Keep track of your deliveries below.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Orders List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                Pending Orders ({orders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading pending orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No pending orders</h3>
                  <p className="text-muted-foreground mb-4">All your orders are either completed or you haven't placed any yet</p>
                  <Button asChild>
                    <Link to="/">Start Shopping</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-medium text-lg">{order.product_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Order #{order.id.slice(0, 8)} • {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(order.order_status)}>
                            {getStatusText(order.order_status)}
                          </Badge>
                          <p className="text-lg font-bold mt-1">${order.total_amount?.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      {/* Urgency indicator */}
                      {getStatusPriority(order.order_status) === 'high' && (
                        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm text-yellow-800 font-medium">
                              Awaiting seller confirmation
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <OrderActions 
                        order={order} 
                        userRole="buyer" 
                        onOrderUpdate={fetchOrders} 
                      />
                      
                      <div className="mt-4 space-y-4">
                        <AutomatedOrderTracking orderId={order.id} />
                        <OrderTracking orderId={order.id} userRole="buyer" />
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