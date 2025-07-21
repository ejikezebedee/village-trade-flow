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
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Featured Products
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover quality products from rural communities. Each purchase supports local economies and sustainable practices.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="group hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
              <div className="relative">
                <img 
                  src={`https://images.unsplash.com/${product.image}?auto=format&fit=crop&w=400&h=300`}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                >
                  <Heart className="h-4 w-4" />
                </Button>
                <Badge className="absolute top-2 left-2 bg-primary">
                  {product.category}
                </Badge>
              </div>
              
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground mb-1">{product.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{product.seller}</p>
                <p className="text-xs text-muted-foreground mb-3">{product.location}</p>
                
                <div className="flex items-center gap-1 mb-3">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{product.rating}</span>
                  <span className="text-xs text-muted-foreground">({product.reviews} reviews)</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary">{product.price}</span>
                  <Button size="sm" className="h-8">
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <Button variant="outline" size="lg" asChild>
            <a href="/products">View All Products</a>
          </Button>
        </div>
      </div>
    </section>
  );
}