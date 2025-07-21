import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { Header } from "@/components/marketplace/Header";
import { Search, Filter, Grid, List, MapPin, SlidersHorizontal } from "lucide-react";

const products = [
  {
    id: 1,
    name: "Fresh Organic Tomatoes - Premium Quality",
    price: "$2.50/kg",
    originalPrice: "$3.00/kg",
    description: "Farm-fresh organic tomatoes grown without pesticides. Perfect for cooking and salads. Harvested daily for maximum freshness.",
    image: "https://images.unsplash.com/photo-1592921870789-04563d55041c?auto=format&fit=crop&w=400&h=300",
    category: "🥕 Vegetables",
    rating: 4.8,
    reviews: 124,
    seller: {
      name: "Village Farm Co-op",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100",
      verified: true,
      location: "Rural Valley, 5km away",
      rating: 4.9
    },
    inStock: true,
    featured: true
  },
  {
    id: 2,
    name: "Handwoven Traditional Baskets",
    price: "$15.00",
    description: "Beautiful handwoven baskets made by local artisans using traditional techniques. Perfect for storage or decoration.",
    image: "https://images.unsplash.com/photo-1556909114-4be3c6d10115?auto=format&fit=crop&w=400&h=300",
    category: "🧺 Crafts",
    rating: 4.9,
    reviews: 87,
    seller: {
      name: "Local Artisans Guild",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b494?auto=format&fit=crop&w=100&h=100",
      verified: true,
      location: "Mountain Village, 12km away",
      rating: 4.8
    },
    inStock: true
  },
  {
    id: 3,
    name: "Pure Wild Honey - Raw & Unfiltered",
    price: "$8.00/jar",
    description: "100% pure wild honey collected from local beehives. Raw and unfiltered to preserve all natural nutrients and enzymes.",
    image: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=400&h=300",
    category: "🍯 Food",
    rating: 4.7,
    reviews: 203,
    seller: {
      name: "Bee Keeper Collective",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&h=100",
      verified: true,
      location: "Countryside, 8km away",
      rating: 4.9
    },
    inStock: true,
    featured: true
  },
  {
    id: 4,
    name: "Traditional Clay Pottery Set",
    price: "$25.00",
    description: "Authentic handmade clay pottery crafted using centuries-old techniques. Each piece is unique and food-safe.",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=400&h=300",
    category: "🏺 Crafts",
    rating: 4.9,
    reviews: 56,
    seller: {
      name: "Clay Masters Workshop",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100",
      verified: false,
      location: "River Town, 15km away",
      rating: 4.7
    },
    inStock: true
  },
  {
    id: 5,
    name: "Fresh Green Leafy Vegetables Bundle",
    price: "$1.80/bundle",
    description: "Mixed bundle of fresh spinach, lettuce, and herbs. Grown organically and picked this morning.",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&h=300",
    category: "🥬 Vegetables",
    rating: 4.6,
    reviews: 89,
    seller: {
      name: "Green Fields Farm",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100",
      verified: true,
      location: "Valley Farm, 3km away",
      rating: 4.8
    },
    inStock: false
  },
  {
    id: 6,
    name: "Artisan Wooden Bowls Set",
    price: "$18.00",
    description: "Set of 3 wooden bowls carved from sustainable local wood. Perfect for serving and food presentation.",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&h=300",
    category: "🪵 Crafts",
    rating: 4.5,
    reviews: 34,
    seller: {
      name: "Wood Craft Studio",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&h=100",
      verified: true,
      location: "Forest Edge, 20km away",
      rating: 4.6
    },
    inStock: true
  }
];

const categories = ["🥕 Vegetables", "🍯 Food", "🧺 Crafts", "🏺 Pottery", "🪵 Wood", "🌾 Grains"];

export default function ProductListing() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-subtle py-8 md:py-12">
          <div className="container mx-auto px-4">
            <div className="text-center mb-6">
              <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-2">
                🛒 Browse Products
              </h1>
              <p className="text-muted-foreground text-lg">
                Discover quality products from rural communities near you
              </p>
            </div>

            {/* Search and Filters */}
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 text-base rounded-xl"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48 h-12 rounded-xl">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl">
                    <SlidersHorizontal className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Quick filters */}
              <div className="flex flex-wrap gap-2">
                <Badge 
                  variant={selectedCategory === "" ? "default" : "outline"} 
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => setSelectedCategory("")}
                >
                  All Products
                </Badge>
                {categories.slice(0, 4).map((category) => (
                  <Badge
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4">
            {/* Results header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <p className="text-muted-foreground">
                  Showing {filteredProducts.length} of {products.length} products
                </p>
                {selectedCategory && (
                  <p className="text-sm text-primary font-medium">
                    Filtered by: {selectedCategory}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">⭐ Featured</SelectItem>
                    <SelectItem value="price-low">💰 Price: Low to High</SelectItem>
                    <SelectItem value="price-high">💰 Price: High to Low</SelectItem>
                    <SelectItem value="rating">⭐ Highest Rated</SelectItem>
                    <SelectItem value="newest">🆕 Newest First</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex border rounded-lg">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-r-none"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <div className={`grid gap-6 ${
                viewMode === "grid" 
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                  : "grid-cols-1 max-w-4xl mx-auto"
              }`}>
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No Products Found
                </h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}

            {/* Load More */}
            {filteredProducts.length > 0 && filteredProducts.length >= 6 && (
              <div className="text-center mt-8">
                <Button variant="outline" size="lg" className="px-8">
                  📦 Load More Products
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}