import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Header } from "@/components/marketplace/Header";
import { OrderTracking } from "@/components/orders/OrderTracking";
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

const recentOrders = [
  {
    id: "ORD001",
    product: "Fresh Organic Tomatoes",
    seller: "Village Farm Co-op",
    amount: "$2.50",
    status: "delivered",
    date: "2024-01-15",
    image: "https://images.unsplash.com/photo-1592921870789-04563d55041c?auto=format&fit=crop&w=100&h=100"
  },
  {
    id: "ORD002", 
    product: "Handwoven Traditional Baskets",
    seller: "Local Artisans Guild",
    amount: "$15.00",
    status: "shipping",
    date: "2024-01-14",
    image: "https://images.unsplash.com/photo-1556909114-4be3c6d10115?auto=format&fit=crop&w=100&h=100"
  },
  {
    id: "ORD003",
    product: "Pure Wild Honey",
    seller: "Bee Keeper Collective", 
    amount: "$8.00",
    status: "processing",
    date: "2024-01-13",
    image: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=100&h=100"
  }
];

const favoriteProducts = [
  {
    id: 1,
    name: "Traditional Clay Pottery Set",
    seller: "Clay Masters Workshop",
    price: "$25.00",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=100&h=100",
    inStock: true
  },
  {
    id: 2,
    name: "Artisan Wooden Bowls",
    seller: "Wood Craft Studio", 
    price: "$18.00",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=100&h=100",
    inStock: false
  }
];

export default function BuyerDashboard() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-500";
      case "shipping": return "bg-blue-500";
      case "processing": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "delivered": return "✅ Delivered";
      case "shipping": return "🚚 Shipping";
      case "processing": return "⏳ Processing";
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
                  <AvatarImage src="https://images.unsplash.com/photo-1494790108755-2616b612b494?auto=format&fit=crop&w=100&h=100" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    Welcome back, Jane! 👋
                  </h1>
                  <p className="text-muted-foreground">Ready to discover new products today?</p>
                </div>
              </div>
              <Button className="h-12 px-6">
                <Bell className="h-4 w-4 mr-2" />
                Notifications (3)
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold text-foreground">12</div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <div className="text-2xl font-bold text-foreground">2</div>
                <p className="text-sm text-muted-foreground">Pending Orders</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold text-foreground">10</div>
                <p className="text-sm text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Heart className="h-8 w-8 mx-auto mb-2 text-red-500" />
                <div className="text-2xl font-bold text-foreground">8</div>
                <p className="text-sm text-muted-foreground">Favorites</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent Orders */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Recent Orders
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                      <img 
                        src={order.image} 
                        alt={order.product}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">{order.product}</h4>
                        <p className="text-sm text-muted-foreground">{order.seller}</p>
                        <p className="text-xs text-muted-foreground">{order.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{order.amount}</p>
                        <Badge variant="secondary" className="text-xs">
                          {getStatusText(order.status)}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full">
                    View All Orders
                  </Button>
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
                    <a href="/products">
                      <ShoppingCart className="h-4 w-4 mr-3" />
                      Browse Products
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-12">
                    <MessageCircle className="h-4 w-4 mr-3" />
                    Messages (2)
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-12">
                    <CreditCard className="h-4 w-4 mr-3" />
                    Payment Methods
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-12">
                    <MapPin className="h-4 w-4 mr-3" />
                    Delivery Addresses
                  </Button>
                </CardContent>
              </Card>

              {/* Favorite Products */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    Favorites
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {favoriteProducts.map((product) => (
                    <div key={product.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-sm text-foreground truncate">{product.name}</h5>
                        <p className="text-xs text-muted-foreground">{product.seller}</p>
                        <p className="text-sm font-semibold text-primary">{product.price}</p>
                      </div>
                      <Button 
                        size="sm" 
                        disabled={!product.inStock}
                        className="text-xs"
                      >
                        {product.inStock ? "Buy" : "Out"}
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" asChild>
                    <a href="/favorites">View All Favorites</a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Order Tracking Demo */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Track Your Order with QR Codes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Demo: Track an order with QR code handoffs at each delivery stage
                </p>
                <OrderTracking 
                  orderId="12345678-1234-1234-1234-123456789012" 
                  userRole="buyer"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}