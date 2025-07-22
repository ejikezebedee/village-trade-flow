import { useState } from "react";
import { Header } from "@/components/marketplace/Header";
import { Footer } from "@/components/Footer";
import { ProductFilters } from "@/components/filters/ProductFilters";
import { SortOptions } from "@/components/filters/SortOptions";
import { SEOHead, generateProductListingStructuredData } from "@/components/seo/SEOHead";
import { useProductFilters } from "@/hooks/useProductFilters";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Heart, ShoppingCart, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function NewProductsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const {
    filters,
    sortBy,
    products,
    loading,
    availableCategories,
    availableBrands,
    priceRange,
    filterStats,
    updateFilters,
    setSortBy,
    resetFilters
  } = useProductFilters({
    productType: 'new_products',
    initialSort: 'newest'
  });

  const handleAddToCart = (product: any) => {
    toast.success(`${product.name} added to cart!`);
  };

  const getTimeSinceAdded = (createdAt: string) => {
    return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  };

  const seoKeywords = [
    "new products",
    "latest arrivals", 
    "fresh inventory",
    "newly added items",
    "recent rural products",
    "new village marketplace",
    "latest handmade goods",
    ...availableCategories.map(cat => `new ${cat}`)
  ];

  const structuredData = products.length > 0 
    ? generateProductListingStructuredData(products, "New Products")
    : undefined;

  return (
    <>
      <SEOHead
        title="New Products - Latest Arrivals from Rural Communities"
        description="Discover the newest products added to our marketplace. Be the first to shop fresh arrivals of handmade crafts, local produce, and traditional goods from rural communities."
        keywords={seoKeywords}
        canonical="/new-products"
        structuredData={structuredData}
      />
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
              <h1 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight">
                New Arrivals
              </h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
              Fresh products just added to our marketplace. Be the first to discover 
              these amazing new offerings from rural communities worldwide.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <aside className="lg:w-80 flex-shrink-0">
              <ProductFilters
                filters={filters}
                availableCategories={availableCategories}
                availableBrands={availableBrands}
                priceRange={priceRange}
                filterStats={filterStats}
                onFiltersChange={updateFilters}
                onResetFilters={resetFilters}
                isLoading={loading}
              />
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Sort and View Options */}
              <SortOptions
                sortBy={sortBy}
                onSortChange={setSortBy}
                totalResults={filterStats.totalResults}
                isLoading={loading}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />

              {/* Products Grid */}
              <div className="mt-6">
                {loading ? (
                  <div className={`grid ${viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                    : 'grid-cols-1'} gap-6`}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-96 bg-muted rounded-xl animate-pulse"></div>
                    ))}
                  </div>
                ) : products.length > 0 ? (
                  <div className={`grid ${viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                    : 'grid-cols-1'} gap-6`}>
                    {products.map((product, index) => (
                      <Card 
                        key={product.id} 
                        className={`apple-card group ${viewMode === 'list' ? 'flex-row' : ''}`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className={`relative ${viewMode === 'list' ? 'w-48' : ''}`}>
                          <img 
                            src={Array.isArray(product.images) && product.images.length > 0 
                              ? product.images[0] 
                              : `https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=400&h=300`}
                            alt={product.name}
                            className={`object-cover group-hover:scale-105 transition-transform duration-500 ${
                              viewMode === 'list' 
                                ? 'w-full h-full rounded-l-2xl' 
                                : 'w-full h-56 rounded-t-2xl'
                            }`}
                          />
                          
                          {/* New Badge */}
                          <div className="absolute top-4 left-4 flex flex-col gap-2">
                            <Badge className="bg-primary text-primary-foreground text-xs font-medium border-0 flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              New
                            </Badge>
                            <Badge className="bg-background/90 text-foreground text-xs font-medium border-0">
                              {product.category}
                            </Badge>
                            <Badge variant="outline" className="bg-background/90 text-xs font-medium">
                              Added {getTimeSinceAdded(product.created_at)}
                            </Badge>
                          </div>

                          {/* Favorite Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-4 right-4 h-9 w-9 p-0 apple-glass rounded-full text-muted-foreground hover:text-red-500"
                          >
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <CardContent className={`p-6 space-y-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                          <div className="space-y-2">
                            <h3 className="font-semibold text-foreground text-lg tracking-tight line-clamp-1">
                              {product.name}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {product.description}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-full">
                              <Star className="h-3 w-3 fill-accent text-accent" />
                              <span className="text-xs font-medium">New</span>
                            </div>
                            <span className="font-semibold text-foreground text-lg tracking-tight">
                              ${product.price}
                            </span>
                          </div>
                          
                          <Button 
                            className="w-full h-11 apple-button font-medium bg-primary hover:bg-primary/90"
                            onClick={() => handleAddToCart(product)}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Add to Cart
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-foreground mb-2">No new products found</h3>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your filters or check back later for new arrivals.
                    </p>
                    <Button onClick={resetFilters} variant="outline">
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
}