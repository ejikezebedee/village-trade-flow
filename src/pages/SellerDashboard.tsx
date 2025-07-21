import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/marketplace/Header";
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
  Camera,
  Save
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
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<number | null>(null);

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

  const AddProductForm = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>📦 Add New Product</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="productName">Product Name</Label>
            <Input id="productName" placeholder="Enter product name..." />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                <SelectItem value="vegetables">🥕 Vegetables</SelectItem>
                <SelectItem value="fruits">🍎 Fruits</SelectItem>
                <SelectItem value="crafts">🧺 Crafts</SelectItem>
                <SelectItem value="food">🍯 Food</SelectItem>
                <SelectItem value="grains">🌾 Grains</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="price">Price</Label>
            <Input id="price" placeholder="$0.00" />
          </div>
          <div>
            <Label htmlFor="stock">Stock Quantity</Label>
            <Input id="stock" type="number" placeholder="0" />
          </div>
          <div>
            <Label htmlFor="unit">Unit</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                <SelectItem value="kg">per kg</SelectItem>
                <SelectItem value="piece">per piece</SelectItem>
                <SelectItem value="jar">per jar</SelectItem>
                <SelectItem value="bundle">per bundle</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description" 
            placeholder="Describe your product..."
            className="min-h-[100px]"
          />
        </div>

        <div>
          <Label>Product Images</Label>
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <Camera className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">Click to upload images</p>
            <Button variant="outline">
              Choose Files
            </Button>
          </div>
        </div>

        <div className="flex gap-3">
          <Button className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Save Product
          </Button>
          <Button variant="outline" onClick={() => setShowAddProduct(false)}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );

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
              <Button 
                onClick={() => setShowAddProduct(!showAddProduct)}
                className="h-12 px-6"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
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
          {showAddProduct && <AddProductForm />}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Current Products */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    My Products
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentProducts.map((product) => (
                    <div key={product.id} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">Stock: {product.stock} | Sold: {product.sold}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {getStatusText(product.status)}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs">{product.rating}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{product.price}</p>
                        <p className="text-xs text-muted-foreground">{product.views} views</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full">
                    View All Products
                  </Button>
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
                  <Button className="w-full justify-start h-12">
                    <Plus className="h-4 w-4 mr-3" />
                    Add New Product
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-12">
                    <BarChart3 className="h-4 w-4 mr-3" />
                    View Analytics
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-12">
                    <MessageCircle className="h-4 w-4 mr-3" />
                    Messages (5)
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-12">
                    <TrendingUp className="h-4 w-4 mr-3" />
                    Sales Reports
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Sales */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    Recent Sales
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentSales.map((sale) => (
                    <div key={sale.id} className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <h5 className="font-medium text-sm text-foreground truncate">{sale.product}</h5>
                        <span className="font-semibold text-primary text-sm">{sale.amount}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Buyer: {sale.buyer}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-muted-foreground">{sale.date}</span>
                        <Badge variant="secondary" className="text-xs">
                          {sale.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full">
                    View All Sales
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}