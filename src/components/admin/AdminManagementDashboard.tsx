import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Gavel, 
  Star, 
  Zap, 
  TrendingUp, 
  Crown,
  Settings,
  Save,
  RefreshCw
} from "lucide-react";

export function AdminManagementDashboard() {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [flashSales, setFlashSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch auctions
      const { data: auctionsData } = await supabase
        .from('auctions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch brands
      const { data: brandsData } = await supabase
        .from('brands')
        .select('*')
        .order('total_sales', { ascending: false });

      // Fetch flash sales
      const { data: flashSalesData } = await supabase
        .from('flash_sales')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch products for management
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      setAuctions(auctionsData || []);
      setBrands(brandsData || []);
      setFlashSales(flashSalesData || []);
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBrandRanking = async (brandId: string, featured: boolean) => {
    try {
      const { error } = await supabase
        .from('brands')
        .update({ is_featured: featured })
        .eq('id', brandId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Brand ${featured ? 'featured' : 'unfeatured'} successfully`
      });
      
      fetchAllData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update brand ranking",
        variant: "destructive"
      });
    }
  };

  const addToFlashSale = async (productId: string, discount: number) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const salePrice = product.price * (1 - discount / 100);
      
      const { error } = await supabase
        .from('flash_sales')
        .insert({
          title: `Flash Sale: ${product.name}`,
          product_id: productId,
          original_price: product.price,
          sale_price: salePrice,
          discount_percentage: discount,
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
          quantity_available: Math.min(product.stock_quantity, 20),
          quantity_sold: 0,
          featured: false
        });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Product added to flash sale"
      });
      
      fetchAllData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add to flash sale",
        variant: "destructive"
      });
    }
  };

  const toggleProductSection = async (productId: string, section: 'featured' | 'best_seller' | 'new_product') => {
    try {
      const updates: any = {};
      
      if (section === 'featured') {
        const product = products.find(p => p.id === productId);
        updates.featured = !product?.featured;
      }
      
      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', productId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Product ${section} status updated`
      });
      
      fetchAllData();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update ${section} status`,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-foreground">
          Admin Management Dashboard
        </h1>
        <Button onClick={fetchAllData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="auctions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="auctions" className="flex items-center gap-2">
            <Gavel className="h-4 w-4" />
            Auctions
          </TabsTrigger>
          <TabsTrigger value="brands" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Brands
          </TabsTrigger>
          <TabsTrigger value="promotions" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Promotions
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Products
          </TabsTrigger>
        </TabsList>

        {/* Auction Management */}
        <TabsContent value="auctions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                Auction Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auctions.map((auction) => (
                  <div key={auction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{auction.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Status: <Badge>{auction.status}</Badge>
                        Current Bid: ${auction.current_bid}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Monitor</Button>
                      <Button size="sm" variant="outline">Modify</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Brand Management */}
        <TabsContent value="brands" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Brand Rankings & Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {brands.map((brand) => (
                  <div key={brand.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <img 
                        src={brand.logo_url || '/placeholder.svg'} 
                        alt={brand.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <h4 className="font-medium">{brand.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Sales: ${brand.total_sales || 0} • Rating: {brand.average_rating || 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`featured-${brand.id}`}>Featured</Label>
                        <Switch
                          id={`featured-${brand.id}`}
                          checked={brand.is_featured || false}
                          onCheckedChange={(checked) => updateBrandRanking(brand.id, checked)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Promotions Management */}
        <TabsContent value="promotions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Sales & Promotions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quick Add to Flash Sale */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-4">Quick Add to Flash Sale</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.slice(0, 10).map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input placeholder="Discount %" type="number" />
                  <Button onClick={() => addToFlashSale(products[0]?.id, 25)}>
                    Add to Flash Sale
                  </Button>
                </div>
              </div>

              {/* Active Flash Sales */}
              <div>
                <h4 className="font-medium mb-4">Active Flash Sales</h4>
                <div className="space-y-2">
                  {flashSales.slice(0, 5).map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <span className="font-medium">{sale.title}</span>
                        <Badge className="ml-2">{sale.discount_percentage}% OFF</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button size="sm" variant="destructive">End</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Management */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Product Section Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {products.slice(0, 10).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        ${product.price} • Stock: {product.stock_quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label>Featured</Label>
                        <Switch
                          checked={product.featured || false}
                          onCheckedChange={() => toggleProductSection(product.id, 'featured')}
                        />
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => addToFlashSale(product.id, 30)}
                      >
                        Add to Flash Sale
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}