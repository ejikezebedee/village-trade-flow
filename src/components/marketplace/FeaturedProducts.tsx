import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Heart, ShoppingCart } from "lucide-react";

const products = [
  {
    id: 1,
    name: "Fresh Organic Tomatoes",
    seller: "Village Farm Co-op",
    price: "$2.50/kg",
    rating: 4.8,
    reviews: 124,
    image: "photo-1592921870789-04563d55041c",
    category: "Vegetables",
    location: "Rural Valley"
  },
  {
    id: 2,
    name: "Handwoven Baskets",
    seller: "Local Artisans",
    price: "$15.00",
    rating: 4.9,
    reviews: 87,
    image: "photo-1556909114-4be3c6d10115",
    category: "Crafts",
    location: "Mountain Village"
  },
  {
    id: 3,
    name: "Pure Honey",
    seller: "Bee Keeper Collective",
    price: "$8.00/jar",
    rating: 4.7,
    reviews: 203,
    image: "photo-1558642452-9d2a7deb7f62",
    category: "Food",
    location: "Countryside"
  },
  {
    id: 4,
    name: "Traditional Pottery",
    seller: "Clay Masters",
    price: "$25.00",
    rating: 4.9,
    reviews: 56,
    image: "photo-1578662996442-48f60103fc96",
    category: "Crafts",
    location: "River Town"
  }
];

export function FeaturedProducts() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4 tracking-tight">
            Featured Products
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            Discover quality products from rural communities. Each purchase supports local economies and sustainable practices.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product, index) => (
            <Card 
              key={product.id} 
              className="apple-card group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative">
                <img 
                  src={`https://images.unsplash.com/${product.image}?auto=format&fit=crop&w=400&h=300`}
                  alt={product.name}
                  className="w-full h-56 object-cover rounded-t-2xl group-hover:scale-105 transition-transform duration-500"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-4 right-4 h-9 w-9 p-0 apple-glass rounded-full text-muted-foreground hover:text-red-500"
                >
                  <Heart className="h-4 w-4" />
                </Button>
                <Badge className="absolute top-4 left-4 bg-background/90 text-foreground border-0 text-xs font-medium">
                  {product.category}
                </Badge>
              </div>
              
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground text-lg tracking-tight">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">{product.seller}</p>
                  <p className="text-xs text-muted-foreground">{product.location}</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-full">
                    <Star className="h-3 w-3 fill-accent text-accent" />
                    <span className="text-xs font-medium">{product.rating}</span>
                    <span className="text-xs text-muted-foreground">({product.reviews})</span>
                  </div>
                  <span className="font-semibold text-foreground text-lg tracking-tight">{product.price}</span>
                </div>
                
                <Button className="w-full h-11 apple-button font-medium bg-primary hover:bg-primary/90">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Button variant="outline" size="lg" className="apple-button font-medium px-8" asChild>
            <a href="/products">View All Products</a>
          </Button>
        </div>
      </div>
    </section>
  );
}