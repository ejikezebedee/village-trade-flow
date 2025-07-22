import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BrandCard } from "@/components/brands/BrandCard";
import { FeaturedBrands } from "@/components/brands/FeaturedBrands";
import { 
  Search, 
  Filter, 
  Star, 
  TrendingUp, 
  Crown,
  Package,
  Users,
  Award,
  ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  description?: string;
  category?: string;
  is_featured: boolean;
  total_products: number;
  total_sales: number;
  average_rating: number;
  total_ratings: number;
  country?: string;
  founded_year?: number;
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [featuredBrands, setFeaturedBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("rating");
  const [categories, setCategories] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchBrands();
    fetchCategories();
  }, [sortBy, categoryFilter]);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('brands')
        .select('*')
        .eq('is_active', true);

      // Apply category filter
      if (categoryFilter !== "all") {
        query = query.eq('category', categoryFilter);
      }

      // Apply sorting
      switch (sortBy) {
        case "rating":
          query = query.order('average_rating', { ascending: false });
          break;
        case "sales":
          query = query.order('total_sales', { ascending: false });
          break;
        case "products":
          query = query.order('total_products', { ascending: false });
          break;
        case "name":
          query = query.order('name', { ascending: true });
          break;
        default:
          query = query.order('average_rating', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter by search term
      let filteredData = data || [];
      if (searchTerm) {
        filteredData = filteredData.filter(brand =>
          brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          brand.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          brand.category?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Separate featured and regular brands
      const featured = filteredData.filter(brand => brand.is_featured);
      const regular = filteredData.filter(brand => !brand.is_featured);

      setFeaturedBrands(featured);
      setBrands(regular);
    } catch (error: any) {
      console.error('Error fetching brands:', error);
      toast({
        title: "Error",
        description: "Failed to load brands",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('category')
        .eq('is_active', true)
        .not('category', 'is', null);

      if (error) throw error;

      const uniqueCategories = [...new Set(data.map(item => item.category))].filter(Boolean);
      setCategories(uniqueCategories as string[]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const getBrandStats = () => {
    const allBrands = [...featuredBrands, ...brands];
    return {
      total: allBrands.length,
      totalProducts: allBrands.reduce((sum, brand) => sum + brand.total_products, 0),
      averageRating: allBrands.length > 0 
        ? (allBrands.reduce((sum, brand) => sum + brand.average_rating, 0) / allBrands.length).toFixed(1)
        : "0.0",
      topCategory: categories.length > 0 ? categories[0] : "N/A"
    };
  };

  const stats = getBrandStats();

  return (
    <>
      <Helmet>
        <title>Top Brands - Premium Quality Products | VillageMarket</title>
        <meta 
          name="description" 
          content="Discover the top brands on VillageMarket. Shop from premium, highly-rated brands offering quality products across various categories. Find your favorite brands and explore new ones."
        />
        <meta 
          name="keywords" 
          content="top brands, premium brands, quality products, brand directory, trusted brands, popular brands, brand marketplace"
        />
        <meta property="og:title" content="Top Brands - Premium Quality Products | VillageMarket" />
        <meta property="og:description" content="Discover the top brands on VillageMarket. Shop from premium, highly-rated brands offering quality products." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="/brands" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 lg:px-8 py-8 space-y-8">
          
          {/* Back to Home Button */}
          <div>
            <Button asChild variant="outline" className="mb-4">
              <Link to="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>

          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Crown className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-semibold text-foreground tracking-tight">
                Top Brands
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover premium brands trusted by thousands of customers. 
              Shop from verified sellers offering the highest quality products.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="apple-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Brands</p>
                    <p className="text-2xl font-semibold">{stats.total}</p>
                  </div>
                  <Award className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="apple-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Products</p>
                    <p className="text-2xl font-semibold text-secondary">{stats.totalProducts}</p>
                  </div>
                  <Package className="h-8 w-8 text-secondary" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="apple-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Rating</p>
                    <p className="text-2xl font-semibold text-accent">{stats.averageRating}</p>
                  </div>
                  <Star className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="apple-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Categories</p>
                    <p className="text-2xl font-semibold">{categories.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Featured Brands */}
          {featuredBrands.length > 0 && (
            <FeaturedBrands brands={featuredBrands} />
          )}

          {/* Search and Filters */}
          <Card className="apple-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Find Your Perfect Brand
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search brands..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="sales">Best Selling</SelectItem>
                    <SelectItem value="products">Most Products</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* All Brands Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground">
                All Brands
              </h2>
              <Badge variant="outline" className="text-sm">
                {brands.length} brands found
              </Badge>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="apple-card animate-pulse">
                    <CardContent className="p-6 space-y-4">
                      <div className="h-16 bg-muted rounded"></div>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : brands.length === 0 ? (
              <Card className="apple-card">
                <CardContent className="p-12 text-center">
                  <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No brands found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search criteria or filters.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm("");
                      setCategoryFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {brands.map((brand) => (
                  <BrandCard key={brand.id} brand={brand} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}