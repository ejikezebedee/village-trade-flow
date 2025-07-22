import { useState, useEffect } from "react";
import { Header } from "@/components/marketplace/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FlashSaleCard } from "@/components/flash-sales/FlashSaleCard";
import { 
  Zap, 
  Clock, 
  Flame, 
  TrendingUp,
  Search,
  Filter,
  Timer,
  Target,
  Sparkles,
  RefreshCw
} from "lucide-react";

interface FlashSale {
  id: string;
  title: string;
  description?: string;
  product_id: string;
  product_name: string;
  product_image: string;
  original_price: number;
  sale_price: number;
  discount_percentage: number;
  start_time: string;
  end_time: string;
  quantity_available: number;
  quantity_sold: number;
  featured: boolean;
}

export default function FlashSalesPage() {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("ending_soon");
  const [filterBy, setFilterBy] = useState("all");
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const { toast } = useToast();

  useEffect(() => {
    fetchFlashSales();
    
    // Set up real-time subscription
    const flashSalesChannel = supabase
      .channel('flash-sales-page-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'flash_sales'
      }, (payload) => {
        console.log('Flash sales update:', payload);
        fetchFlashSales();
        setLastUpdate(new Date());
      })
      .subscribe();

    // Auto-refresh every minute
    const refreshTimer = setInterval(() => {
      fetchFlashSales();
      setLastUpdate(new Date());
    }, 60000);

    return () => {
      supabase.removeChannel(flashSalesChannel);
      clearInterval(refreshTimer);
    };
  }, [sortBy, filterBy]);

  const fetchFlashSales = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('get_active_flash_sales');

      if (error) throw error;

      let filteredData = (data || []).filter((sale: any) => new Date(sale.end_time) > new Date());

      // Apply filters
      if (filterBy === "featured") {
        filteredData = filteredData.filter((sale: any) => sale.featured);
      } else if (filterBy === "high_discount") {
        filteredData = filteredData.filter((sale: any) => sale.discount_percentage >= 50);
      } else if (filterBy === "low_stock") {
        filteredData = filteredData.filter((sale: any) => {
          const remaining = sale.quantity_available - sale.quantity_sold;
          return remaining <= 5 && remaining > 0;
        });
      }

      // Apply search
      if (searchTerm) {
        filteredData = filteredData.filter((sale: any) =>
          sale.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Apply sorting
      switch (sortBy) {
        case "ending_soon":
          filteredData.sort((a: any, b: any) => new Date(a.end_time).getTime() - new Date(b.end_time).getTime());
          break;
        case "highest_discount":
          filteredData.sort((a: any, b: any) => b.discount_percentage - a.discount_percentage);
          break;
        case "lowest_price":
          filteredData.sort((a: any, b: any) => a.sale_price - b.sale_price);
          break;
        case "most_popular":
          filteredData.sort((a: any, b: any) => b.quantity_sold - a.quantity_sold);
          break;
        default:
          // Featured first, then by end time
          filteredData.sort((a: any, b: any) => {
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            return new Date(a.end_time).getTime() - new Date(b.end_time).getTime();
          });
      }

      setFlashSales(filteredData);
    } catch (error: any) {
      console.error('Error fetching flash sales:', error);
      toast({
        title: "Error",
        description: "Failed to load flash sales",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShopNow = (sale: FlashSale) => {
    window.location.href = `/products/${sale.product_id}?flash_sale=${sale.id}`;
  };

  const getFlashSaleStats = () => {
    const total = flashSales.length;
    const featured = flashSales.filter(sale => sale.featured).length;
    const highDiscount = flashSales.filter(sale => sale.discount_percentage >= 50).length;
    const endingSoon = flashSales.filter(sale => {
      const endTime = new Date(sale.end_time);
      const now = new Date();
      return endTime.getTime() - now.getTime() < 2 * 60 * 60 * 1000; // Less than 2 hours
    }).length;
    
    return { total, featured, highDiscount, endingSoon };
  };

  const stats = getFlashSaleStats();

  const seoKeywords = [
    "flash sales",
    "limited time offers", 
    "discount products",
    "sale items",
    "special deals",
    "village market sales",
    "discounted handmade goods",
    "lightning deals",
    "time-sensitive promotions"
  ];

  return (
    <>
      <SEOHead
        title="Flash Sales - Limited Time Offers on Rural Products"
        description="Don't miss out on our flash sales! Lightning deals with incredible discounts for a limited time only. Shop now before these amazing offers expire!"
        keywords={seoKeywords}
        canonical="/flash-sales"
      />

      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-6 lg:px-8 py-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative">
                <Zap className="h-10 w-10 text-primary animate-pulse" />
                <Sparkles className="h-5 w-5 text-amber-500 absolute -top-1 -right-1 animate-bounce" />
              </div>
              <h1 className="text-4xl font-semibold text-foreground tracking-tight">
                Flash Sales
              </h1>
              <Flame className="h-10 w-10 text-red-500 animate-pulse" />
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Lightning deals with incredible discounts! Limited quantities and time - 
              grab these amazing offers before they expire!
            </p>
            <div className="flex items-center justify-center gap-2">
              <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0">
                ⚡ Live Updates
              </Badge>
              <Badge variant="outline">
                🔥 Hot Deals
              </Badge>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="apple-card bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Deals</p>
                    <p className="text-2xl font-semibold">{stats.total}</p>
                  </div>
                  <Zap className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="apple-card bg-gradient-to-br from-red-500/5 to-orange-500/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Featured Deals</p>
                    <p className="text-2xl font-semibold text-red-500">{stats.featured}</p>
                  </div>
                  <Flame className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="apple-card bg-gradient-to-br from-amber-500/5 to-yellow-500/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">High Discounts</p>
                    <p className="text-2xl font-semibold text-amber-600">{stats.highDiscount}</p>
                  </div>
                  <Target className="h-8 w-8 text-amber-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="apple-card bg-gradient-to-br from-secondary/5 to-secondary/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ending Soon</p>
                    <p className="text-2xl font-semibold text-secondary">{stats.endingSoon}</p>
                  </div>
                  <Clock className="h-8 w-8 text-secondary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="apple-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Find Your Perfect Deal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search flash sales..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter deals" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Deals</SelectItem>
                    <SelectItem value="featured">Featured Only</SelectItem>
                    <SelectItem value="high_discount">50%+ Off</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ending_soon">Ending Soon</SelectItem>
                    <SelectItem value="highest_discount">Highest Discount</SelectItem>
                    <SelectItem value="lowest_price">Lowest Price</SelectItem>
                    <SelectItem value="most_popular">Most Popular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fetchFlashSales}
                  className="apple-button"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Flash Sales Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground">
                Current Flash Deals
              </h2>
              <Badge variant="outline" className="text-sm">
                {flashSales.length} deals found
              </Badge>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="apple-card animate-pulse">
                    <div className="h-48 bg-muted rounded-t-2xl"></div>
                    <CardContent className="p-6 space-y-4">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                      <div className="h-8 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : flashSales.length === 0 ? (
              <Card className="apple-card">
                <CardContent className="p-12 text-center">
                  <Timer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No flash sales found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || filterBy !== "all" 
                      ? "Try adjusting your search or filters." 
                      : "No active flash sales at the moment. Check back soon!"}
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm("");
                      setFilterBy("all");
                      fetchFlashSales();
                    }}
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {flashSales.map((sale) => (
                  <FlashSaleCard 
                    key={sale.id} 
                    sale={sale} 
                    onShopNow={handleShopNow}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        
        <Footer />
      </div>
    </>
  );
}