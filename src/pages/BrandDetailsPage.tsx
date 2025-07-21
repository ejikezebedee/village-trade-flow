import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { BrandProductCard } from "@/components/brands/BrandProductCard";
import { 
  Star, 
  Package, 
  Users, 
  MapPin, 
  Calendar,
  ExternalLink,
  Heart,
  Crown,
  TrendingUp,
  ArrowLeft,
  Filter,
  Grid,
  List
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  description?: string;
  website_url?: string;
  founded_year?: number;
  country?: string;
  category?: string;
  is_featured: boolean;
  total_products: number;
  total_sales: number;
  average_rating: number;
  total_ratings: number;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
}

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  images?: any;
  category?: string;
  stock_quantity: number;
  featured: boolean;
  seller_id: string;
  created_at: string;
}

export default function BrandDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (slug) {
      fetchBrand();
    }
  }, [slug]);

  useEffect(() => {
    if (brand) {
      fetchProducts();
      if (user) {
        checkFollowStatus();
      }
      fetchFollowerCount();
    }
  }, [brand, user, sortBy]);

  const fetchBrand = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setBrand(data);
    } catch (error: any) {
      console.error('Error fetching brand:', error);
      toast({
        title: "Error",
        description: "Brand not found",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    if (!brand) return;

    try {
      setProductsLoading(true);
      
      // Get products associated with this brand
      const { data: brandProducts, error: brandError } = await supabase
        .from('brand_products')
        .select('product_id')
        .eq('brand_id', brand.id);

      if (brandError) throw brandError;

      if (!brandProducts || brandProducts.length === 0) {
        setProducts([]);
        return;
      }

      const productIds = brandProducts.map(bp => bp.product_id);

      let query = supabase
        .from('products')
        .select('*')
        .in('id', productIds)
        .eq('is_active', true);

      // Apply sorting
      switch (sortBy) {
        case "price_low":
          query = query.order('price', { ascending: true });
          break;
        case "price_high":
          query = query.order('price', { ascending: false });
          break;
        case "name":
          query = query.order('name', { ascending: true });
          break;
        case "newest":
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter by search term
      let filteredData = data || [];
      if (searchTerm) {
        filteredData = filteredData.filter(product =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setProducts(filteredData);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive"
      });
    } finally {
      setProductsLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    if (!user || !brand) return;

    const { data } = await supabase
      .from('brand_followers')
      .select('id')
      .eq('brand_id', brand.id)
      .eq('user_id', user.id)
      .single();

    setIsFollowing(!!data);
  };

  const fetchFollowerCount = async () => {
    if (!brand) return;

    const { count } = await supabase
      .from('brand_followers')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brand.id);

    setFollowerCount(count || 0);
  };

  const toggleFollow = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to follow brands",
        variant: "destructive"
      });
      return;
    }

    if (!brand) return;

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('brand_followers')
          .delete()
          .eq('brand_id', brand.id)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsFollowing(false);
        setFollowerCount(prev => prev - 1);
        toast({
          title: "Unfollowed brand",
          description: `You are no longer following ${brand.name}`
        });
      } else {
        const { error } = await supabase
          .from('brand_followers')
          .insert({
            brand_id: brand.id,
            user_id: user.id
          });

        if (error) throw error;
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
        toast({
          title: "Following brand",
          description: `You are now following ${brand.name}`
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="apple-card max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Brand Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The brand you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/brands">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Brands
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{brand.seo_title || `${brand.name} - Premium Brand | VillageMarket`}</title>
        <meta 
          name="description" 
          content={brand.seo_description || `Shop ${brand.name} products on VillageMarket. ${brand.description || `Discover high-quality products from ${brand.name}.`}`}
        />
        {brand.seo_keywords && (
          <meta 
            name="keywords" 
            content={brand.seo_keywords.join(', ')}
          />
        )}
        <meta property="og:title" content={`${brand.name} - Premium Brand | VillageMarket`} />
        <meta property="og:description" content={brand.description || `Shop ${brand.name} products on VillageMarket.`} />
        {brand.logo_url && <meta property="og:image" content={brand.logo_url} />}
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`/brands/${brand.slug}`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 lg:px-8 py-8 space-y-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/brands" className="hover:text-primary transition-colors">
              Brands
            </Link>
            <span>/</span>
            <span className="text-foreground">{brand.name}</span>
          </div>

          {/* Brand Header */}
          <Card className="apple-card">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Brand Logo and Basic Info */}
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={brand.logo_url} alt={brand.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
                      {brand.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl font-semibold">{brand.name}</h1>
                    {brand.is_featured && (
                      <Crown className="h-6 w-6 text-amber-500" />
                    )}
                  </div>
                  
                  {brand.category && (
                    <Badge className="mb-4">{brand.category}</Badge>
                  )}

                  <div className="flex flex-col lg:flex-row gap-4 mb-6">
                    {user && (
                      <Button
                        onClick={toggleFollow}
                        variant={isFollowing ? "default" : "outline"}
                        className="apple-button"
                      >
                        <Heart className={`h-4 w-4 mr-2 ${isFollowing ? "fill-current" : ""}`} />
                        {isFollowing ? "Following" : "Follow Brand"}
                      </Button>
                    )}
                    
                    {brand.website_url && (
                      <Button
                        variant="outline"
                        onClick={() => window.open(brand.website_url, '_blank')}
                        className="apple-button"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visit Website
                      </Button>
                    )}
                  </div>
                </div>

                {/* Brand Details */}
                <div className="flex-1 space-y-6">
                  {brand.description && (
                    <div>
                      <h3 className="font-semibold mb-2">About {brand.name}</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {brand.description}
                      </p>
                    </div>
                  )}

                  {/* Brand Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Star className="h-4 w-4 text-amber-500 fill-current" />
                        <span className="text-2xl font-semibold">{brand.average_rating.toFixed(1)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{brand.total_ratings} reviews</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Package className="h-4 w-4 text-primary" />
                        <span className="text-2xl font-semibold">{brand.total_products}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">products</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Users className="h-4 w-4 text-secondary" />
                        <span className="text-2xl font-semibold">{followerCount}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">followers</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp className="h-4 w-4 text-accent" />
                        <span className="text-2xl font-semibold">${brand.total_sales.toFixed(0)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">total sales</p>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {brand.country && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{brand.country}</span>
                      </div>
                    )}
                    {brand.founded_year && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Founded {brand.founded_year}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Section */}
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <h2 className="text-2xl font-semibold">
                {brand.name} Products ({products.length})
              </h2>
              
              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full lg:w-64"
                />
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={viewMode === "grid" ? "default" : "outline"}
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === "list" ? "default" : "outline"}
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {productsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
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
            ) : products.length === 0 ? (
              <Card className="apple-card">
                <CardContent className="p-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No products found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm 
                      ? "Try adjusting your search terms." 
                      : "This brand hasn't added any products yet."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className={viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
              }>
                {products.map((product) => (
                  <BrandProductCard 
                    key={product.id} 
                    product={product}
                    layout={viewMode}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}